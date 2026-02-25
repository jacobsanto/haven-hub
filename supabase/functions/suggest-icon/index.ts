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

    // Limit icons list to avoid schema branching limits
    const iconsList = availableIcons.slice(0, 200).join(", ");

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
              "You are an icon matching assistant for a luxury vacation property platform. Given an item's title and description, pick the single best matching Lucide icon from the provided list. Consider the semantic meaning of both the title and description. Reply with ONLY the exact icon name from the list, nothing else.",
          },
          {
            role: "user",
            content: `Title: "${title}"\nDescription: "${description || ""}"\n\nAvailable icons: ${iconsList}\n\nReply with only the icon name.`,
          },
        ],
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
    const content = result.choices?.[0]?.message?.content?.trim() || "";

    // Try to match the response to an available icon
    const suggestedIcon = content.replace(/[^a-zA-Z0-9-]/g, "");
    if (availableIcons.includes(suggestedIcon)) {
      return new Response(
        JSON.stringify({ icon: suggestedIcon, reasoning: "AI suggestion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try case-insensitive match
    const lowerContent = suggestedIcon.toLowerCase();
    const matched = availableIcons.find((i: string) => i.toLowerCase() === lowerContent);
    if (matched) {
      return new Response(
        JSON.stringify({ icon: matched, reasoning: "AI suggestion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
