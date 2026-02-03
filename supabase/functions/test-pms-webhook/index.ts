// Test PMS Webhook Edge Function
// Admin-only proxy to test webhook endpoints with the secret token
// This allows testing from the UI without exposing the token to the frontend

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestPayload {
  event: "booking.created" | "booking.cancelled" | "reconciliation.daily";
  data: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Verify admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: TestPayload = await req.json();
    const { event, data } = body;

    if (!event || !data) {
      return new Response(
        JSON.stringify({ error: "Missing event or data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the webhook token from secrets
    const webhookToken = Deno.env.get("PMS_WEBHOOK_TOKEN");
    if (!webhookToken) {
      return new Response(
        JSON.stringify({ error: "PMS_WEBHOOK_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    let targetUrl: string;
    let requestBody: Record<string, unknown>;

    if (event === "reconciliation.daily") {
      // Call pms-reconcile endpoint
      targetUrl = `${supabaseUrl}/functions/v1/pms-reconcile?token=${encodeURIComponent(webhookToken)}`;
      requestBody = { manual: true, test: true };
    } else {
      // Call pms-webhook endpoint for booking events
      targetUrl = `${supabaseUrl}/functions/v1/pms-webhook?token=${encodeURIComponent(webhookToken)}`;
      requestBody = { event, data };
    }

    console.log(`Testing ${event} webhook at ${targetUrl}`);

    // Forward the request to the actual webhook endpoint
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let responseBody: Record<string, unknown>;
    
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseBody,
        testedEvent: event,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Test webhook error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
