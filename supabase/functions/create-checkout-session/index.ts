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
    const body = await req.json();
    
    const {
      propertyId,
      checkIn,
      checkOut,
      nights,
      guests,
      adults,
      children,
      guestInfo,
      selectedAddons,
      priceBreakdown,
      paymentType,
      holdId,
      couponCode,
      successUrl,
      cancelUrl,
    } = body;

    // Validate required fields
    if (!propertyId || !checkIn || !checkOut || !guestInfo?.email) {
      return new Response(
        JSON.stringify({ error: true, code: 'INVALID_INPUT', message: 'Missing required booking fields' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify property exists and is active
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, slug, city, country, instant_booking, cancellation_policy')
      .eq('id', propertyId)
      .eq('status', 'active')
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: true, code: 'PROPERTY_NOT_FOUND', message: 'Property not found or unavailable' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate booking reference
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `BK-${datePrefix}-${randomSuffix}`;

    // Calculate total in cents
    const total = priceBreakdown?.total || 0;
    const totalCents = Math.round(total * 100);

    if (totalCents < 50) {
      return new Response(
        JSON.stringify({ error: true, code: 'INVALID_AMOUNT', message: 'Booking amount too low' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Build line items for display on Stripe Checkout page
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Main accommodation line item
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${property.name} - ${nights} night${nights > 1 ? 's' : ''}`,
          description: `${checkIn} to ${checkOut} · ${guests} guest${guests > 1 ? 's' : ''}`,
        },
        unit_amount: totalCents,
      },
      quantity: 1,
    });

    // Determine redirect URLs
    const origin = successUrl?.split('/payment-success')[0] || cancelUrl?.split('/checkout')[0] || Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '';
    
    const finalSuccessUrl = successUrl || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${origin}/checkout?property=${property.slug}&resume=true`;

    // Build metadata (Stripe has 500 char limit per value, 50 keys max)
    const metadata: Record<string, string> = {
      booking_reference: bookingReference,
      property_id: propertyId,
      property_slug: property.slug,
      check_in: checkIn,
      check_out: checkOut,
      nights: String(nights),
      guests: String(guests),
      adults: String(adults || guests),
      children: String(children || 0),
      guest_name: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
      guest_email: guestInfo.email,
      guest_phone: guestInfo.phone || '',
      guest_country: guestInfo.country || '',
      special_requests: (guestInfo.specialRequests || '').slice(0, 450),
      payment_type: paymentType || 'full',
      instant_booking: String(property.instant_booking),
      cancellation_policy: property.cancellation_policy || 'moderate',
      total: String(total),
      accommodation_total: String(priceBreakdown?.accommodationTotal || 0),
      addons_total: String(priceBreakdown?.addonsTotal || 0),
      fees_total: String(priceBreakdown?.feesTotal || 0),
      taxes_total: String(priceBreakdown?.taxesTotal || 0),
      discount_amount: String(priceBreakdown?.discountAmount || 0),
      discount_code: couponCode || '',
    };

    if (holdId) {
      metadata.hold_id = holdId;
    }

    // Serialize selected addons if present
    if (selectedAddons && selectedAddons.length > 0) {
      const addonsCompact = selectedAddons.map((a: { addonId: string; quantity: number; calculatedPrice: number }) => 
        `${a.addonId}:${a.quantity}:${a.calculatedPrice}`
      ).join('|');
      if (addonsCompact.length <= 500) {
        metadata.addons_data = addonsCompact;
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: guestInfo.email,
      line_items: lineItems,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      payment_intent_data: {
        metadata, // Also attach to PaymentIntent for webhook access
      },
    });

    console.log(`[create-checkout-session] Created session ${session.id} for booking ${bookingReference}`);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        bookingReference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('[create-checkout-session] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : 'Failed to create checkout session' 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
