

# Client-Side Image Optimizer for Admin Uploads

## Problem

Images uploaded through the admin property form go directly to storage without any optimization. Large photos from cameras or phones (often 3-10MB each) slow down the site for visitors and increase storage costs.

## Solution

Build a client-side image optimization utility that compresses and resizes images **before** uploading to storage. This runs entirely in the browser using the Canvas API -- no backend changes needed.

## How It Works

1. Admin selects an image file
2. The optimizer loads it into an off-screen canvas
3. It resizes to a max dimension (e.g., 1920px for hero, 1200px for gallery)
4. Converts to WebP format at configurable quality (default 80%)
5. Shows before/after file size so the admin sees the savings
6. Uploads the optimized version to storage

## Technical Details

### New Files

**`src/utils/image-optimizer.ts`** -- Pure utility, no UI
- `optimizeImage(file: File, options?: OptimizeOptions): Promise<OptimizedResult>`
- Options: `maxWidth`, `maxHeight`, `quality` (0-1), `format` ('webp' | 'jpeg')
- Returns: `{ blob: Blob, width, height, originalSize, optimizedSize }`
- Uses `HTMLCanvasElement.toBlob()` with WebP output
- Falls back to JPEG if WebP is not supported

**`src/components/admin/ImageUploadWithOptimizer.tsx`** -- Reusable upload component
- Wraps the file input with optimization preview
- Shows: thumbnail preview, original size, optimized size, savings percentage
- Quality slider (60-100%) for manual adjustment
- Upload button triggers after optimization
- Loading state during optimization and upload

### Modified Files

**`src/pages/admin/AdminPropertyForm.tsx`**
- Replace raw `handleImageUpload` with the new `ImageUploadWithOptimizer` component
- Used for both hero and gallery uploads

**`src/pages/admin/AdminQuickOnboard.tsx`**
- Same replacement for the hero image upload step

**`src/pages/admin/AdminSettings.tsx`**
- Same replacement for logo/brand image uploads

### Default Optimization Settings

| Image Type | Max Width | Max Height | Quality | Format |
|------------|-----------|------------|---------|--------|
| Hero       | 1920px    | 1080px     | 82%     | WebP   |
| Gallery    | 1600px    | 1200px     | 80%     | WebP   |
| Logo/Brand | 800px     | 400px      | 90%     | WebP   |

### UI Behavior

- When a file is selected, the optimizer runs automatically (takes under 1 second)
- A compact card appears showing:
  - Image thumbnail
  - Original: "3.2 MB" → Optimized: "180 KB" (94% smaller)
  - Quality slider for fine-tuning
  - "Upload" and "Cancel" buttons
- The upload only proceeds after the admin confirms

### No Backend Changes

Everything runs client-side using browser-native Canvas API. No database migrations, no edge functions, no new storage buckets needed. The optimized WebP blob is uploaded to the existing `property-images` bucket with a `.webp` extension.

