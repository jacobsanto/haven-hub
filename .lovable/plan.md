
# Replace All URL Text Inputs with Image Upload + AI Generation

## Summary
Six admin form dialogs still use plain text `<Input>` fields for image URLs instead of the existing `ImageUploadWithOptimizer` component. This plan replaces all of them with proper upload fields and adds an AI image generation button to each, so admins can either upload a photo or generate one contextually.

## Forms to Update

| Form Dialog | Field | Context for AI Generation |
|---|---|---|
| `DestinationFormDialog.tsx` | `hero_image_url` | Destination name + country |
| `ExperienceFormDialog.tsx` | `hero_image_url` | Experience name + category |
| `BlogPostFormDialog.tsx` | `featured_image_url` | Blog post title + category |
| `BlogAuthorFormDialog.tsx` | `avatar_url` | Author name (portrait style) |
| `AddonFormDialog.tsx` | `image_url` | Addon name + category |
| `PromotionalCampaignFormDialog.tsx` | `image_url` | Campaign title + description |

## Changes

### 1. New Edge Function: `generate-image`
- Calls Lovable AI Gateway with `google/gemini-2.5-flash-image` model
- Accepts a `prompt` string, returns a generated image
- Uploads the generated image to the `property-images` bucket under `ai-generated/` path
- Returns the public URL (not raw base64) to keep things lightweight
- Handles 429/402 errors gracefully

### 2. New Component: `ImageFieldWithAI`
A wrapper around `ImageUploadWithOptimizer` that adds an "Generate with AI" button.

**Props:** Same as `ImageUploadWithOptimizer` plus:
- `generatePrompt: string` -- the prompt to send for AI generation
- `promptLabel?: string` -- tooltip or label describing what will be generated

**Behavior:**
- Shows the standard upload area from `ImageUploadWithOptimizer`
- Adds a "Generate Image" button below
- On click, calls the `generate-image` edge function with the prompt
- Shows a loading spinner while generating
- On success, sets the value via `onUpload(url)`

### 3. Update Each Form Dialog
Replace the `<Input placeholder="https://...">` with `<ImageFieldWithAI>`:

- **DestinationFormDialog**: preset = `hero`, prompt built from destination name + country
- **ExperienceFormDialog**: preset = `hero`, prompt built from experience name + category  
- **BlogPostFormDialog**: preset = `hero`, prompt built from post title
- **BlogAuthorFormDialog**: preset = `logo` (smaller dimensions for avatar), prompt = professional portrait description
- **AddonFormDialog**: preset = `gallery`, prompt from addon name + category
- **PromotionalCampaignFormDialog**: preset = `hero`, prompt from campaign title

Each form's zod schema for the image field stays as `z.string().optional().or(z.literal(''))` -- no schema changes needed since the component now provides a URL string.

### 4. Update `config.toml`
Add the new `generate-image` function with `verify_jwt = false`.

## Technical Details

### Edge Function (`supabase/functions/generate-image/index.ts`)
```text
1. Receive POST { prompt: string }
2. Call Lovable AI gateway with gemini-2.5-flash-image model + modalities: ["image", "text"]
3. Extract base64 image from response
4. Upload to property-images bucket under ai-generated/{timestamp}.webp
5. Return { url: publicUrl }
```

### ImageFieldWithAI Component
- Located at `src/components/admin/ImageFieldWithAI.tsx`
- Composes `ImageUploadWithOptimizer` + a "Generate" button
- Uses `supabase.functions.invoke('generate-image', { body: { prompt } })`
- Loading state with spinner, error handling with toast

### File Changes Summary
- **New**: `supabase/functions/generate-image/index.ts`
- **New**: `src/components/admin/ImageFieldWithAI.tsx`
- **Edit**: `supabase/config.toml` (add function entry)
- **Edit**: `src/components/admin/DestinationFormDialog.tsx`
- **Edit**: `src/components/admin/ExperienceFormDialog.tsx`
- **Edit**: `src/components/admin/BlogPostFormDialog.tsx`
- **Edit**: `src/components/admin/BlogAuthorFormDialog.tsx`
- **Edit**: `src/components/admin/AddonFormDialog.tsx`
- **Edit**: `src/components/admin/PromotionalCampaignFormDialog.tsx`
