import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
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
        // Fallback for development without webhook secret
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
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Handle payment_intent.succeeded webhook
 * This is a backup mechanism - bookings should already be created by confirm-payment
 */
async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata;

  console.log("Payment succeeded webhook for:", paymentIntentId);

  // Check if booking already exists
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
    
    // Update payment status if needed
    if (existingPayment.booking_id) {
      await supabase
        .from("booking_payments")
        .update({
          status: "succeeded",
          paid_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id);
    }
    return;
  }

  // If no booking exists, this is a recovery scenario
  // The booking should have been created by confirm-payment, but we log this for monitoring
  console.warn("Payment succeeded but no booking found - requires manual review:", {
    paymentIntentId,
    metadata,
    amount: paymentIntent.amount,
  });

  // Log to audit table for admin visibility
  await supabase.from("audit_log").insert({
    action: "PAYMENT_ORPHANED",
    entity_type: "payment_intent",
    entity_id: paymentIntentId,
    new_values: {
      payment_intent_id: paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata,
      message: "Payment succeeded but booking creation may have failed",
    },
  });
}

/**
 * Handle payment_intent.payment_failed webhook
 */
async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  
  console.log("Payment failed webhook for:", paymentIntentId);

  // Check if there's a pending booking
  const { data: pendingPayment } = await supabase
    .from("booking_payments")
    .select("id, booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingPayment?.booking_id) {
    // Update booking status to reflect payment failure
    await supabase
      .from("booking_payments")
      .update({ status: "failed" })
      .eq("id", pendingPayment.id);

    console.log("Updated payment status to failed for booking:", pendingPayment.booking_id);
  }
}

/**
 * Handle charge.refunded webhook
 */
async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  
  console.log("Charge refunded webhook for payment:", paymentIntentId);

  // Find the booking payment
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

  // Update payment status
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

  // If full refund, update booking status to cancelled
  if (isFullRefund && payment.booking_id) {
    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "refunded",
      })
      .eq("id", payment.booking_id);

    console.log("Booking cancelled due to full refund:", payment.booking_id);
  }
}
