

# Enriched Property Description and Neighborhood Section

## Problem

Currently, both the property description and neighborhood description are rendered as plain, single-paragraph text blocks. There is no structure, no visual hierarchy, and no way to manage a short intro vs. a longer detailed description from the admin dashboard.

## Solution

### 1. Database: Add a `short_description` Column

Add a new `short_description` text column to the `properties` table. This serves as the "hook" paragraph -- always visible, editorial-quality intro text. The existing `description` field becomes the full/extended description that appears behind a "Read more" collapsible.

### 2. Admin Dashboard Changes (`AdminPropertyForm.tsx`)

**Description section** gets restructured into two fields:

- **Short Description** (new) -- a smaller textarea with placeholder guidance: *"A compelling 1-2 sentence intro that is always visible to guests"*
- **Full Description** (existing `description` field) -- renamed label to "Full Description", with guidance: *"Detailed property description. Use blank lines to separate paragraphs."*

**Location and Neighborhood section** -- add a dedicated collapsible card in the admin form with:
- **Neighborhood Description** textarea (currently exists in data but has no form field)
- Helper text: *"Describe the area, vibe, and what makes the location special"*

### 3. Frontend: Property Detail Page

**Overview Section** redesign:
- The `short_description` renders as a styled lead paragraph (larger text, serif font, slightly darker) -- always visible
- The `description` renders below it, split by double-newlines into proper `<p>` tags with relaxed leading
- If the full description exceeds ~3 paragraphs, it collapses with a smooth "Read more / Read less" toggle using Radix Collapsible
- A decorative drop-cap on the first letter of the short description for editorial flair

**Location and Neighborhood** redesign in `NeighborhoodInfo.tsx`:
- The neighborhood description gets the same paragraph-splitting treatment
- If longer than 2 paragraphs, it collapses with "Read more about this area"
- Add a subtle quote-style accent border on the left side of the description block

### 4. Files Changed

| File | Change |
|------|--------|
| Database migration | Add `short_description TEXT` column to `properties` |
| `src/pages/admin/AdminPropertyForm.tsx` | Split description into Short + Full fields; add Neighborhood Description textarea |
| `src/pages/PropertyDetail.tsx` | Render short_description as lead paragraph, collapsible full description |
| `src/components/properties/NeighborhoodInfo.tsx` | Paragraph splitting, collapsible long text, accent styling |

### 5. Technical Details

**Paragraph splitting utility:**
```text
function splitParagraphs(text: string): string[]
  - Split on double newlines (\n\n)
  - Filter empty strings
  - Trim each paragraph
```

**Collapsible threshold:**
- Property description: collapse after showing first 2 paragraphs (if total > 3)
- Neighborhood description: collapse after showing first paragraph (if total > 2)

**No markdown rendering** -- these are plain text fields, not blog content. Paragraphs only.

**Admin form state additions:**
- `short_description: null as string | null` added to formData
- Neighborhood description textarea wired to existing `neighborhood_description` field

