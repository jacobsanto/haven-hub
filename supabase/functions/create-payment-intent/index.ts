import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreatePaymentIntentRequest {
  // Property details
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  
  // Stay details
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  
  // Pricing
  accommodationTotal: number;
  addonsTotal: number;
  feesTotal: number;
  taxesTotal: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  currency: string;
  
  // Payment type
  paymentType: 'full' | 'deposit';
  depositPercentage?: number;
  amountDue: number;
  balanceDue?: number;
  
  // Policy
  cancellationPolicyId?: string;
  cancellationPolicyName?: string;
  
  // Guest info
  guestName: string;
  guestEmail: string;
  guestCountry?: string;
  
  // Session
  sessionId: string;
  bookingReference?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Parse request body
    const body: CreatePaymentIntentRequest = await req.json();

    // Validate required fields
    if (!body.propertyId || !body.amountDue || !body.guestEmail) {
      throw new Error("Missing required fields: propertyId, amountDue, guestEmail");
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({
      email: body.guestEmail,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const newCustomer = await stripe.customers.create({
        email: body.guestEmail,
        name: body.guestName,
        metadata: {
          source: "direct_booking",
          country: body.guestCountry || "",
        },
      });
      customerId = newCustomer.id;
    }

    // Build comprehensive metadata for Stripe Dashboard visibility
    const metadata: Record<string, string> = {
      // Booking identification
      booking_reference: body.bookingReference || `BK-${Date.now()}`,
      session_id: body.sessionId,
      
      // Property details
      property_id: body.propertyId,
      property_name: body.propertyName,
      property_slug: body.propertySlug,
      
      // Stay details
      check_in: body.checkIn,
      check_out: body.checkOut,
      nights: String(body.nights),
      guests: String(body.guests),
      adults: String(body.adults),
      children: String(body.children),
      
      // Pricing breakdown
      accommodation_total: body.accommodationTotal.toFixed(2),
      addons_total: body.addonsTotal.toFixed(2),
      fees_total: body.feesTotal.toFixed(2),
      taxes_total: body.taxesTotal.toFixed(2),
      discount_amount: body.discountAmount.toFixed(2),
      total_amount: body.totalAmount.toFixed(2),
      
      // Payment type
      payment_type: body.paymentType,
      deposit_percentage: body.depositPercentage ? String(body.depositPercentage) : "100",
      amount_due: body.amountDue.toFixed(2),
      balance_due: body.balanceDue ? body.balanceDue.toFixed(2) : "0",
      
      // Policy
      cancellation_policy_id: body.cancellationPolicyId || "",
      cancellation_policy_name: body.cancellationPolicyName || "Standard",
      
      // Guest
      guest_name: body.guestName,
      guest_email: body.guestEmail,
      guest_country: body.guestCountry || "",
      
      // Source
      source: "direct_website",
    };

    // Add discount code if present
    if (body.discountCode) {
      metadata.discount_code = body.discountCode;
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(body.amountDue * 100);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: body.currency.toLowerCase(),
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Booking at ${body.propertyName} - ${body.checkIn} to ${body.checkOut}`,
      receipt_email: body.guestEmail,
      statement_descriptor_suffix: body.propertyName.substring(0, 22),
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Create payment intent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
