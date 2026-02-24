

# Per-Property Storage Paths for CMS Uploads

## Problem

Property image uploads currently go into shared flat folders (`hero/`, `gallery/`). This means:

- All properties' hero images are mixed together in one folder
- All gallery images from every property share a single folder
- There's no way to quickly identify which images belong to which property
- Deleting a property's images requires scanning filenames, not browsing a folder

## Solution

Scope property uploads to per-property folders using the property slug or ID. This applies to:

1. **Hero images** -- currently `hero/{timestamp}.webp`, change to `properties/{slug}/hero/{timestamp}.webp`
2. **Gallery images** -- currently `gallery/{timestamp}.webp`, change to `properties/{slug}/gallery/{timestamp}.webp`

The Quick Onboard flow (used before a slug exists) will use a temporary path and still work correctly since the URL is stored in the database regardless of folder structure.

## Files to Modify

### `src/pages/admin/AdminPropertyForm.tsx`

- Hero image `storagePath`: change from `"hero"` to `` `properties/${formData.slug || formData.id || 'new'}/hero` ``
- Gallery image `storagePath`: change from `"gallery"` to `` `properties/${formData.slug || formData.id || 'new'}/gallery` ``
- Uses the property slug when available (most cases), falls back to ID, then `"new"` for unsaved properties

### `src/pages/admin/AdminQuickOnboard.tsx`

- Hero image `storagePath`: change from `"hero"` to `` `properties/${form.slug || 'onboard'}/hero` ``
- Uses the slug entered in the onboard form, falls back to `"onboard"` before a slug is entered

## No Other Changes Needed

- The `ImageUploadWithOptimizer` component already accepts `storagePath` as a prop and builds the full path dynamically
- No database changes -- the stored value is always the full public URL
- No storage bucket changes -- all files remain in the existing `property-images` bucket
- Existing uploaded images continue to work since their URLs are already saved in the database
- CMS page content already uses per-page paths (`page-content/{pageSlug}/`)
- Blog, experiences, addons, etc. are lower volume and don't need per-entity scoping at this stage

## Result

```text
Before:
  property-images/
    hero/1234.webp
    hero/5678.webp
    gallery/abcd.webp
    gallery/efgh.webp

After:
  property-images/
    properties/villa-amalfi/hero/1234.webp
    properties/villa-amalfi/gallery/abcd.webp
    properties/santorini-retreat/hero/5678.webp
    properties/santorini-retreat/gallery/efgh.webp
```
