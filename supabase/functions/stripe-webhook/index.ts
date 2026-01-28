import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeSecretKey || !webhookSecret) {
    console.error("Missing Stripe configuration");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingReference = paymentIntent.metadata.booking_reference;
        
        if (bookingReference) {
          // Update payment record
          const { error } = await supabaseClient
            .from("booking_payments")
            .update({
              status: "succeeded",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq("stripe_payment_intent_id", paymentIntent.id);

          if (error) {
            console.error("Failed to update payment on success:", error);
          }

          // Update booking if full payment
          if (paymentIntent.metadata.payment_type === "full") {
            await supabaseClient
              .from("bookings")
              .update({ payment_status: "paid" })
              .eq("booking_reference", bookingReference);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabaseClient
          .from("booking_payments")
          .update({
            status: "failed",
            metadata: {
              failure_code: paymentIntent.last_payment_error?.code,
              failure_message: paymentIntent.last_payment_error?.message,
            },
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        
        // Get the refund details
        const refundAmount = charge.amount_refunded / 100;
        const isFullRefund = charge.refunded;

        // Update booking_payments
        await supabaseClient
          .from("booking_payments")
          .update({
            status: isFullRefund ? "refunded" : "succeeded",
            metadata: {
              refund_amount: refundAmount,
              refund_id: charge.refunds?.data[0]?.id,
            },
          })
          .eq("stripe_payment_intent_id", paymentIntentId);

        // Update booking status
        const { data: payment } = await supabaseClient
          .from("booking_payments")
          .select("booking_id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single();

        if (payment?.booking_id) {
          await supabaseClient
            .from("bookings")
            .update({ 
              payment_status: isFullRefund ? "refunded" : "partial",
              status: isFullRefund ? "cancelled" : "confirmed",
            })
            .eq("id", payment.booking_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook failed" }),
      { status: 400, headers: corsHeaders }
    );
  }
});
