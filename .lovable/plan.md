

# Add Admin Theme Toggle and Live Content Preview

## Problem

1. **No dark/light toggle in admin** -- The admin panel has no way to switch between light and dark mode. The public site has toggles in the Header and Footer, but `AdminLayout` doesn't include one.
2. **No live preview** -- When editing page content or SEO fields in `/admin/content`, admins must save and navigate to the public page to see the result. There's no inline preview.

## Solution

### Part 1: Admin Theme Toggle

Add a Sun/Moon toggle button to the admin sidebar (bottom area, next to the "Back to Website" link). This uses the existing `next-themes` `useTheme()` hook -- no new dependencies needed.

**File: `src/components/admin/AdminLayout.tsx`**

- Import `useTheme` from `next-themes` and `Moon`/`Sun` icons
- Add a toggle button in the sidebar footer area (between "Back to Website" and the user email/sign-out row)
- Also add the toggle to the mobile header bar
- The toggle calls `setTheme(theme === 'dark' ? 'light' : 'dark')`, same pattern as Header/Footer

### Part 2: Live Content Preview Panel

Add an expandable preview panel to the `/admin/content` page editor that shows a rendered preview of the current section being edited, updating in real-time as the admin types.

**File: `src/pages/admin/AdminPageContent.tsx`**

- Add a "Preview" toggle button at the top of the page editor
- When enabled, show a preview panel below or beside the form
- The preview renders a simplified representation of the section content using the current `formValues` (not yet saved to DB)
- For SEO sections: show a Google-style search result snippet (title truncated to ~60 chars, description to ~160 chars, with the URL)
- For text sections: show the heading/subheading/paragraph in a styled card that approximates the public page layout
- For image fields: show a thumbnail preview of the URL
- Preview updates live as the admin types (no save required)

**New file: `src/components/admin/ContentPreview.tsx`**

A reusable preview component that accepts:
- `sectionKey` -- to determine the preview layout
- `fields` -- the field definitions from the schema
- `values` -- the current form values (live from state)

It renders:
- **SEO Preview**: A Google SERP-style card showing title (blue link), URL, and description (grey text), with character count indicators
- **Hero Preview**: Large heading + subtitle on a muted background
- **General Text Preview**: Heading + paragraph in a card

## Technical Details

### Theme Toggle (AdminLayout)

```text
Location: sidebar footer, between "Back to Website" and user email
Component: Button with Moon/Sun icon
Logic: useTheme() from next-themes, same as Header.tsx
Mobile: Also added to the mobile sticky header bar
```

### Content Preview (AdminPageContent)

```text
State: showPreview boolean toggle
Rendering: Maps over current section fields using live formValues
SEO: Google SERP mockup with char limits (60 title / 160 description)
Text: Styled card with heading hierarchy
Image: img tag with the URL value, fallback placeholder
```

## Files to Create
- `src/components/admin/ContentPreview.tsx` -- Preview renderer component

## Files to Modify
- `src/components/admin/AdminLayout.tsx` -- Add theme toggle to sidebar and mobile header
- `src/pages/admin/AdminPageContent.tsx` -- Add preview toggle and render ContentPreview

## No Database Changes Required

All preview rendering uses live form state. No new tables or migrations.
