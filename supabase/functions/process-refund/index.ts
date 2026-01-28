import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CancellationRule {
  daysBeforeCheckIn: number;
  refundPercentage: number;
}

function calculateRefundAmount(
  rules: CancellationRule[],
  checkInDate: string,
  totalPaid: number
): { refundAmount: number; refundPercentage: number } {
  const checkIn = new Date(checkInDate);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Sort rules by days descending
  const sortedRules = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn);

  // Find applicable rule
  for (const rule of sortedRules) {
    if (daysUntilCheckIn >= rule.daysBeforeCheckIn) {
      const refundAmount = Math.round((totalPaid * rule.refundPercentage) / 100);
      return { refundAmount, refundPercentage: rule.refundPercentage };
    }
  }

  // Default: no refund
  return { refundAmount: 0, refundPercentage: 0 };
}

interface ProcessRefundRequest {
  bookingId: string;
  reason?: string;
  customAmount?: number; // Optional override
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
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const body: ProcessRefundRequest = await req.json();

    if (!body.bookingId) {
      throw new Error("Missing bookingId");
    }

    // Get booking with payments
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select(`
        *,
        cancellation_policies!left(rules)
      `)
      .eq("id", body.bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Get successful payments
    const { data: payments } = await supabaseClient
      .from("booking_payments")
      .select("*")
      .eq("booking_id", body.bookingId)
      .eq("status", "succeeded");

    if (!payments || payments.length === 0) {
      throw new Error("No successful payments to refund");
    }

    // Get the payment with Stripe payment intent
    const paymentToRefund = payments.find(p => p.stripe_payment_intent_id);
    if (!paymentToRefund) {
      throw new Error("No Stripe payment found for this booking");
    }

    // Calculate refund based on policy
    let refundAmount: number;
    let refundPercentage: number;

    if (body.customAmount !== undefined) {
      // Admin override
      refundAmount = Math.round(body.customAmount * 100); // Convert to cents
      refundPercentage = Math.round((body.customAmount / paymentToRefund.amount) * 100);
    } else {
      // Calculate based on cancellation policy
      const policyRules = booking.cancellation_policies?.rules || [
        { daysBeforeCheckIn: 14, refundPercentage: 100 },
        { daysBeforeCheckIn: 7, refundPercentage: 50 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ];

      const calculation = calculateRefundAmount(
        policyRules as CancellationRule[],
        booking.check_in,
        paymentToRefund.amount
      );
      
      refundAmount = Math.round(calculation.refundAmount * 100); // Convert to cents
      refundPercentage = calculation.refundPercentage;
    }

    if (refundAmount <= 0) {
      // No refund but still mark as cancelled
      await supabaseClient
        .from("bookings")
        .update({ 
          status: "cancelled",
          payment_status: "paid", // Keep as paid, no refund
        })
        .eq("id", body.bookingId);

      return new Response(
        JSON.stringify({
          success: true,
          refundAmount: 0,
          refundPercentage: 0,
          message: "Booking cancelled with no refund per policy",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Process Stripe refund
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentToRefund.stripe_payment_intent_id,
      amount: refundAmount,
      reason: body.reason as Stripe.RefundCreateParams.Reason || "requested_by_customer",
      metadata: {
        booking_id: body.bookingId,
        booking_reference: booking.booking_reference,
        refund_percentage: String(refundPercentage),
      },
    });

    // Update records
    const isFullRefund = refundPercentage >= 100;

    await supabaseClient
      .from("booking_payments")
      .update({
        status: isFullRefund ? "refunded" : "succeeded",
        metadata: {
          ...paymentToRefund.metadata,
          refund_id: refund.id,
          refund_amount: refundAmount / 100,
          refund_percentage: refundPercentage,
          refund_reason: body.reason || "cancellation",
        },
      })
      .eq("id", paymentToRefund.id);

    await supabaseClient
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: isFullRefund ? "refunded" : "partial",
      })
      .eq("id", body.bookingId);

    // Cancel in PMS if synced
    if (booking.external_booking_id) {
      try {
        const { data: mapping } = await supabaseClient
          .from("pms_property_map")
          .select("external_property_id")
          .eq("property_id", booking.property_id)
          .maybeSingle();

        if (mapping) {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/advancecm-sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                action: "cancel-booking",
                externalBookingId: booking.external_booking_id,
              }),
            }
          );
        }
      } catch (pmsError) {
        console.error("PMS cancellation error:", pmsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        refundPercentage,
        status: refund.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Process refund error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Refund failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
