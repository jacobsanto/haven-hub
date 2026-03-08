import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ error: true, message: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment not completed',
          status: session.payment_status 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const paymentIntentId = session.payment_intent as string;
    const meta = session.metadata || {};

    // Look for booking by payment intent
    const { data: payment } = await supabase
      .from('booking_payments')
      .select(`
        id,
        booking_id,
        amount,
        bookings (
          id,
          booking_reference,
          check_in,
          check_out,
          total_price,
          properties (
            name
          )
        )
      `)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (payment?.bookings) {
      // deno-lint-ignore no-explicit-any
      const bookingData = payment.bookings as any;
      const propertyName = bookingData.properties?.name || 'Your property';

      return new Response(
        JSON.stringify({
          success: true,
          booking: {
            bookingReference: bookingData.booking_reference,
            propertyName,
            checkIn: bookingData.check_in,
            checkOut: bookingData.check_out,
            totalPaid: bookingData.total_price,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Booking not yet created by webhook - return pending status with metadata
    return new Response(
      JSON.stringify({
        success: true,
        pending: true,
        bookingReference: meta.booking_reference,
        propertyName: meta.property_slug,
        checkIn: meta.check_in,
        checkOut: meta.check_out,
        amount: (session.amount_total || 0) / 100,
        message: 'Payment received, booking being processed',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[verify-checkout-session] Error ${errorId}:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: 'Unable to verify payment session. Please contact support.',
        error_id: errorId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
