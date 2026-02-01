

# Generate Hero Photos for Destination Villages

## Overview

Create AI-generated hero images for all 9 active Santorini village destinations using Lovable AI's image generation capability (`google/gemini-2.5-flash-image`).

---

## Destinations Needing Images

| Village | Slug | Current Image |
|---------|------|---------------|
| Oia | oia | None |
| Fira | fira | None |
| Imerovigli | imerovigli | None |
| Megalochori | megalochori | None |
| Mesaria | mesaria | None |
| Emporio | emporio | None |
| Perissa | perissa | None |
| Thira | thira | None |
| Vothonas | vothonas | None |

---

## Implementation Approach

### Step 1: Create Image Generation Edge Function

A new edge function `generate-destination-image` that:
- Accepts a destination name and optional style hints
- Calls Lovable AI with `google/gemini-2.5-flash-image` model
- Generates a landscape image (4:3 aspect ratio to match DestinationCard)
- Uploads the image to Lovable Cloud Storage
- Returns the public URL

### Step 2: Storage Bucket

Create a `destination-images` storage bucket with public access for serving the generated images.

### Step 3: Admin Tool for Generation

Add a "Generate Image" button to the destination admin interface that:
- Triggers image generation for a specific destination
- Shows generation progress
- Automatically updates the `hero_image_url` field

### Step 4: Batch Generation

Optionally, allow batch generation of all destinations missing images.

---

## Technical Details

### Edge Function: `generate-destination-image`

```typescript
// Key aspects:
// 1. Craft prompt for Santorini village photography
// 2. Call Lovable AI with image modality
// 3. Upload base64 result to storage
// 4. Return public URL

const prompt = `A stunning hero photograph of ${villageName}, Santorini, Greece. 
Capture the iconic whitewashed buildings with blue domes, 
dramatic caldera views, Mediterranean Sea backdrop, 
golden hour lighting. Professional travel photography style, 
4:3 aspect ratio, high resolution, vibrant colors.`;
```

### Prompt Customization by Village

| Village | Style Notes |
|---------|-------------|
| **Oia** | Famous sunsets, windmills, blue domes |
| **Fira** | Clifftop capital, bustling streets, caldera views |
| **Imerovigli** | Highest village, "balcony to the Aegean", Skaros Rock |
| **Megalochori** | Traditional village, wine caves, quieter charm |
| **Mesaria** | Inland village, vineyards, local life |
| **Emporio** | Medieval fortress tower, authentic character |
| **Perissa** | Black sand beach, beach umbrellas, mountain backdrop |
| **Thira** | Historic center, archaeological museum |
| **Vothonas** | Cave houses carved into rock, unique architecture |

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/generate-destination-image/index.ts` | Edge function for AI image generation |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/AdminDestinations.tsx` | Add "Generate Image" button per destination |
| `src/hooks/useDestinations.ts` | Add image generation mutation |
| `supabase/config.toml` | Add new function configuration |

### Database/Storage

- Create `destination-images` storage bucket with public access policy

---

## User Experience

### Admin Workflow

1. Navigate to **Admin > Destinations**
2. See destinations listed with image preview (or placeholder)
3. Click **"Generate Image"** button on any destination
4. See loading spinner during generation (5-15 seconds)
5. Image appears in preview once complete
6. Optional: "Generate All Missing" batch action

### Generated Image Quality

- Style: Professional travel photography
- Lighting: Golden hour / dramatic Mediterranean light
- Composition: Landscape orientation (4:3)
- Content: Iconic village features specific to each location

---

## Benefits

- **Consistent visual quality** across all destinations
- **No stock photo licensing concerns** - AI-generated content
- **Quick iteration** - regenerate if result isn't ideal
- **Cost-effective** - uses existing Lovable AI credits
- **Scalable** - easy to add new destinations in the future

