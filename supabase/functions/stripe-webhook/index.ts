import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase: SupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature) {
      console.log("Missing Stripe signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } else {
        event = JSON.parse(body) as Stripe.Event;
        console.warn("No STRIPE_WEBHOOK_SECRET set - skipping signature verification");
      }
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing webhook event:", event.type, event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, stripe, session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(supabase, charge);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Webhook processing error ${errorId}:`, error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed", error_id: errorId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Handle checkout.session.completed - PRIMARY booking creation path
 */
async function handleCheckoutSessionCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const sessionId = session.id;
  const paymentIntentId = session.payment_intent as string;
  const meta = session.metadata || {};

  console.log("[webhook] Checkout session completed:", sessionId);

  // Idempotency check: see if booking already exists
  const { data: existingPayment } = await supabase
    .from("booking_payments")
    .select("id, booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existingPayment?.booking_id) {
    console.log("[webhook] Booking already exists for session:", sessionId);
    return;
  }

  // Extract metadata
  const propertyId = meta.property_id;
  const bookingReference = meta.booking_reference;
  const checkIn = meta.check_in;
  const checkOut = meta.check_out;
  const nights = parseInt(meta.nights) || 1;
  const guests = parseInt(meta.guests) || 1;
  const adults = parseInt(meta.adults) || guests;
  const children = parseInt(meta.children) || 0;
  const guestName = meta.guest_name;
  const guestEmail = meta.guest_email || session.customer_email;
  const guestPhone = meta.guest_phone || null;
  const guestCountry = meta.guest_country || null;
  const specialRequests = meta.special_requests || null;
  const paymentType = meta.payment_type || "full";
  const cancellationPolicy = meta.cancellation_policy || "moderate";
  const instantBooking = meta.instant_booking === "true";
  const holdId = meta.hold_id || null;

  // Parse amounts
  const total = parseFloat(meta.total) || (session.amount_total || 0) / 100;
  const accommodationTotal = parseFloat(meta.accommodation_total) || 0;
  const addonsTotal = parseFloat(meta.addons_total) || 0;
  const feesTotal = parseFloat(meta.fees_total) || 0;
  const taxesTotal = parseFloat(meta.taxes_total) || 0;
  const discountAmount = parseFloat(meta.discount_amount) || 0;
  const discountCode = meta.discount_code || null;

  if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail) {
    console.error("[webhook] Missing required metadata in session:", sessionId);
    await logOrphanedPayment(supabase, sessionId, paymentIntentId, meta, "MISSING_METADATA");
    return;
  }

  // Verify property exists
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name")
    .eq("id", propertyId)
    .single();

  if (propertyError || !property) {
    console.error("[webhook] Property not found:", propertyId);
    await logOrphanedPayment(supabase, sessionId, paymentIntentId, meta, "PROPERTY_NOT_FOUND");
    return;
  }

  console.log(`[webhook] Creating booking ${bookingReference} for ${property.name}`);

  // Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      property_id: propertyId,
      booking_reference: bookingReference,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      guest_country: guestCountry,
      special_requests: specialRequests,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      guests,
      adults,
      children,
      total_price: total,
      status: instantBooking ? "confirmed" : "pending",
      source: "direct",
      payment_status: "paid",
      cancellation_policy: cancellationPolicy,
      pms_sync_status: "pending",
    })
    .select()
    .single();

  if (bookingError) {
    console.error("[webhook] Booking creation failed:", bookingError);
    await logOrphanedPayment(supabase, sessionId, paymentIntentId, meta, "BOOKING_FAILED");
    return;
  }

  console.log(`[webhook] Created booking ${booking.id}`);

  // Create price breakdown records
  const breakdownItems = [];
  if (accommodationTotal > 0) {
    breakdownItems.push({
      booking_id: booking.id,
      line_type: "accommodation",
      label: `${nights} night${nights > 1 ? "s" : ""} accommodation`,
      amount: accommodationTotal,
      quantity: nights,
    });
  }
  if (addonsTotal > 0) {
    breakdownItems.push({
      booking_id: booking.id,
      line_type: "addon",
      label: "Add-ons",
      amount: addonsTotal,
      quantity: 1,
    });
  }
  if (feesTotal > 0) {
    breakdownItems.push({
      booking_id: booking.id,
      line_type: "fee",
      label: "Fees",
      amount: feesTotal,
      quantity: 1,
    });
  }
  if (taxesTotal > 0) {
    breakdownItems.push({
      booking_id: booking.id,
      line_type: "tax",
      label: "Taxes",
      amount: taxesTotal,
      quantity: 1,
    });
  }
  if (discountAmount > 0) {
    breakdownItems.push({
      booking_id: booking.id,
      line_type: "discount",
      label: discountCode ? `Discount (${discountCode})` : "Discount",
      amount: -discountAmount,
      quantity: 1,
    });
  }

  if (breakdownItems.length > 0) {
    await supabase.from("booking_price_breakdown").insert(breakdownItems);
  }

  // Create payment record
  await supabase.from("booking_payments").insert({
    booking_id: booking.id,
    payment_type: paymentType === "deposit" ? "deposit" : "full",
    amount: total,
    currency: (session.currency || "EUR").toUpperCase(),
    stripe_payment_intent_id: paymentIntentId,
    status: "succeeded",
    paid_at: new Date().toISOString(),
    payment_method: "card",
    metadata: { session_id: sessionId },
  });

  // Release checkout hold if exists
  if (holdId) {
    await supabase.from("checkout_holds").update({ released: true }).eq("id", holdId);
  }

  // Trigger PMS sync for instant bookings
  if (instantBooking) {
    supabase.functions
      .invoke("advancecm-sync", {
        body: { action: "create-booking", bookingId: booking.id },
      })
      .catch((err: Error) => console.error("[webhook] PMS sync trigger failed:", err));
  }

  console.log(`[webhook] Successfully processed session ${sessionId} -> booking ${bookingReference}`);
}

