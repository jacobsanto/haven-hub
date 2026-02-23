

# Fix AI Image Generation to Produce Location-Relevant Images

## Problem
The current AI image generation produces generic, repetitive images because:
1. **Prompts are too vague** -- they use generic photography jargon ("cinematic lighting", "editorial style") without specific visual details about the actual place
2. **No backend prompt enrichment** -- the edge function passes the client prompt directly to the AI model without adding context
3. **Fallback text is meaningless** -- when fields are empty, prompts default to "a destination" or "travel experience"

## Solution
Two changes: enhance the backend to build richer, context-aware prompts with a system message, and improve the client-side prompt templates to include more form fields.

## Changes

### 1. Upgrade the `generate-image` Edge Function

Instead of sending the raw user prompt as a single message, add a **system message** that instructs the model to generate a specific, realistic photograph of the described subject. Also accept an optional `context` object from the client with structured data (name, country, description, category) so the backend can build a much richer prompt.

**Key changes:**
- Accept `{ prompt, context }` where context is optional structured data
- Add a system message that enforces realistic, location-specific imagery
- Build an enriched prompt on the backend using the context fields
- Log the final prompt for debugging

### 2. Update `ImageFieldWithAI` Component

Pass a `context` object alongside the prompt so the backend has structured data to work with.

### 3. Improve Prompt Templates in Each Form Dialog

Make prompts reference more fields from the form (description, climate, long_description) so the AI has real content to work with.

| Form | Current Prompt Uses | Will Now Also Use |
|---|---|---|
| DestinationFormDialog | name, country | description, climate, best_time_to_visit |
| ExperienceFormDialog | name, category | description, duration, destination name |
| BlogPostFormDialog | title | category, excerpt/content hint |
| BlogAuthorFormDialog | name | bio snippet |
| AddonFormDialog | name, category | description |
| PromotionalCampaignFormDialog | title, description | discount type, target |

## Technical Details

### Edge Function Changes (`supabase/functions/generate-image/index.ts`)

```text
Current flow:
  Client sends { prompt } -> model receives [{ role: "user", content: prompt }]

New flow:
  Client sends { prompt, context } -> backend builds enriched prompt ->
  model receives [
    { role: "system", content: "You are a professional travel photographer..." },
    { role: "user", content: enrichedPrompt }
  ]
```

The system message will instruct:
- Generate a realistic, high-resolution photograph (not illustration, not stock photo)
- The image must depict the specific location, landmark, or scene described
- Include distinctive local architecture, vegetation, colors, and atmosphere
- No text overlays, no watermarks, no borders

The enriched prompt will combine:
- The base prompt from the client
- Structured context fields (country, climate, description) woven into a detailed scene description

### Client-Side Prompt Improvements (Example: Destination)

Before:
```
Beautiful high-resolution travel hero photograph of ${name || 'a destination'},
${country || 'scenic landscape'}. Ultra high resolution, cinematic lighting...
```

After:
```
A breathtaking photograph of ${name}, ${country}.
${description ? `The scene shows: ${description}.` : ''}
${climate ? `The climate is ${climate}.` : ''}
Capture the distinctive architecture, natural landscape, and atmosphere
unique to this specific location.
```

### File Changes Summary
- **Edit**: `supabase/functions/generate-image/index.ts` -- add system message and context-aware prompt building
- **Edit**: `src/components/admin/ImageFieldWithAI.tsx` -- pass context object alongside prompt
- **Edit**: `src/components/admin/DestinationFormDialog.tsx` -- richer prompt with description, climate
- **Edit**: `src/components/admin/ExperienceFormDialog.tsx` -- include description, destination context
- **Edit**: `src/components/admin/BlogPostFormDialog.tsx` -- include category context
- **Edit**: `src/components/admin/BlogAuthorFormDialog.tsx` -- include bio snippet
- **Edit**: `src/components/admin/AddonFormDialog.tsx` -- include description
- **Edit**: `src/components/admin/PromotionalCampaignFormDialog.tsx` -- include more campaign details

