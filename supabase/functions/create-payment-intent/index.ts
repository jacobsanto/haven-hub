import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Zod validation schema for payment intent request
const paymentIntentSchema = z.object({
  propertyId: z.string().uuid(),
  propertyName: z.string().min(1).max(200),
  propertySlug: z.string().min(1).max(100),
  propertyCity: z.string().max(100).optional().default(""),
  propertyCountry: z.string().max(100).optional().default(""),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  nights: z.number().int().positive().max(365),
  guests: z.number().int().positive().max(50),
  adults: z.number().int().positive().max(50),
  children: z.number().int().min(0).max(50),
  accommodationTotal: z.number().min(0),
  addonsTotal: z.number().min(0),
  feesTotal: z.number().min(0),
  taxesTotal: z.number().min(0),
  discountAmount: z.number().min(0),
  discountCode: z.string().max(50).optional(),
  totalAmount: z.number().positive().max(1000000),
  currency: z.string().length(3),
  paymentType: z.enum(['full', 'deposit']),
  depositPercentage: z.number().min(1).max(100).optional(),
  amountDue: z.number().positive().max(1000000),
  balanceDue: z.number().min(0).optional(),
  cancellationPolicyId: z.string().uuid().optional(),
  cancellationPolicyName: z.string().max(100).optional(),
  guestName: z.string().min(1).max(200),
  guestEmail: z.string().email().max(255),
  guestCountry: z.string().max(100).optional(),
  sessionId: z.string().min(10).max(100),
  bookingReference: z.string().max(50).optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "checkOut must be after checkIn" }
);

type CreatePaymentIntentRequest = z.infer<typeof paymentIntentSchema>;

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
    // Parse and validate request body
    const rawBody = await req.json();
    const validation = paymentIntentSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const body: CreatePaymentIntentRequest = validation.data;

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
      property_city: body.propertyCity || "",
      property_country: body.propertyCountry || "",
      
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
      description: `Booking at ${body.propertyName}, ${body.propertyCity || "Property"} - ${body.checkIn} to ${body.checkOut}`,
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
