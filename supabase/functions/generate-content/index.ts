import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "blog" | "destination" | "experience" | "property" | "social_variants";
type ToneType = "luxury" | "warm" | "professional";
type LengthType = "short" | "medium" | "long";
type PersonaType = "honeymoon_couples" | "luxury_families" | "solo_adventurers" | "wellness_seekers" | "celebration_groups" | "business_travelers" | "retirees";
type MarketingAngleType = "aspirational" | "fomo_urgency" | "value_proposition" | "social_proof" | "exclusivity" | "transformation";
type TravelStyleType = "adventure_active" | "wellness_spa" | "cultural_immersion" | "culinary_wine" | "romance_celebration" | "beach_relaxation";

interface GenerateRequest {
  contentType: ContentType;
  targetName?: string;
  existingData?: Record<string, unknown>;
  customInstructions?: string;
  tone?: ToneType;
  length?: LengthType;
  template?: string;
  persona?: PersonaType;
  marketingAngle?: MarketingAngleType;
  travelStyle?: TravelStyleType;
  // Humanize mode
  humanize?: boolean;
  contentToHumanize?: Record<string, unknown>;
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

// Persona descriptions for targeting
const personaDescriptions: Record<PersonaType, string> = {
  honeymoon_couples: "Honeymoon couples seeking romantic, intimate experiences with privacy and special touches for celebrating their new marriage. Focus on romance, seclusion, couples activities, and creating unforgettable memories together.",
  luxury_families: "Affluent families traveling with children across multiple generations. Emphasize spacious accommodations, kid-friendly amenities, family bonding activities, and experiences that delight both adults and children.",
  solo_adventurers: "Independent travelers seeking authentic experiences and personal growth. Highlight opportunities for self-discovery, local immersion, unique adventures, and the freedom to explore at their own pace.",
  wellness_seekers: "Health-conscious travelers prioritizing relaxation and rejuvenation. Focus on spa facilities, mindfulness activities, healthy dining options, yoga, meditation, and holistic wellness experiences.",
  celebration_groups: "Groups celebrating milestone events like birthdays, anniversaries, or reunions. Emphasize group accommodations, celebration amenities, event planning capabilities, and creating memorable shared experiences.",
  business_travelers: "Professionals who blend work with luxury leisure. Highlight high-speed connectivity, quiet workspaces, business amenities, convenient locations, and opportunities for productive relaxation.",
  retirees: "Mature travelers with time and resources for meaningful experiences. Focus on comfort, cultural depth, slower-paced exploration, accessibility, and enriching experiences that offer new perspectives.",
};

// Marketing angle descriptions
const marketingAngleDescriptions: Record<MarketingAngleType, string> = {
  aspirational: "Create aspirational content that paints a picture of the ultimate dream experience. Evoke desire and longing by describing the pinnacle of luxury and the lifestyle guests will enjoy.",
  fomo_urgency: "Emphasize limited availability, seasonal moments, and the fear of missing out. Create urgency through exclusive access, time-sensitive opportunities, and once-in-a-lifetime experiences.",
  value_proposition: "Focus on justifying the investment by highlighting everything that's included. Emphasize value, unique offerings, and why this experience is worth every penny.",
  social_proof: "Reference acclaim, popularity, and guest satisfaction. Include mentions of awards, recognition, repeat guests, and why discerning travelers choose this experience.",
  exclusivity: "Emphasize private access, rare experiences, and VIP treatment. Highlight what makes this offering unique, limited, and available only to select guests.",
  transformation: "Focus on life-changing moments and personal growth. Describe how this experience transforms guests, creates lasting memories, and offers new perspectives on life.",
};

// Travel style descriptions
const travelStyleDescriptions: Record<TravelStyleType, string> = {
  adventure_active: "Emphasize outdoor activities, exploration, and thrilling experiences. Highlight hiking, water sports, expeditions, and active adventures that get the heart racing.",
  wellness_spa: "Focus on relaxation, health, and rejuvenation. Describe spa treatments, yoga sessions, meditation spaces, and facilities designed for physical and mental wellness.",
  cultural_immersion: "Highlight local traditions, history, and authentic experiences. Emphasize connections with local culture, artisans, traditions, and meaningful cultural exchanges.",
  culinary_wine: "Focus on food, dining, wine tours, and cooking experiences. Describe local cuisine, fine dining, wine tastings, cooking classes, and gastronomic adventures.",
  romance_celebration: "Emphasize special occasions and intimate moments. Highlight romantic settings, couples experiences, celebration amenities, and creating magical memories.",
  beach_relaxation: "Focus on sun, sea, and laid-back vibes. Describe pristine beaches, ocean views, water activities, and the ultimate in coastal relaxation.",
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
Paint a picture of what it feels like to stay at the property.
Generate a separate "short_description" — a compelling 1-2 sentence editorial hook that captures the essence of the property. This should be distinct from and shorter than the full description.`,
    fields: ["short_description", "description", "highlights", "neighborhood_description"],
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
  classic_list_post: `Structure this as a Classic List Post:
1. TITLE: Write a benefit-driven, numbered title (e.g. "7 Strategies to…", "10 Ways to…")
2. INTRODUCTION: Open by identifying a problem or desire the reader has, then promise the benefit they'll gain from reading. Keep it to 2-3 paragraphs.
3. BODY — NUMBERED ITEMS: Create 5-10 numbered items, each with:
   - A clear subheading (## Heading)
   - 1-2 paragraphs explaining the tip/strategy
   - A concrete action item or takeaway the reader can apply immediately
4. CONCLUSION: Summarize the key takeaways and end with a strong call-to-action (e.g. book now, explore properties, subscribe).`,
  beginners_guide: `Structure this as a Beginner's Guide:
1. TITLE: Use "The Beginner's Guide to…" or "A Complete Guide to…" format
2. INTRODUCTION: Start with a promise statement — what the reader will know/be able to do after reading. Provide context on why this topic matters. 2-3 paragraphs.
3. TOPIC OVERVIEW: Define key terms and concepts. Use examples to illustrate. This section orients the reader.
4. DETAILED STEPS/SECTIONS: Break the guide into logical sections with clear headings. Each section should:
   - Explain one concept or step thoroughly
   - Use smooth transitions between sections
   - Include practical examples or scenarios
5. CONCLUSION: Recap the main points learned, reinforce the promise from the intro, and include a CTA.`,
  things_to_do_after: `Structure this as a "Things To Do After X" post:
1. TITLE: Use "X Things To Do After [Scenario]" format
2. INTRODUCTION: Help the reader visualize the scenario (e.g. "You've just arrived at your villa…"). Then raise the "now what?" question to set up the list. 1-2 paragraphs.
3. NUMBERED STEPS: Create 5-10 numbered action items, each with:
   - A clear subheading
   - Specific, actionable instructions (not vague advice)
   - Why this step matters
4. CONCLUSION: Highlight the importance of taking action, call back to the best tips, and end with a CTA.`,
  product_showdown: `Structure this as a Product Showdown / Comparison post:
1. TITLE: Name the items being compared (e.g. "Villa A vs Villa B: Which Is Right for You?")
2. INTRODUCTION: Explain what's being compared and the criteria used for evaluation. Set reader expectations. 1-2 paragraphs.
3. INDIVIDUAL OVERVIEWS: Give a brief overview of each item being compared — key features, strengths, ideal use case.
4. FEATURE-BY-FEATURE COMPARISON: Compare across specific dimensions (location, amenities, price, experience, etc.) using clear subheadings.
5. CONCLUSION: Provide a clear recommendation based on different reader needs/preferences. End with a CTA.`,
  detailed_case_study: `Structure this as a Detailed Case Study:
1. TITLE: Include a specific benefit and timeframe (e.g. "How [Guest] Found Their Perfect Getaway in 3 Days")
2. INTRODUCTION: Introduce a relatable hero/protagonist the reader can identify with. 1-2 paragraphs.
3. BACKGROUND & PROBLEM: Tell the hero's story — what challenge or desire brought them to this experience? Build empathy.
4. RESULTS: Present the outcomes with specific details and data where possible. What changed? What was achieved?
5. DETAILED STEPS: Walk through how the transformation happened — the journey, decisions, and key moments.
6. CONCLUSION: End with a motivational message and CTA encouraging readers to create their own story.`,
  how_they_did_it: `Structure this as a "How They Did It" post:
1. TITLE: Focus on successful people, properties, or organizations (e.g. "How Top Travelers Plan the Perfect Villa Holiday")
2. INTRODUCTION: Overview the opportunity or achievement being discussed. Why should readers care? 1-2 paragraphs.
3. STRATEGIES SECTION: Present 4-6 strategies, each with:
   - The approach or method used
   - Why it works (the reasoning)
   - How the reader can apply it to their own plans
4. CONCLUSION: Encourage readers to take action and apply what they've learned. End with an inspiring CTA.`,
  myth_debunker: `Structure this as a Myth Debunker post:
1. TITLE: Highlight the myths being addressed (e.g. "5 Myths About Luxury Travel — Debunked")
2. INTRODUCTION: Use an attention-grabbing hook, then promise to set the record straight. 1-2 paragraphs.
3. MYTHS SECTION: Present 4-7 myths, each with:
   - The myth stated clearly (## Myth: "...")
   - Background on why people believe it
   - Evidence or reasoning for why it's wrong
   - What to do instead / the truth
4. CONCLUSION: Recap what was debunked, reinforce the correct perspective, and end with a CTA.`,
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
      short_description: { type: "string", description: "A compelling 1-2 sentence editorial hook that is always visible to guests" },
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

const humanizeSystemPrompt = `You are an expert editor specializing in making AI-generated marketing content sound more naturally human-written.

Your task is to refine the provided content while keeping the same meaning, structure, and fields. Apply these transformations:

1. **Remove AI-typical clichés** - Eliminate overused phrases like "nestled in", "boasts", "immerse yourself", "unforgettable", "unparalleled", "truly", "seamlessly"
2. **Vary sentence structure** - Mix short punchy sentences with longer flowing ones. Break up repetitive patterns.
3. **Add natural imperfections** - Use contractions, casual asides, and slightly informal touches where appropriate
4. **Reduce superlatives** - Replace excessive "amazing", "incredible", "stunning" with specific, tangible details
5. **Add concrete specifics** - Replace generic phrases with observations that feel firsthand
6. **Maintain professionalism** - Keep the content polished and suitable for luxury marketing while making it feel authentic

Return the EXACT same JSON structure with the same field names, just with humanized text in each field.`;

// Format entity data into structured, human-readable context for the AI
function formatEntityContext(contentType: string, name: string, data: Record<string, unknown>): string {
  const lines: string[] = [];
  const add = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      // Handle complex arrays (rooms, nearby_attractions)
      if (typeof value[0] === 'object') {
        lines.push(`- ${label}:`);
        value.forEach((item: any) => {
          if (item.name && item.type) {
            lines.push(`  • ${item.name} (${item.type}${item.distance ? ', ' + item.distance : ''})`);
          } else if (item.name && item.beds) {
            const beds = item.beds.map((b: any) => `${b.count}× ${b.type}`).join(', ');
            lines.push(`  • ${item.name}: ${beds}`);
          } else {
            lines.push(`  • ${JSON.stringify(item)}`);
          }
        });
      } else {
        lines.push(`- ${label}: ${value.join(', ')}`);
      }
    } else {
      lines.push(`- ${label}: ${value}`);
    }
  };

  if (contentType === 'property') {
    lines.push(`PROPERTY CONTEXT:`);
    add('Name', name);
    add('Type', data.property_type);
    add('Location', [data.city, data.region, data.country].filter(Boolean).join(', '));
    add('Address', data.address);
    if (data.latitude && data.longitude) add('Coordinates', `${data.latitude}, ${data.longitude}`);
    const sizeparts: string[] = [];
    if (data.area_sqm) sizeparts.push(`${data.area_sqm} m²`);
    if (data.bedrooms) sizeparts.push(`${data.bedrooms} Bedrooms`);
    if (data.bathrooms) sizeparts.push(`${data.bathrooms} Bathrooms`);
    if (data.max_guests) sizeparts.push(`Up to ${data.max_guests} Guests`);
    if (sizeparts.length) add('Size', sizeparts.join(' | '));
    if (data.base_price) add('Base Price', `${data.base_price}/night`);
    add('Short Description', data.short_description);
    add('Description', data.description);
    add('Amenities', data.amenities);
    add('Highlights', data.highlights);
    add('Rooms', data.rooms);
    add('Nearby Attractions', data.nearby_attractions);
    add('Neighborhood', data.neighborhood_description);
    add('House Rules', data.house_rules);
  } else if (contentType === 'destination') {
    lines.push(`DESTINATION CONTEXT:`);
    add('Name', name);
    add('Country', data.country);
    if (data.latitude && data.longitude) add('Coordinates', `${data.latitude}, ${data.longitude}`);
    add('Description', data.description);
    add('Long Description', data.long_description);
    add('Highlights', data.highlights);
    add('Best Time to Visit', data.best_time_to_visit);
    add('Climate', data.climate);
  } else if (contentType === 'experience') {
    lines.push(`EXPERIENCE CONTEXT:`);
    add('Name', name);
    add('Category', data.category);
    add('Duration', data.duration);
    if (data.price_from) add('Price From', data.price_from);
    add('Description', data.description);
    add('Long Description', data.long_description);
    add('Includes', data.includes);
    add('Featured', data.is_featured);
  } else if (contentType === 'blog') {
    lines.push(`BLOG POST CONTEXT:`);
    add('Title', data.title);
    add('Excerpt', data.excerpt);
    add('Tags', data.tags);
    add('Article Style', data.article_style);
    if (data.content) add('Existing Content (for reference)', (data.content as string).substring(0, 500));
  } else {
    // Fallback for any other content type
    lines.push(`ENTITY CONTEXT:`);
    add('Name', name);
    for (const [key, value] of Object.entries(data)) {
      add(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value);
    }
  }

  lines.push('');
  lines.push('Use this context as background knowledge to write accurate, specific content. Do not simply list these facts — weave them naturally into compelling marketing copy.');
  return lines.join('\n');
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check - this is an admin-only edge function
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

  // Verify admin role
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Admin access required" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const requestData: GenerateRequest = await req.json();
    const { contentType, targetName, existingData, customInstructions, tone = "luxury", length = "medium", template, persona, marketingAngle, travelStyle, humanize, contentToHumanize } = requestData;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle humanize mode
    if (humanize && contentToHumanize && contentType) {
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
            { role: "system", content: humanizeSystemPrompt },
            { role: "user", content: `Humanize this ${contentType} content. Return the same JSON structure with refined text:\n\n${JSON.stringify(contentToHumanize, null, 2)}` },
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
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        throw new Error("No tool call in response");
      }

      const humanizedContent = JSON.parse(toolCall.function.arguments);

      return new Response(
        JSON.stringify({ 
          success: true, 
          content: humanizedContent,
          contentType,
          humanized: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle social_core mode — generate core message + hashtags from a topic
    if (contentType === "social_core" as string) {
      const socialCoreSystemPrompt = `You are an expert social media copywriter for a luxury travel and villa rental company.
Given a topic or prompt, generate a compelling core social media message and relevant hashtag seeds.
The message should be versatile enough to be adapted to any platform later.
Tone: ${toneDescriptions[tone]}.
Length: Write 2-4 sentences that capture the essence of the topic.`;

      const socialCoreTool = {
        type: "function",
        function: {
          name: "generate_social_core",
          description: "Generate a core social media message and hashtags from a topic",
          parameters: {
            type: "object",
            properties: {
              core_text: { type: "string", description: "The core social media message (2-4 sentences)" },
              hashtags: { type: "array", items: { type: "string" }, description: "8-15 relevant hashtag seeds without # prefix" },
            },
            required: ["core_text", "hashtags"],
            additionalProperties: false,
          },
        },
      };

      const coreResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: socialCoreSystemPrompt },
            { role: "user", content: `Topic: "${targetName || "luxury travel"}"${customInstructions ? `\nAdditional context: ${customInstructions}` : ""}` },
          ],
          tools: [socialCoreTool],
          tool_choice: { type: "function", function: { name: "generate_social_core" } },
        }),
      });

      if (!coreResponse.ok) {
        if (coreResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (coreResponse.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const errText = await coreResponse.text();
        console.error("AI gateway error:", coreResponse.status, errText);
        throw new Error(`AI gateway error: ${coreResponse.status}`);
      }

      const coreData = await coreResponse.json();
      const coreToolCall = coreData.choices?.[0]?.message?.tool_calls?.[0];
      if (!coreToolCall) throw new Error("No tool call in response");

      const coreContent = JSON.parse(coreToolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, content: coreContent, contentType: "social_core" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle social_rewrite mode — rewrite text optimized for a specific platform
    if ((contentType as string) === "social_rewrite" && existingData) {
      const { platform: targetPlatform, content_text: sourceText } = existingData as { platform: string; content_text: string };

      const platformRules: Record<string, string> = {
        instagram: "Max 2200 chars. Visual, lifestyle tone. Emoji-friendly. Add 15-30 hashtags in a separate block.",
        linkedin: "Max 3000 chars. Professional, thought-leadership tone. 3-5 hashtags inline.",
        twitter: "Max 280 chars. Concise, punchy. 1-3 hashtags inline. Thread-ready.",
        tiktok: "Max 2200 chars. Casual, Gen-Z tone. 5-10 trending hashtags.",
        reddit: "Max 40000 chars. Conversational, value-first. NO hashtags.",
        pinterest: "Max 500 chars. Aspirational, SEO-focused. Use keyword tags.",
        facebook: "Max 63206 chars. Warm, community tone. 1-3 hashtags.",
        google_business: "Max 1500 chars. Informative, local update format. NO hashtags.",
      };

      const rewriteSystemPrompt = `You are an expert social media copywriter for luxury travel.
Rewrite the given text optimized specifically for ${targetPlatform}.
Rules: ${platformRules[targetPlatform] || "Adapt appropriately."}
Tone: ${toneDescriptions[tone]}.
Keep the core message but optimize format, length, and style for the platform.`;

      const rewriteTool = {
        type: "function",
        function: {
          name: "rewrite_social_content",
          description: "Rewrite social media content optimized for a specific platform",
          parameters: {
            type: "object",
            properties: {
              content_text: { type: "string", description: "The rewritten content optimized for the platform" },
              hashtags: { type: "array", items: { type: "string" }, description: "Platform-appropriate hashtags without # prefix" },
            },
            required: ["content_text", "hashtags"],
            additionalProperties: false,
          },
        },
      };

      const rewriteResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: rewriteSystemPrompt },
            { role: "user", content: `Rewrite this for ${targetPlatform}:\n\n${sourceText}` },
          ],
          tools: [rewriteTool],
          tool_choice: { type: "function", function: { name: "rewrite_social_content" } },
        }),
      });

      if (!rewriteResponse.ok) {
        if (rewriteResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (rewriteResponse.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const errText = await rewriteResponse.text();
        console.error("AI gateway error:", rewriteResponse.status, errText);
        throw new Error(`AI gateway error: ${rewriteResponse.status}`);
      }

      const rewriteData = await rewriteResponse.json();
      const rewriteToolCall = rewriteData.choices?.[0]?.message?.tool_calls?.[0];
      if (!rewriteToolCall) throw new Error("No tool call in response");

      const rewriteContent = JSON.parse(rewriteToolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, content: rewriteContent, contentType: "social_rewrite" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle social_humanize mode — make content sound more natural
    if ((contentType as string) === "social_humanize" && existingData) {
      const { platform: humPlatform, content_text: humText, hashtags: humHashtags } = existingData as { platform: string; content_text: string; hashtags?: string[] };

      const socialHumanizePrompt = `${humanizeSystemPrompt}

SOCIAL MEDIA SPECIFIC RULES:
- Keep the content appropriate for ${humPlatform || "social media"}
- Preserve the platform-specific format and length constraints
- Make it sound like a real person wrote it, not a brand bot
- Keep hashtags relevant but vary them naturally
- Maintain any emojis that feel authentic, remove ones that feel forced`;

      const humTool = {
        type: "function",
        function: {
          name: "rewrite_social_content",
          description: "Humanize social media content to sound more natural",
          parameters: {
            type: "object",
            properties: {
              content_text: { type: "string", description: "The humanized content" },
              hashtags: { type: "array", items: { type: "string" }, description: "Refined hashtags without # prefix" },
            },
            required: ["content_text", "hashtags"],
            additionalProperties: false,
          },
        },
      };

      const humResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: socialHumanizePrompt },
            { role: "user", content: `Humanize this social media post for ${humPlatform}:\n\n${humText}${humHashtags?.length ? `\n\nCurrent hashtags: ${humHashtags.join(", ")}` : ""}` },
          ],
          tools: [humTool],
          tool_choice: { type: "function", function: { name: "rewrite_social_content" } },
        }),
      });

      if (!humResponse.ok) {
        if (humResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (humResponse.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const errText = await humResponse.text();
        console.error("AI gateway error:", humResponse.status, errText);
        throw new Error(`AI gateway error: ${humResponse.status}`);
      }

      const humData = await humResponse.json();
      const humToolCall = humData.choices?.[0]?.message?.tool_calls?.[0];
      if (!humToolCall) throw new Error("No tool call in response");

      const humContent = JSON.parse(humToolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, content: humContent, contentType: "social_humanize" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle social_variants mode
    if (contentType === "social_variants" && existingData) {
      const { core_text, core_hashtags, platforms } = existingData as {
        core_text: string;
        core_hashtags: string[];
        platforms: string[];
      };

      const socialSystemPrompt = `You are an expert social media content strategist for a luxury travel and villa rental company.
Given a core message and target platforms, create optimized variants for EACH platform following these rules:

| Platform | Char Limit | Hashtag Style | Tone |
|----------|-----------|---------------|------|
| instagram | 2200 | 15-30 hashtags in separate block | Visual, lifestyle, emoji-friendly |
| linkedin | 3000 | 3-5 hashtags inline | Professional, thought-leadership |
| twitter | 280 | 1-3 hashtags inline | Concise, punchy |
| tiktok | 2200 | 5-10 trending tags | Casual, Gen-Z |
| reddit | 40000 | No hashtags | Conversational, value-first |
| pinterest | 500 | Keywords as tags | Aspirational, SEO-focused |
| facebook | 63206 | 1-3 hashtags | Warm, community |
| google_business | 1500 | No hashtags | Informative, local update format |

Tone preference: ${tone || "warm"}`;

      const socialTool = {
        type: "function",
        function: {
          name: "generate_social_variants",
          description: "Generate platform-optimized social media post variants",
          parameters: {
            type: "object",
            properties: {
              variants: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    content_text: { type: "string" },
                    hashtags: { type: "array", items: { type: "string" } },
                  },
                  required: ["platform", "content_text", "hashtags"],
                },
              },
            },
            required: ["variants"],
            additionalProperties: false,
          },
        },
      };

      const socialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: socialSystemPrompt },
            {
              role: "user",
              content: `Core message: "${core_text}"\nSeed hashtags: ${(core_hashtags || []).join(", ")}\nTarget platforms: ${platforms.join(", ")}\n\nGenerate an optimized variant for each platform.`,
            },
          ],
          tools: [socialTool],
          tool_choice: { type: "function", function: { name: "generate_social_variants" } },
        }),
      });

      if (!socialResponse.ok) {
        if (socialResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errorText = await socialResponse.text();
        console.error("AI gateway error:", socialResponse.status, errorText);
        throw new Error(`AI gateway error: ${socialResponse.status}`);
      }

      const socialData = await socialResponse.json();
      const socialToolCall = socialData.choices?.[0]?.message?.tool_calls?.[0];
      if (!socialToolCall) throw new Error("No tool call in response");

      const socialContent = JSON.parse(socialToolCall.function.arguments);

      return new Response(
        JSON.stringify({ success: true, content: socialContent, contentType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard generation mode
    if (!contentType || !targetName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contentType and targetName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Add targeting context if specified
    if (persona) {
      systemPrompt += `\n\nTarget Audience: ${personaDescriptions[persona]}`;
    }

    if (marketingAngle) {
      systemPrompt += `\n\nMarketing Angle: ${marketingAngleDescriptions[marketingAngle]}`;
    }

    if (travelStyle) {
      systemPrompt += `\n\nTravel Style Focus: ${travelStyleDescriptions[travelStyle]}`;
    }

    if (template && templatePrompts[template]) {
      systemPrompt += `\n\nTemplate instructions:\n${templatePrompts[template]}`;
    }

    // Build the user prompt
    let userPrompt = `Generate content for: "${targetName}"`;
    
    if (existingData && Object.keys(existingData).length > 0) {
      userPrompt += `\n\n${formatEntityContext(contentType, targetName, existingData)}`;
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
