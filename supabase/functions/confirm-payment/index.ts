import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Zod validation schemas
const guestInfoSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  specialRequests: z.string().max(2000).optional(),
});

const lineItemSchema = z.object({
  type: z.string(),
  label: z.string(),
  amount: z.number(),
  details: z.string().optional(),
});

const selectedAddonSchema = z.object({
  addon: z.object({
    id: z.string().uuid(),
    price: z.number(),
  }),
  quantity: z.number().int().positive(),
  calculatedPrice: z.number(),
  guestCount: z.number().int().positive().optional(),
  scheduledDate: z.string().optional(),
});

const bookingPayloadSchema = z.object({
  propertyId: z.string().uuid(),
  propertyName: z.string().min(1).max(200),
  propertySlug: z.string().min(1).max(100),
  instantBooking: z.boolean(),
  bookingReference: z.string().max(50),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().positive().max(365),
  guests: z.number().int().positive().max(50),
  adults: z.number().int().positive().max(50),
  children: z.number().int().min(0).max(50),
  guestInfo: guestInfoSchema,
  totalPrice: z.number().positive().max(1000000),
  paymentType: z.enum(['full', 'deposit']),
  depositAmount: z.number().min(0).optional(),
  cancellationPolicy: z.string().max(100),
  holdId: z.string().uuid().optional(),
  priceBreakdown: z.object({
    lineItems: z.array(lineItemSchema),
  }),
  selectedAddons: z.array(selectedAddonSchema),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().regex(/^pi_/, "Invalid payment intent ID"),
  paymentType: z.enum(['full', 'deposit']),
  bookingId: z.string().uuid().optional(),
  bookingPayload: bookingPayloadSchema.optional(),
}).refine(
  (data) => data.bookingId || data.bookingPayload,
  { message: "Either bookingId or bookingPayload is required" }
);

