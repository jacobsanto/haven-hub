

## Plan: Add Featured + Sort Order for Properties & Destinations + Display Layout Settings for All Pages

### Problem
1. **Properties** have no `is_featured` toggle or `featured_sort_order` — homepage just pulls latest 6 active properties
2. **Destinations** have `is_featured` but no `featured_sort_order` — no control over display sequence
3. **Section Display settings** only cover 5 pages (`home`, `properties`, `destinations`, `experiences`, `about`) — missing pages like `blog`, `contact`, `faq`, etc. have no layout controls

### Changes

#### 1. Database Migration

```sql
-- Properties: add featured toggle + sort order
ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN featured_sort_order INTEGER DEFAULT 0;

-- Destinations: add sort order (is_featured already exists)
ALTER TABLE destinations ADD COLUMN featured_sort_order INTEGER DEFAULT 0;
```

#### 2. Update TypeScript Types

**`src/types/database.ts`** — Add `is_featured: boolean` and `featured_sort_order: number` to `Property` interface.

**`src/types/destinations.ts`** — Add `featured_sort_order: number` to `Destination` interface.

#### 3. Update Hooks

**`src/hooks/useProperties.ts`** — Change `useFeaturedProperties()` to filter `is_featured = true` and order by `featured_sort_order ASC` instead of `created_at DESC` with limit 6.

**`src/hooks/useDestinations.ts`** — Update `useFeaturedDestinations()` to order by `featured_sort_order ASC`.

#### 4. Admin UI — Properties Featured Toggle + Sort Order

**`src/pages/admin/AdminProperties.tsx`** — Add a "Featured" `Switch` column and a numeric sort order `Input` in the table, wired to `useUpdateProperty`.

#### 5. Admin UI — Destinations Sort Order

**`src/pages/admin/AdminDestinations.tsx`** — Add a numeric sort order `Input` column next to the existing Featured switch.

#### 6. Expand Section Display Settings to All Pages

**`src/pages/admin/AdminPageContent.tsx`** — Expand `SECTION_LABELS` to include all remaining pages:

```typescript
const SECTION_LABELS: Record<string, Record<string, string>> = {
  home: { properties: 'Properties Grid', destinations: 'Destinations Grid', experiences: 'Experiences Grid', blog: 'Blog Posts Grid', 'featured-vacations': 'Featured Vacations', 'discover-villas': 'Discover Villas' },
  properties: { grid: 'Property Listing' },
  destinations: { grid: 'Destinations Listing' },
  experiences: { grid: 'Experiences Listing' },
  about: { values: 'Values Grid' },
  blog: { grid: 'Blog Posts Grid' },
  faq: { grid: 'FAQ Listing' },
  contact: { form: 'Contact Section' },
};
```

This maps every homepage section that uses `useSectionDisplay` (including `featured-vacations` and `discover-villas` which are already wired but were missing from the admin labels), plus adds layout controls for blog, FAQ, and contact pages.

#### 7. Homepage Sections — No Code Changes Needed

`HeroSection.tsx`, `DiscoverVillasSection.tsx`, `FeaturedVacationSection.tsx`, `DestinationsShowcase.tsx` already use `useFeaturedProperties()` / `useFeaturedDestinations()`. Once hooks are updated, they will automatically respect the new filtering and ordering.

### Summary

| Area | Change |
|------|--------|
| DB migration | 2 cols on `properties`, 1 col on `destinations` |
| Types | Update `Property` + `Destination` interfaces |
| Hooks | Filter by `is_featured`, order by `featured_sort_order` |
| Admin Properties | Add Featured switch + sort order input |
| Admin Destinations | Add sort order input |
| Admin Page Content | Expand `SECTION_LABELS` to cover all pages + missing homepage sections |
| Homepage | No changes (hooks already wired) |

