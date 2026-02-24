

# CMS Content Management System -- Audit and Editable Page Content

## Current State Assessment

### What Haven Hub Already Has (Working Well)
- **Properties, Destinations, Experiences, Blog** -- full CRUD from admin with database-backed content
- **Brand Identity** -- name, tagline, logo, contact info editable from Admin Settings
- **Color Palette + Typography** -- dynamic theming with light/dark mode
- **AI Content Generator** -- for properties, destinations, experiences, blog posts
- **Blog System** -- full posts, categories, authors, scheduling
- **Promotional Campaigns** -- pop-ups, coupons, exit intent

### What Is Missing (The Gap)

All **static page copy** is hardcoded in React components. An admin cannot change:

| Page | Hardcoded Content Examples |
|------|--------------------------|
| **Homepage** | "Experience {city}", "Book Your Stay", "Handpicked luxury homes...", trust badge titles/descriptions, "Why Book Direct" section titles and bullet points |
| **About** | "Our Story" paragraphs, values (titles + descriptions), stats ("10+ Years", "25+ Properties"), CTA text |
| **Properties** | "Find & Book Your Perfect Stay", "Best rates guaranteed..." |
| **Destinations** | "Choose Your Destination", subtitle text |
| **Experiences** | "Enhance Your Stay", "Add unforgettable experiences...", CTA section |
| **Contact** | "Get in Touch", "Send Us a Message", "Need Immediate Assistance?" card text |
| **Privacy / Terms** | Entire legal copy |
| **Footer** | Section headings, social links, legal text |

This means every text change requires a developer prompt -- which is not how a production CMS should work.

---

## Proposed Solution: Editable Page Content System

### Architecture: Key-Value Content Blocks

Create a `page_content` table where each row is a content block identified by a unique **page + section + key** combination. The admin edits these blocks from a dedicated page. The frontend reads them via a hook with hardcoded fallbacks (so the site never breaks).

### Database Table: `page_content`

```text
page_content
  id           uuid (PK)
  page_slug    text         -- e.g. "home", "about", "contact"
  section_key  text         -- e.g. "hero", "trust_badges", "our_story"
  content_key  text         -- e.g. "heading", "subheading", "paragraph_1"
  content_type text         -- "text", "richtext", "json"
  value        text         -- The actual content
  updated_at   timestamptz
  UNIQUE(page_slug, section_key, content_key)
```

- **RLS**: Public SELECT for all rows (content is public). Admin-only INSERT/UPDATE/DELETE.
- No migration risk -- purely additive.

### Frontend Hook: `usePageContent`

```text
usePageContent("home", "hero")
  --> returns { heading: "...", subheading: "...", ... }
  --> falls back to hardcoded defaults if DB row missing
```

This means:
- Site works perfectly without any DB content (current behavior preserved)
- Admin edits override defaults immediately
- No blank screens ever

### Admin Page: `/admin/content`

A new admin page with:
- Left sidebar listing all pages (Home, About, Properties, Destinations, Experiences, Contact, Privacy, Terms, Footer)
- Each page shows its sections as collapsible groups
- Each section shows its editable fields (text inputs, textareas, or a simple rich-text editor for longer content)
- Save per-section or save-all button
- "Reset to Default" per field

### Content Seeding

On first load, seed the table with all current hardcoded values so the admin sees pre-filled fields immediately.

---

## Additional CMS Gaps to Address

Beyond editable text, here are other areas a modern hospitality CMS should have:

### 1. Hero Images per Page (Priority: High)
Currently, About, Contact, Destinations pages use hardcoded Unsplash URLs. These should be editable from the same content editor or from a `page_content` row with `content_type = "image"`.

### 2. SEO Metadata (Priority: High)
No page has editable meta title, meta description, or Open Graph tags. Add `seo_title`, `seo_description`, `og_image` fields to the `page_content` table (one set per `page_slug`). The frontend reads these and sets `<title>` and `<meta>` tags dynamically.

### 3. Social Links Management (Priority: Medium)
Footer social links (Instagram, Facebook, Twitter) are rendered as icons but point nowhere. Add social link fields to the brand_settings table so they are editable from Admin Settings.

### 4. Navigation Menu Management (Priority: Low)
Navigation items are hardcoded in `Header.tsx`. A full CMS would allow reordering/hiding nav items. This is lower priority but worth noting.

---

## Implementation Plan

### Step 1: Database Migration
Create the `page_content` table with RLS policies and seed it with all current hardcoded content from every page.

### Step 2: Add Social Links to brand_settings
Add columns: `social_instagram`, `social_facebook`, `social_twitter`, `social_youtube` to the existing `brand_settings` table.

### Step 3: Hook -- `usePageContent`
- Service function to fetch all content for a page slug
- React Query hook with caching
- Helper to get a value with fallback
- Admin mutation hook for updates

### Step 4: Admin Page -- `/admin/content`
- New page at `src/pages/admin/AdminPageContent.tsx`
- Page selector (tabs or sidebar)
- Section-grouped form fields
- Save/reset functionality
- Add route to `App.tsx` and navigation to `AdminLayout`

### Step 5: Integrate Hook into Public Pages
Update each page component to use `usePageContent()` instead of hardcoded strings:
- `Index.tsx` (homepage)
- `About.tsx`
- `Properties.tsx`
- `Destinations.tsx`
- `Experiences.tsx`
- `Contact.tsx`
- `Privacy.tsx`
- `Terms.tsx`
- `Footer.tsx`

### Step 6: Social Links in Admin Settings and Footer
- Add social link fields to Admin Settings form
- Update Footer to read from brand settings

## Files to Create
- `src/hooks/usePageContent.ts` -- hook + service
- `src/pages/admin/AdminPageContent.tsx` -- admin editor page

## Files to Modify
- `src/App.tsx` -- add route for `/admin/content`
- `src/components/admin/AdminLayout.tsx` -- add nav item
- `src/pages/Index.tsx` -- use `usePageContent` hook
- `src/pages/About.tsx` -- use `usePageContent` hook
- `src/pages/Properties.tsx` -- use `usePageContent` hook
- `src/pages/Destinations.tsx` -- use `usePageContent` hook
- `src/pages/Experiences.tsx` -- use `usePageContent` hook
- `src/pages/Contact.tsx` -- use `usePageContent` hook
- `src/pages/Privacy.tsx` -- use `usePageContent` hook
- `src/pages/Terms.tsx` -- use `usePageContent` hook
- `src/components/layout/Footer.tsx` -- use `usePageContent` hook + social links
- `src/hooks/useBrandSettings.ts` -- add social link fields
- `src/pages/admin/AdminSettings.tsx` -- add social link inputs

## Database Changes
- New table: `page_content` with RLS
- Seed data: all current hardcoded strings
- Alter table: `brand_settings` add social link columns

