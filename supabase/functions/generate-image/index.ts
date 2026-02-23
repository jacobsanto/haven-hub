import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_MESSAGE = `You are a professional travel and hospitality photographer. Generate a realistic, high-resolution photograph based on the description provided. Follow these rules strictly:
- The image must look like a real photograph taken by a professional photographer, NOT an illustration, painting, or stock photo
- Depict the SPECIFIC location, landmark, architecture, vegetation, and atmosphere described — do not produce generic scenery
- Include distinctive local details: regional building styles, native plants, characteristic colors and lighting conditions
- No text overlays, watermarks, borders, or frames
- No people unless specifically requested
- Use natural lighting appropriate to the location and climate described`;

function buildEnrichedPrompt(prompt: string, context?: Record<string, string | undefined>): string {
  if (!context) return prompt;

  const parts: string[] = [prompt];

  if (context.name && context.country) {
    parts.push(`\nThis is specifically ${context.name}, ${context.country} — show landmarks, architecture, and scenery unique to this exact place.`);
  } else if (context.name) {
    parts.push(`\nThis is specifically ${context.name} — capture what makes this place visually distinctive.`);
  }

  if (context.description) {
    parts.push(`Scene details: ${context.description}`);
  }

  if (context.climate) {
    parts.push(`The climate is ${context.climate} — reflect this in vegetation, sky, and lighting.`);
  }

  if (context.best_time_to_visit) {
    parts.push(`Best season: ${context.best_time_to_visit} — show the landscape during this period.`);
  }

  if (context.category) {
    parts.push(`Category: ${context.category} — the image should clearly convey this type of experience.`);
  }

  if (context.duration) {
    parts.push(`This is a ${context.duration} experience.`);
  }

  if (context.bio) {
    parts.push(`This person's background: ${context.bio.slice(0, 200)}`);
  }

  return parts.join('\n');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const { prompt, context } = body;

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Invalid prompt (must be 1-2000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enrichedPrompt = buildEnrichedPrompt(prompt, context);
    console.log("Enriched prompt:", enrichedPrompt);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: enrichedPrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      throw new Error("No image returned from AI model");
    }

    // Parse base64 data
    const matches = imageDataUrl.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid image data format");
    }
    const ext = matches[1] === "png" ? "png" : "webp";
    const base64Data = matches[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `ai-generated/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(fileName, binaryData, {
        upsert: true,
        contentType: `image/${ext}`,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload generated image");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