/**
 * Handle payment_intent.succeeded - fallback/backup
 */
async function handlePaymentSucceeded(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent
) {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata;

  console.log("Payment succeeded webhook for:", paymentIntentId);

  const { data: existingPayment, error: checkError } = await supabase
    .from("booking_payments")
    .select("id, booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking existing payment:", checkError);
    return;
  }

  if (existingPayment) {
    console.log("Booking already exists for payment:", paymentIntentId);
    if (existingPayment.booking_id) {
      await supabase
        .from("booking_payments")
        .update({ status: "succeeded", paid_at: new Date().toISOString() })
        .eq("id", existingPayment.id);
    }
    return;
  }

  // Log for manual review - checkout.session.completed should have handled this
  console.warn("Payment succeeded but no booking found:", {
    paymentIntentId,
    metadata,
    amount: paymentIntent.amount,
  });

  await logOrphanedPayment(
    supabase,
    null,
    paymentIntentId,
    metadata,
    "PAYMENT_ORPHANED"
  );
}

/**
 * Handle payment_intent.payment_failed
 */
async function handlePaymentFailed(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent
) {
  const paymentIntentId = paymentIntent.id;
  console.log("Payment failed webhook for:", paymentIntentId);

  const { data: pendingPayment } = await supabase
    .from("booking_payments")
    .select("id, booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingPayment?.booking_id) {
    await supabase
      .from("booking_payments")
      .update({ status: "failed" })
      .eq("id", pendingPayment.id);

    console.log("Updated payment status to failed for booking:", pendingPayment.booking_id);
  }
}

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(
  supabase: SupabaseClient,
  charge: Stripe.Charge
) {
  const paymentIntentId = charge.payment_intent as string;
  console.log("Charge refunded webhook for payment:", paymentIntentId);

  const { data: payment, error } = await supabase
    .from("booking_payments")
    .select("id, booking_id, amount")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error || !payment) {
    console.warn("No payment found for refunded charge:", paymentIntentId);
    return;
  }

  const refundedAmount = charge.amount_refunded / 100;
  const isFullRefund = refundedAmount >= payment.amount;

  await supabase
    .from("booking_payments")
    .update({
      status: isFullRefund ? "refunded" : "partial_refund",
      metadata: {
        refunded_amount: refundedAmount,
        refund_date: new Date().toISOString(),
      },
    })
    .eq("id", payment.id);

  if (isFullRefund && payment.booking_id) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled", payment_status: "refunded" })
      .eq("id", payment.booking_id);

    console.log("Booking cancelled due to full refund:", payment.booking_id);
  }
}

/**
 * Log orphaned payment for admin review
 */
async function logOrphanedPayment(
  supabase: SupabaseClient,
  sessionId: string | null,
  paymentIntentId: string | null,
  metadata: Record<string, string>,
  reason: string
) {
  await supabase.from("audit_log").insert({
    action: reason,
    entity_type: "payment",
    entity_id: paymentIntentId || sessionId,
    new_values: {
      session_id: sessionId,
      payment_intent_id: paymentIntentId,
      metadata,
      message: `Payment requires manual review: ${reason}`,
    },
  });
}
