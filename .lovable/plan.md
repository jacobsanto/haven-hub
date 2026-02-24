

# Add SEO Metadata Fields Per Page with Dynamic Meta Tags

## Overview

Add editable SEO metadata (meta title, meta description, OG image) for every page, manageable from the existing Admin Page Content editor, and rendered dynamically in the frontend via a reusable `<PageSEO>` component.

## What Changes

### 1. Add SEO Section to Every Page Schema

In `src/hooks/usePageContent.ts`, add a new `seo` section to each page in `PAGE_CONTENT_SCHEMAS` with three fields:

| Field | Type | Default |
|-------|------|---------|
| `meta_title` | text | Page-specific title (e.g. "Luxury Vacation Homes \| {brandName}") |
| `meta_description` | text | Page-specific description |
| `og_image` | image | Current hardcoded OG image or page hero image |

This means all SEO fields will automatically appear in the existing `/admin/content` editor -- no new admin UI needed.

### 2. Create `PageSEO` Component

New file: `src/components/seo/PageSEO.tsx`

A small component that:
- Accepts `pageSlug` as a prop
- Calls `usePageContent(pageSlug, 'seo', defaults)` to fetch SEO data
- Uses `document.title` and DOM manipulation to set `<meta>` tags dynamically
- Sets: `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta name="twitter:image">`
- Falls back to sensible defaults from the schema if no DB values exist

```text
function PageSEO({ pageSlug, defaults }) {
  const seo = usePageContent(pageSlug, 'seo', defaults);

  useEffect(() => {
    document.title = seo.meta_title;
    setMetaTag('description', seo.meta_description);
    setMetaTag('og:title', seo.meta_title, 'property');
    setMetaTag('og:description', seo.meta_description, 'property');
    setMetaTag('og:image', seo.og_image, 'property');
    setMetaTag('twitter:image', seo.og_image);
  }, [seo]);

  return null; // renders nothing visible
}
```

### 3. Add `<PageSEO>` to Each Public Page

Drop `<PageSEO pageSlug="home" />` (etc.) into each page component, right inside the return:

- `Index.tsx` -- pageSlug `"home"`
- `About.tsx` -- pageSlug `"about"`
- `Properties.tsx` -- pageSlug `"properties"`
- `Destinations.tsx` -- pageSlug `"destinations"`
- `Experiences.tsx` -- pageSlug `"experiences"`
- `Contact.tsx` -- pageSlug `"contact"`
- `Privacy.tsx` -- pageSlug `"privacy"` (new schema entry)
- `Terms.tsx` -- pageSlug `"terms"` (new schema entry)
- `Blog.tsx` -- pageSlug `"blog"` (new schema entry)

### 4. Add Missing Page Schemas

Add `PAGE_CONTENT_SCHEMAS` entries for pages that don't have one yet: `privacy`, `terms`, and `blog`. Each will have at minimum the `seo` section. This also means these pages will appear in the admin content editor.

## Files to Create
- `src/components/seo/PageSEO.tsx`

## Files to Modify
- `src/hooks/usePageContent.ts` -- add `seo` section to all existing page schemas; add `privacy`, `terms`, `blog` schemas
- `src/pages/Index.tsx` -- add `<PageSEO>`
- `src/pages/About.tsx` -- add `<PageSEO>`
- `src/pages/Properties.tsx` -- add `<PageSEO>`
- `src/pages/Destinations.tsx` -- add `<PageSEO>`
- `src/pages/Experiences.tsx` -- add `<PageSEO>`
- `src/pages/Contact.tsx` -- add `<PageSEO>`
- `src/pages/Privacy.tsx` -- add `<PageSEO>`
- `src/pages/Terms.tsx` -- add `<PageSEO>`
- `src/pages/Blog.tsx` -- add `<PageSEO>`

## No Database Changes Required

The existing `page_content` table already supports this -- SEO entries will be stored as `page_slug + section_key='seo' + content_key` rows, just like all other content. No migration needed.

