import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  docsUrl: z.string().url(),
  providerName: z.string().min(1).max(100).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { docsUrl, providerName } = parsed.data;

    // Fetch the docs page content
    let docsContent = "";
    try {
      const docsResponse = await fetch(docsUrl, {
        headers: { Accept: "text/html, text/plain, application/json" },
      });
      if (docsResponse.ok) {
        const rawText = await docsResponse.text();
        // Strip HTML tags for cleaner AI input, limit to 8000 chars
        docsContent = rawText
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
      } else {
        docsContent = `Could not fetch docs (HTTP ${docsResponse.status}). URL: ${docsUrl}`;
        await docsResponse.text(); // consume body
      }
    } catch (fetchError) {
      docsContent = `Could not fetch docs: ${fetchError instanceof Error ? fetchError.message : "unknown error"}. URL: ${docsUrl}`;
    }

    // Call Lovable AI to analyze
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an API integration expert. Analyze PMS (Property Management System) API documentation and extract structured configuration information. Return ONLY the JSON tool call, no extra text.`,
          },
          {
            role: "user",
            content: `Analyze this PMS API documentation and suggest the configuration needed to connect to it.

Provider name: ${providerName || "Unknown"}
Documentation URL: ${docsUrl}

Documentation content (may be partial):
${docsContent}

Based on this, determine:
1. The authentication type (api_key, oauth2_client_credentials, or bearer_token)
2. What credential fields are needed (e.g., API key, client ID, client secret)
3. The base URL for API calls
4. The token URL if OAuth2
5. The OAuth scope if applicable
6. Step-by-step setup instructions for the admin
7. What capabilities this PMS likely supports`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_pms_config",
              description: "Return suggested PMS configuration",
              parameters: {
                type: "object",
                properties: {
                  authType: {
                    type: "string",
                    enum: ["api_key", "oauth2_client_credentials", "bearer_token"],
                    description: "Authentication type",
                  },
                  authFields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                        type: { type: "string", enum: ["text", "password", "url"] },
                        required: { type: "boolean" },
                        placeholder: { type: "string" },
                        helpText: { type: "string" },
                      },
                      required: ["key", "label", "type", "required"],
                    },
                  },
                  baseUrl: { type: "string", description: "API base URL" },
                  tokenUrl: { type: "string", description: "OAuth2 token URL (if applicable)" },
                  tokenScope: { type: "string", description: "OAuth2 scope (if applicable)" },
                  setupSteps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        docsLink: { type: "string" },
                      },
                      required: ["title", "description"],
                    },
                  },
                  capabilities: {
                    type: "object",
                    properties: {
                      pullProperties: { type: "boolean" },
                      pullAvailability: { type: "boolean" },
                      pullRates: { type: "boolean" },
                      pushBookings: { type: "boolean" },
                      webhooksSupported: { type: "boolean" },
                    },
                  },
                },
                required: ["authType", "authFields", "baseUrl", "setupSteps", "capabilities"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_pms_config" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error (${aiResponse.status}): ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return a valid configuration suggestion");
    }

    let suggestion;
    try {
      suggestion = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestion,
        note: "This is an AI-generated suggestion. Please review and adjust before saving.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("pms-analyze-docs error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
