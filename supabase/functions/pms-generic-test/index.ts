import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  authType: z.enum(["api_key", "oauth2_client_credentials", "bearer_token"]),
  baseUrl: z.string().url(),
  tokenUrl: z.string().url().optional(),
  tokenScope: z.string().optional(),
  credentials: z.record(z.string()),
  healthCheckEndpoint: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get("healthCheck") === "true") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.json();
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: parsed.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { authType, baseUrl, tokenUrl, tokenScope, credentials, healthCheckEndpoint } = parsed.data;

    let testHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Authenticate based on auth type
    switch (authType) {
      case "api_key": {
        // Try common patterns: api_key in header or query param
        const apiKey = credentials.api_key || Object.values(credentials)[0];
        if (!apiKey) throw new Error("No API key provided");
        testHeaders["X-Api-Key"] = apiKey;
        // Also try Authorization header
        testHeaders["Authorization"] = `ApiKey ${apiKey}`;
        break;
      }

      case "bearer_token": {
        const token = credentials.bearer_token || credentials.api_token || Object.values(credentials)[0];
        if (!token) throw new Error("No bearer token provided");
        testHeaders["Authorization"] = `Bearer ${token}`;
        break;
      }

      case "oauth2_client_credentials": {
        if (!tokenUrl) throw new Error("Token URL is required for OAuth2");
        const clientId = credentials.client_id;
        const clientSecret = credentials.client_secret;
        if (!clientId || !clientSecret) throw new Error("Client ID and Client Secret are required");

        const tokenParams: Record<string, string> = {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        };
        if (tokenScope) tokenParams.scope = tokenScope;

        const tokenResponse = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(tokenParams),
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          return new Response(
            JSON.stringify({
              success: false,
              message: `OAuth2 token request failed (${tokenResponse.status}): ${errText}`,
              stage: "authentication",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokenData = await tokenResponse.json();
        testHeaders["Authorization"] = `Bearer ${tokenData.access_token}`;
        break;
      }
    }

    // Make a test request to the base URL
    const endpoint = healthCheckEndpoint || "/";
    const testUrl = baseUrl.replace(/\/$/, "") + endpoint;

    const testResponse = await fetch(testUrl, {
      method: "GET",
      headers: testHeaders,
    });

    // Consume response body to prevent leaks
    const responseText = await testResponse.text();

    const success = testResponse.ok || testResponse.status === 404; // 404 on root is acceptable

    return new Response(
      JSON.stringify({
        success,
        message: success
          ? "Connection successful"
          : `Connection failed (${testResponse.status}): ${responseText.slice(0, 200)}`,
        statusCode: testResponse.status,
        stage: "api_test",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("pms-generic-test error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
