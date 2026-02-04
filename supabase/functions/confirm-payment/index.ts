import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return new Response(
        JSON.stringify({ error: true, code: 'INVALID_INPUT', message: 'Payment intent ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ 
          error: true, 
          code: 'PAYMENT_NOT_SUCCEEDED', 
          message: `Payment status is ${paymentIntent.status}, expected succeeded`,
          status: paymentIntent.status
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase with service role for atomic writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for existing booking with this payment intent (idempotency)
    const { data: existingBooking } = await supabaseClient
      .from('booking_payments')
      .select('booking_id, bookings(id, booking_reference, status)')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existingBooking?.booking_id) {
      // Already processed - return existing booking info
      console.log(`[confirm-payment] Found existing booking for ${paymentIntentId}`);
      
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('id, booking_reference, check_in, check_out, total_price, properties(name)')
        .eq('id', existingBooking.booking_id)
        .single();

      // deno-lint-ignore no-explicit-any
      const propertyData = (booking as any)?.properties;
      const propertyName = propertyData?.name || 'Unknown Property';

      return new Response(
        JSON.stringify({
          success: true,
          bookingId: booking?.id,
          bookingReference: booking?.booking_reference,
          propertyName,
          checkIn: booking?.check_in,
          checkOut: booking?.check_out,
          totalPaid: booking?.total_price,
          alreadyProcessed: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Extract metadata from PaymentIntent
    const meta = paymentIntent.metadata;
    
    const propertyId = meta.property_id;
    const bookingReference = meta.booking_reference;
    const checkIn = meta.check_in;
    const checkOut = meta.check_out;
    const nights = parseInt(meta.nights) || 1;
    const guests = parseInt(meta.guests) || 1;
    const adults = parseInt(meta.adults) || guests;
    const children = parseInt(meta.children) || 0;
    const guestName = meta.guest_name;
    const guestEmail = meta.guest_email;
    const guestPhone = meta.guest_phone || null;
    const guestCountry = meta.guest_country || null;
    const paymentType = meta.payment_type || 'full';
    const cancellationPolicy = meta.cancellation_policy || 'moderate';
    const instantBooking = meta.instant_booking === 'true';
    const holdId = meta.hold_id || null;

    // Parse amounts from metadata
    const total = parseFloat(meta.total) || (paymentIntent.amount / 100);
    const accommodationTotal = parseFloat(meta.accommodation_total) || 0;
    const addonsTotal = parseFloat(meta.addons_total) || 0;
    const feesTotal = parseFloat(meta.fees_total) || 0;
    const taxesTotal = parseFloat(meta.taxes_total) || 0;
    const discountAmount = parseFloat(meta.discount_amount) || 0;
    const discountCode = meta.discount_code || null;

    console.log(`[confirm-payment] Creating booking ${bookingReference} for property ${propertyId}`);

    // Verify property still exists
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('id, name, city, country')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error(`[confirm-payment] Property ${propertyId} not found`);
      return new Response(
        JSON.stringify({ error: true, code: 'PROPERTY_NOT_FOUND', message: 'Property no longer exists' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Create booking record
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        property_id: propertyId,
        booking_reference: bookingReference,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_country: guestCountry,
        check_in: checkIn,
        check_out: checkOut,
        nights,
        guests,
        adults,
        children,
        total_price: total,
        status: instantBooking ? 'confirmed' : 'pending',
        source: 'direct',
        payment_status: 'paid',
        cancellation_policy: cancellationPolicy,
        pms_sync_status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('[confirm-payment] Booking creation failed:', bookingError);
      return new Response(
        JSON.stringify({ error: true, code: 'BOOKING_FAILED', message: bookingError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[confirm-payment] Created booking ${booking.id}`);

    // 2. Create price breakdown records
    const breakdownItems = [];
    
    if (accommodationTotal > 0) {
      breakdownItems.push({
        booking_id: booking.id,
        line_type: 'accommodation',
        label: `${nights} night${nights > 1 ? 's' : ''} accommodation`,
        amount: accommodationTotal,
        quantity: nights,
      });
    }
    
    if (addonsTotal > 0) {
      breakdownItems.push({
        booking_id: booking.id,
        line_type: 'addon',
        label: 'Add-ons',
        amount: addonsTotal,
        quantity: 1,
      });
    }
    
    if (feesTotal > 0) {
      breakdownItems.push({
        booking_id: booking.id,
        line_type: 'fee',
        label: 'Fees',
        amount: feesTotal,
        quantity: 1,
      });
    }
    
    if (taxesTotal > 0) {
      breakdownItems.push({
        booking_id: booking.id,
        line_type: 'tax',
        label: 'Taxes',
        amount: taxesTotal,
        quantity: 1,
      });
    }
    
    if (discountAmount > 0) {
      breakdownItems.push({
        booking_id: booking.id,
        line_type: 'discount',
        label: discountCode ? `Discount (${discountCode})` : 'Discount',
        amount: -discountAmount,
        quantity: 1,
      });
    }

    if (breakdownItems.length > 0) {
      await supabaseClient.from('booking_price_breakdown').insert(breakdownItems);
    }

    // 3. Create payment record
    const { error: paymentError } = await supabaseClient
      .from('booking_payments')
      .insert({
        booking_id: booking.id,
        payment_type: paymentType === 'deposit' ? 'deposit' : 'full',
        amount: total,
        currency: paymentIntent.currency.toUpperCase(),
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : null,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
      });

    if (paymentError) {
      console.error('[confirm-payment] Payment record creation failed:', paymentError);
      // Don't fail the request - booking is created, payment record is secondary
    }

    // 4. Release checkout hold if exists
    if (holdId) {
      await supabaseClient
        .from('checkout_holds')
        .update({ released: true })
        .eq('id', holdId);
    }

    // 5. Trigger PMS sync (async, non-blocking)
    if (instantBooking) {
      // Fire-and-forget PMS sync
      supabaseClient.functions.invoke('advancecm-sync', {
        body: {
          action: 'create-booking',
          bookingId: booking.id,
        },
      }).catch(err => {
        console.error('[confirm-payment] PMS sync trigger failed:', err);
      });
    }

    console.log(`[confirm-payment] Successfully confirmed booking ${bookingReference}`);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        bookingReference,
        propertyName: property.name,
        checkIn,
        checkOut,
        totalPaid: total,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('[confirm-payment] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