type BookingPayload = z.infer<typeof bookingPayloadSchema>;
type ConfirmPaymentRequest = z.infer<typeof confirmPaymentSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Parse and validate request body
    const rawBody = await req.json();
    const validation = confirmPaymentSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const body: ConfirmPaymentRequest = validation.data;

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Get the charge for additional details
    const charges = await stripe.charges.list({
      payment_intent: body.paymentIntentId,
      limit: 1,
    });
    const charge = charges.data[0];

    let bookingId = body.bookingId;
    let bookingReference = body.bookingPayload?.bookingReference;

    // If bookingPayload provided, create booking atomically after payment verification
    if (body.bookingPayload && !body.bookingId) {
      const payload = body.bookingPayload;
      const guestName = `${payload.guestInfo.firstName} ${payload.guestInfo.lastName}`;

      // Determine initial status based on instant_booking
      const initialStatus = payload.instantBooking ? 'confirmed' : 'pending';
      const paymentStatus = body.paymentType === 'deposit' ? 'partial' : 'paid';

      // 1. Create booking record
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .insert({
          property_id: payload.propertyId,
          booking_reference: payload.bookingReference,
          guest_name: guestName,
          guest_email: payload.guestInfo.email,
          guest_phone: payload.guestInfo.phone || null,
          guest_country: payload.guestInfo.country || null,
          check_in: payload.checkIn,
          check_out: payload.checkOut,
          nights: payload.nights,
          guests: payload.guests,
          adults: payload.adults,
          children: payload.children,
          total_price: payload.totalPrice,
          status: initialStatus,
          source: 'direct',
          payment_status: paymentStatus,
          special_requests: payload.guestInfo.specialRequests || null,
          cancellation_policy: payload.cancellationPolicy,
          pms_sync_status: 'pending',
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Failed to create booking:", bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      bookingId = booking.id;
      bookingReference = booking.booking_reference;

      // 2. Insert price breakdown line items
      if (payload.priceBreakdown?.lineItems?.length > 0) {
        const breakdownItems = payload.priceBreakdown.lineItems.map(item => ({
          booking_id: booking.id,
          line_type: item.type,
          label: item.label,
          amount: item.type === 'discount' ? -Math.abs(item.amount) : item.amount,
          quantity: 1,
          details: item.details ? { notes: item.details } : null,
        }));

        const { error: breakdownError } = await supabaseClient
          .from("booking_price_breakdown")
          .insert(breakdownItems);

        if (breakdownError) {
          console.error("Failed to insert price breakdown:", breakdownError);
        }
      }

      // 3. Insert booking addons
      if (payload.selectedAddons?.length > 0) {
        const addonItems = payload.selectedAddons.map(selected => ({
          booking_id: booking.id,
          addon_id: selected.addon.id,
          quantity: selected.quantity,
          unit_price: selected.addon.price,
          total_price: selected.calculatedPrice,
          guest_count: selected.guestCount || null,
          scheduled_date: selected.scheduledDate || null,
          status: 'pending',
        }));

        const { error: addonsError } = await supabaseClient
          .from("booking_addons")
          .insert(addonItems);

        if (addonsError) {
          console.error("Failed to insert booking addons:", addonsError);
        }
      }

      // 4. Create payment record with Stripe details
      const { error: paymentError } = await supabaseClient
        .from("booking_payments")
        .insert({
          booking_id: booking.id,
          payment_type: body.paymentType === 'deposit' ? 'deposit' : 'full',
          amount: body.paymentType === 'deposit' 
            ? (payload.depositAmount || payload.totalPrice * 0.3) 
            : payload.totalPrice,
          currency: 'EUR',
          status: 'succeeded',
          stripe_payment_intent_id: body.paymentIntentId,
          stripe_charge_id: charge?.id || null,
          paid_at: new Date().toISOString(),
          payment_method: charge?.payment_method_details?.type || 'card',
          metadata: {
            stripe_receipt_url: charge?.receipt_url,
            stripe_payment_method_id: paymentIntent.payment_method,
          },
        });

      if (paymentError) {
        console.error("Failed to create payment record:", paymentError);
      }

      // 5. Release checkout hold if exists
      if (payload.holdId) {
        await supabaseClient
          .from("checkout_holds")
          .update({ released: true })
          .eq("id", payload.holdId);
      }

      // 6. If instant booking, trigger PMS sync
      if (payload.instantBooking) {
        const { data: mapping } = await supabaseClient
          .from("pms_property_map")
          .select("external_property_id")
          .eq("property_id", payload.propertyId)
          .eq("sync_enabled", true)
          .maybeSingle();

        if (mapping?.external_property_id) {
          try {
            const syncResponse = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/advancecm-sync`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  action: "create-booking",
                  externalPropertyId: mapping.external_property_id,
                  bookingReference: payload.bookingReference,
                  checkIn: payload.checkIn,
                  checkOut: payload.checkOut,
                  guests: payload.guests,
                  adults: payload.adults,
                  children: payload.children,
                  guestInfo: payload.guestInfo,
                  totalPrice: payload.totalPrice,
                  currency: "EUR",
                  priceBreakdownNotes: `Payment confirmed via Stripe`,
                }),
              }
            );

            const syncResult = await syncResponse.json();
            
            if (syncResult.success) {
              await supabaseClient
                .from("bookings")
                .update({
                  pms_sync_status: "synced",
                  pms_synced_at: new Date().toISOString(),
                  external_booking_id: syncResult.externalBookingId,
                })
                .eq("id", booking.id);
            }
          } catch (syncError) {
            console.error("PMS sync error:", syncError);
            await supabaseClient
              .from("bookings")
              .update({
                pms_sync_status: "failed",
                pms_last_error: syncError instanceof Error ? syncError.message : "Sync failed",
              })
              .eq("id", booking.id);
          }
        }
      }
    } else if (bookingId) {
      // Legacy flow: Update existing booking
      const { error: paymentError } = await supabaseClient
        .from("booking_payments")
        .update({
          stripe_payment_intent_id: body.paymentIntentId,
          stripe_charge_id: charge?.id || null,
          status: "succeeded",
          paid_at: new Date().toISOString(),
          payment_method: charge?.payment_method_details?.type || "card",
          metadata: {
            stripe_receipt_url: charge?.receipt_url,
            stripe_payment_method_id: paymentIntent.payment_method,
          },
        })
        .eq("booking_id", bookingId)
        .eq("status", "pending");

      if (paymentError) {
        console.error("Failed to update payment record:", paymentError);
      }

      const paymentStatus = body.paymentType === "deposit" ? "partial" : "paid";
      
      const { error: bookingError } = await supabaseClient
        .from("bookings")
        .update({ payment_status: paymentStatus })
        .eq("id", bookingId);

      if (bookingError) {
        console.error("Failed to update booking status:", bookingError);
      }

      // Get booking for reference
      const { data: booking } = await supabaseClient
        .from("bookings")
        .select("booking_reference")
        .eq("id", bookingId)
        .single();

      bookingReference = booking?.booking_reference;

      // Check for PMS sync (legacy)
      const { data: bookingFull } = await supabaseClient
        .from("bookings")
        .select(`*, property:properties(id, name, instant_booking)`)
        .eq("id", bookingId)
        .single();

      if (bookingFull?.property?.instant_booking) {
        const { data: mapping } = await supabaseClient
          .from("pms_property_map")
          .select("external_property_id")
          .eq("property_id", bookingFull.property_id)
          .eq("sync_enabled", true)
          .maybeSingle();

        if (mapping?.external_property_id) {
          try {
            const nameParts = bookingFull.guest_name.split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const syncResponse = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/advancecm-sync`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  action: "create-booking",
                  externalPropertyId: mapping.external_property_id,
                  bookingReference: bookingFull.booking_reference,
                  checkIn: bookingFull.check_in,
                  checkOut: bookingFull.check_out,
                  guests: bookingFull.guests,
                  adults: bookingFull.adults || bookingFull.guests,
                  children: bookingFull.children || 0,
                  guestInfo: { firstName, lastName, email: bookingFull.guest_email, phone: bookingFull.guest_phone, country: bookingFull.guest_country },
                  totalPrice: bookingFull.total_price,
                  currency: "EUR",
                  priceBreakdownNotes: `Payment confirmed via Stripe`,
                }),
              }
            );

            const syncResult = await syncResponse.json();
            
            if (syncResult.success) {
              await supabaseClient
                .from("bookings")
                .update({
                  pms_sync_status: "synced",
                  pms_synced_at: new Date().toISOString(),
                  external_booking_id: syncResult.externalBookingId,
                })
                .eq("id", bookingId);
            }
          } catch (syncError) {
            console.error("PMS sync error:", syncError);
            await supabaseClient
              .from("bookings")
              .update({
                pms_sync_status: "failed",
                pms_last_error: syncError instanceof Error ? syncError.message : "Sync failed",
              })
              .eq("id", bookingId);
          }
        }
      }
    } else {
      throw new Error("Missing bookingId or bookingPayload");
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        bookingReference,
        receiptUrl: charge?.receipt_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Confirm payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});