import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, availableIcons } = await req.json();

    if (!title || !availableIcons?.length) {
      return new Response(
        JSON.stringify({ error: "title and availableIcons are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are an icon matching assistant for a luxury vacation property platform. Given an item's title and description, pick the single best matching Lucide icon from the provided list. Consider the semantic meaning of both the title and description.",
          },
          {
            role: "user",
            content: `Title: "${title}"\nDescription: "${description || ""}"\n\nPick the best matching icon.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "select_icon",
              description: "Select the best matching Lucide icon for the given content.",
              parameters: {
                type: "object",
                properties: {
                  icon: {
                    type: "string",
                    enum: availableIcons,
                    description: "The Lucide icon name that best matches the content.",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this icon was chosen.",
                  },
                },
                required: ["icon"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "select_icon" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      // Validate the icon is actually in the allowed list
      if (availableIcons.includes(args.icon)) {
        return new Response(
          JSON.stringify({ icon: args.icon, reasoning: args.reasoning }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fallback: return first icon
    return new Response(
      JSON.stringify({ icon: availableIcons[0], reasoning: "Fallback selection" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("suggest-icon error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
