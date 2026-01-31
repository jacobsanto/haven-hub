import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "blog" | "destination" | "experience" | "property";
type ToneType = "luxury" | "warm" | "professional";
type LengthType = "short" | "medium" | "long";

interface GenerateRequest {
  contentType: ContentType;
  targetName: string;
  existingData?: Record<string, unknown>;
  customInstructions?: string;
  tone?: ToneType;
  length?: LengthType;
  template?: string;
}

const toneDescriptions: Record<ToneType, string> = {
  luxury: "sophisticated, elegant, and exclusive with refined language that evokes prestige and exclusivity",
  warm: "friendly, inviting, and personal with a welcoming tone that creates emotional connection",
  professional: "clear, informative, and authoritative with factual accuracy and polished presentation",
};

const lengthGuidelines: Record<LengthType, string> = {
  short: "Keep descriptions concise (2-3 sentences for short fields, 1-2 paragraphs for long descriptions)",
  medium: "Provide moderate detail (3-4 sentences for short fields, 2-3 paragraphs for long descriptions)",
  long: "Write comprehensive content (4-5 sentences for short fields, 4-5 paragraphs for long descriptions)",
};

const contentTypePrompts: Record<ContentType, { system: string; fields: string[] }> = {
  blog: {
    system: `You are an expert travel editor and content strategist for a luxury villa rental company. 
Create compelling, SEO-optimized blog content that inspires travelers and showcases destinations and experiences.
Write in markdown format with proper headings, and include engaging storytelling elements.`,
    fields: ["title", "excerpt", "content", "tags"],
  },
  destination: {
    system: `You are a luxury travel copywriter specializing in destination marketing.
Create evocative descriptions that transport readers to the location and highlight what makes it special.
Focus on unique cultural elements, natural beauty, and exclusive experiences available.`,
    fields: ["description", "long_description", "highlights", "best_time_to_visit", "climate"],
  },
  experience: {
    system: `You are an experience curator for luxury travelers.
Write compelling descriptions that capture the essence of unique experiences and activities.
Emphasize exclusivity, authenticity, and the transformative nature of each experience.`,
    fields: ["description", "long_description", "includes"],
  },
  property: {
    system: `You are a luxury real estate copywriter specializing in vacation rentals.
Create aspirational property descriptions that highlight architectural details, amenities, and the lifestyle offered.
Paint a picture of what it feels like to stay at the property.`,
    fields: ["description", "highlights", "neighborhood_description"],
  },
};

const templatePrompts: Record<string, string> = {
  destination_guide: `Create a comprehensive destination guide blog post that includes:
- An engaging introduction about the destination
- Top attractions and must-see sights
- Best times to visit
- Local cuisine highlights
- Practical travel tips
- Why this destination is perfect for luxury travelers`,
  experience_spotlight: `Create an experience spotlight that includes:
- A captivating opening that hooks the reader
- Detailed description of what makes this experience unique
- What guests can expect during the experience
- Why this is a must-do activity`,
  property_showcase: `Create property marketing content that includes:
- An aspirational headline
- Compelling property description
- Key highlights and unique features
- The lifestyle and experience guests will enjoy`,
  seasonal_promotion: `Create promotional content for a seasonal offer that includes:
- Attention-grabbing headline
- Limited-time offer details
- Why this season is special
- Call to action`,
};

function buildToolDefinition(contentType: ContentType) {
  const fieldSchemas: Record<ContentType, Record<string, object>> = {
    blog: {
      title: { type: "string", description: "Compelling blog post title (50-70 characters)" },
      excerpt: { type: "string", description: "Engaging excerpt/summary (150-200 characters)" },
      content: { type: "string", description: "Full blog post content in markdown format" },
      tags: { type: "array", items: { type: "string" }, description: "5-8 relevant SEO tags" },
    },
    destination: {
      description: { type: "string", description: "Short enticing description (2-3 sentences)" },
      long_description: { type: "string", description: "Comprehensive destination overview in markdown" },
      highlights: { type: "array", items: { type: "string" }, description: "5-7 key highlights as brief phrases" },
      best_time_to_visit: { type: "string", description: "Best months/seasons to visit with reasoning" },
      climate: { type: "string", description: "Brief climate description" },
    },
    experience: {
      description: { type: "string", description: "Short captivating description (2-3 sentences)" },
      long_description: { type: "string", description: "Detailed experience description in markdown" },
      includes: { type: "array", items: { type: "string" }, description: "5-8 items included in the experience" },
    },
    property: {
      description: { type: "string", description: "Aspirational property description (3-4 paragraphs)" },
      highlights: { type: "array", items: { type: "string" }, description: "6-8 key property highlights" },
      neighborhood_description: { type: "string", description: "Description of the surrounding area and neighborhood" },
    },
  };

  return {
    type: "function",
    function: {
      name: `generate_${contentType}_content`,
      description: `Generate marketing content for a ${contentType}`,
      parameters: {
        type: "object",
        properties: fieldSchemas[contentType],
        required: contentTypePrompts[contentType].fields,
        additionalProperties: false,
      },
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, targetName, existingData, customInstructions, tone = "luxury", length = "medium", template }: GenerateRequest = await req.json();

    if (!contentType || !targetName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contentType and targetName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const promptConfig = contentTypePrompts[contentType];
    if (!promptConfig) {
      return new Response(
        JSON.stringify({ error: `Invalid content type: ${contentType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the system prompt
    let systemPrompt = promptConfig.system;
    systemPrompt += `\n\nTone: Write in a ${toneDescriptions[tone]} style.`;
    systemPrompt += `\n\nLength guidelines: ${lengthGuidelines[length]}`;

    if (template && templatePrompts[template]) {
      systemPrompt += `\n\nTemplate instructions:\n${templatePrompts[template]}`;
    }

    // Build the user prompt
    let userPrompt = `Generate content for: "${targetName}"`;
    
    if (existingData && Object.keys(existingData).length > 0) {
      userPrompt += `\n\nExisting information to incorporate:\n${JSON.stringify(existingData, null, 2)}`;
    }

    if (customInstructions) {
      userPrompt += `\n\nAdditional instructions: ${customInstructions}`;
    }

    userPrompt += `\n\nGenerate all required fields for this ${contentType}.`;

    const tool = buildToolDefinition(contentType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: `generate_${contentType}_content` } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: generatedContent,
        contentType,
        targetName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
