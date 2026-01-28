import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConfirmPaymentRequest {
  paymentIntentId: string;
  bookingId: string;
  paymentType: 'full' | 'deposit';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body: ConfirmPaymentRequest = await req.json();

    if (!body.paymentIntentId || !body.bookingId) {
      throw new Error("Missing required fields");
    }

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

    // Update booking_payments with Stripe details
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
      .eq("booking_id", body.bookingId)
      .eq("status", "pending");

    if (paymentError) {
      console.error("Failed to update payment record:", paymentError);
    }

    // Update booking payment_status
    const paymentStatus = body.paymentType === "deposit" ? "partial" : "paid";
    
    const { error: bookingError } = await supabaseClient
      .from("bookings")
      .update({
        payment_status: paymentStatus,
      })
      .eq("id", body.bookingId);

    if (bookingError) {
      console.error("Failed to update booking status:", bookingError);
    }

    // Get booking details for PMS sync
    const { data: booking } = await supabaseClient
      .from("bookings")
      .select(`
        *,
        property:properties(id, name, instant_booking)
      `)
      .eq("id", body.bookingId)
      .single();

    // If instant booking, trigger PMS sync
    let pmsSynced = false;
    if (booking?.property?.instant_booking) {
      // Get PMS mapping
      const { data: mapping } = await supabaseClient
        .from("pms_property_map")
        .select("external_property_id")
        .eq("property_id", booking.property_id)
        .eq("sync_enabled", true)
        .maybeSingle();

      if (mapping?.external_property_id) {
        try {
          // Trigger PMS sync via edge function
          const nameParts = booking.guest_name.split(" ");
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
                bookingReference: booking.booking_reference,
                checkIn: booking.check_in,
                checkOut: booking.check_out,
                guests: booking.guests,
                adults: booking.adults || booking.guests,
                children: booking.children || 0,
                guestInfo: {
                  firstName,
                  lastName,
                  email: booking.guest_email,
                  phone: booking.guest_phone,
                  country: booking.guest_country,
                },
                totalPrice: booking.total_price,
                currency: "EUR",
                priceBreakdownNotes: `Payment confirmed via Stripe`,
              }),
            }
          );

          const syncResult = await syncResponse.json();
          
          if (syncResult.success) {
            pmsSynced = true;
            await supabaseClient
              .from("bookings")
              .update({
                pms_sync_status: "synced",
                pms_synced_at: new Date().toISOString(),
                external_booking_id: syncResult.externalBookingId,
              })
              .eq("id", body.bookingId);
          }
        } catch (syncError) {
          console.error("PMS sync error:", syncError);
          await supabaseClient
            .from("bookings")
            .update({
              pms_sync_status: "failed",
              pms_last_error: syncError instanceof Error ? syncError.message : "Sync failed",
            })
            .eq("id", body.bookingId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus,
        pmsSynced,
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
