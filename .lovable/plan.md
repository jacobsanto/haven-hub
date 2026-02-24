# Add Image Upload to CMS Page Content Editor

## Problem

The CMS page content editor (`/admin/content`) treats all image fields (hero images, OG images) as plain text inputs where you must paste a URL. There is no way to upload an image directly from the editor. Meanwhile, the property form already has a fully functional `ImageUploadWithOptimizer` component with drag-and-drop, WebP conversion, and quality controls.

This creates an inconsistent admin experience: property images get a proper upload flow, but page-level hero and SEO images require manually uploading elsewhere and pasting a URL.

## Solution

Replace the plain text `<Input>` for image-type fields in the CMS editor with the existing `ImageUploadWithOptimizer` component. This gives admins the same upload, optimize, and preview experience they already have for properties.

### What Changes

**File: `src/pages/admin/AdminPageContent.tsx**`

- Import `ImageUploadWithOptimizer` and `IMAGE_PRESETS` from the existing optimizer component
- In the field rendering loop, when `field.type === 'image'`, render `ImageUploadWithOptimizer` instead of a plain `<Input>`
- Use `IMAGE_PRESETS.hero` for hero_image fields and `IMAGE_PRESETS.og` (or a reasonable default) for OG image fields
- The `onUpload` callback updates the form value (same as the current `onChange` but receives the optimized URL from storage)
- The `onRemove` callback clears the value back to empty string
- Keep the "Reset to default" button so admins can revert to the default Unsplash URL if needed

**File: `src/utils/image-optimizer.ts**` (minor addition)

- Add an `og` preset to `IMAGE_PRESETS` if one doesn't already exist (1200x630px, 80% quality -- standard OG image dimensions)

### How It Works

```text
Current flow (image fields):
  Admin pastes URL into text input --> saved as string

New flow (image fields):
  Admin clicks upload --> ImageUploadWithOptimizer handles:
    1. File selection (drag-and-drop or click)
    2. Client-side resize + WebP conversion
    3. Upload to storage bucket
    4. Returns public URL
  --> URL saved to form state, same as before
```

### Determining the Preset

The component will pick the image preset based on the field key:

- `hero_image` fields use `IMAGE_PRESETS.hero` (1920px wide)
- `og_image` fields use a new `IMAGE_PRESETS.og` (1200x630px)
- Other image fields use a general default

### Storage Path

Images will upload to a `page-content` folder in the existing storage bucket, organized by page slug (e.g., `page-content/about/hero_image.webp`).

## Files to Modify

- `src/pages/admin/AdminPageContent.tsx` -- Swap `<Input>` for `<ImageUploadWithOptimizer>` on image fields
- `src/utils/image-optimizer.ts` -- Add OG image preset if missing . ALso include the image optimizer we already have in place

## No Database Changes Required

The CMS stores image values as plain strings. Whether the string comes from a pasted URL or an uploaded file's public URL makes no difference to the schema.