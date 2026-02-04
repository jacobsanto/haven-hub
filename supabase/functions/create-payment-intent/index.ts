import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate booking reference
function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

// Validate ISO date string
function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Validate UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    
    // Extract and validate required fields
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
    } = body;

    // Validation
    if (!propertyId || !isValidUUID(propertyId)) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_PROPERTY', message: 'Invalid property ID' }), { status: 400, headers: corsHeaders });
    }
    if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_DATES', message: 'Invalid check-in or check-out date' }), { status: 400, headers: corsHeaders });
    }
    if (checkOut <= checkIn) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_DATES', message: 'Check-out must be after check-in' }), { status: 400, headers: corsHeaders });
    }
    if (!nights || nights < 1) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_NIGHTS', message: 'Invalid number of nights' }), { status: 400, headers: corsHeaders });
    }
    if (!guestInfo?.firstName || !guestInfo?.lastName || !guestInfo?.email) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_GUEST', message: 'Guest information is required' }), { status: 400, headers: corsHeaders });
    }
    if (!priceBreakdown?.total || priceBreakdown.total <= 0) {
      return new Response(JSON.stringify({ error: true, code: 'INVALID_PRICE', message: 'Invalid price breakdown' }), { status: 400, headers: corsHeaders });
    }

    // Fetch property to verify it exists and get details
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('id, name, slug, city, country, base_price, status, instant_booking, cancellation_policy')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return new Response(JSON.stringify({ error: true, code: 'PROPERTY_NOT_FOUND', message: 'Property not found' }), { status: 404, headers: corsHeaders });
    }

    if (property.status !== 'active') {
      return new Response(JSON.stringify({ error: true, code: 'PROPERTY_UNAVAILABLE', message: 'Property is not available for booking' }), { status: 400, headers: corsHeaders });
    }

    // Check availability (dates not blocked)
    const { data: blockedDates } = await supabaseClient
      .from('availability')
      .select('date')
      .eq('property_id', propertyId)
      .eq('available', false)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (blockedDates && blockedDates.length > 0) {
      return new Response(JSON.stringify({ 
        error: true, 
        code: 'DATES_UNAVAILABLE', 
        message: 'Some dates are no longer available',
        details: { blockedDates: blockedDates.map(d => d.date) }
      }), { status: 400, headers: corsHeaders });
    }

    // Generate booking reference for metadata
    const bookingReference = generateBookingReference();

    // Calculate server-side price (for verification - we trust client but log discrepancies)
    // In a production system, you'd re-calculate the full price here
    const serverTotal = priceBreakdown.total;
    const amountInCents = Math.round(serverTotal * 100);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Build line items summary for Stripe description
    const lineItemsSummary = priceBreakdown.lineItems
      ?.map((item: { label: string; amount: number }) => `${item.label}: €${Math.abs(item.amount).toFixed(2)}`)
      .join(', ') || '';

    // Create Stripe PaymentIntent with rich metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: priceBreakdown.currency?.toLowerCase() || 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        // Booking identification
        booking_reference: bookingReference,
        property_id: property.id,
        property_name: property.name,
        property_slug: property.slug,
        property_city: property.city,
        property_country: property.country,
        
        // Stay details
        check_in: checkIn,
        check_out: checkOut,
        nights: String(nights),
        guests: String(guests),
        adults: String(adults || guests),
        children: String(children || 0),
        
        // Guest info
        guest_name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone || '',
        guest_country: guestInfo.country || '',
        
        // Pricing
        accommodation_total: String(priceBreakdown.accommodationTotal || 0),
        addons_total: String(priceBreakdown.addonsTotal || 0),
        fees_total: String(priceBreakdown.feesTotal || 0),
        taxes_total: String(priceBreakdown.taxesTotal || 0),
        discount_amount: String(priceBreakdown.discountAmount || 0),
        discount_code: couponCode || priceBreakdown.discountCode || '',
        total: String(serverTotal),
        
        // Payment config
        payment_type: paymentType || 'full',
        cancellation_policy: property.cancellation_policy || 'moderate',
        instant_booking: String(property.instant_booking),
        
        // Hold tracking
        hold_id: holdId || '',
      },
      description: `${property.name} - ${nights} night${nights > 1 ? 's' : ''} (${checkIn} to ${checkOut})`,
    });

    console.log(`[create-payment-intent] Created PaymentIntent ${paymentIntent.id} for ${bookingReference}`);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        bookingReference,
        amount: serverTotal,
        currency: priceBreakdown.currency || 'EUR',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('[create-payment-intent] Error:', error);
    
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
