# Complete CMS Overhaul: Theme Alignment, Editable Icons, and Section Display Modes

## Three Problems to Solve

### Problem 1: Hardcoded Colors Not Following the Brand Palette

Many components use hardcoded Tailwind color classes (e.g., `text-amber-500`, `bg-green-100`, `text-red-600`) instead of the semantic design tokens (`text-primary`, `bg-accent`, `text-destructive`). When an admin changes the brand palette in Settings, these elements stay the same color -- breaking visual consistency.

**Components with hardcoded colors (27+ files affected):**

- `LiveAvailabilityBadge.tsx` -- green/amber hardcoded for status
- `InstantBookingBadge.tsx` -- amber hardcoded
- `PropertyCard.tsx` -- amber, green hardcoded for badges
- `TipCallout.tsx` -- amber, blue hardcoded for callout types
- `PMSConnectionHealthCard.tsx` -- green/red/blue/yellow hardcoded
- `PMSSyncStatusPanel.tsx` -- green hardcoded
- `GuestyQuotaMonitor.tsx` -- likely hardcoded status colors
- `DestinationCard.tsx` -- `text-white` on featured badge
- Blog components -- white text on overlays
- Hero sections on About, Destinations, Contact -- `text-white` on image overlays

**Note:** Some hardcoded colors are intentionally correct (e.g., `text-white` over dark image overlays, `bg-black/60` for backdrop overlays). These will be left alone since they serve contrast purposes over images. The fix targets status indicators, badges, and UI chrome that should follow the theme.

### Problem 2: Hero Quick-Nav Icons Cannot Be Edited

The Navigation Manager currently shows a plain text input for the icon name. Users must know Lucide icon names (e.g., "MapPin", "Home"). There is no visual icon picker for the hero quick-nav items -- unlike the Page Content editor which has a full `IconPicker` component with search and visual grid.

### Problem 3: No Section Display Mode Controls

Every content section (properties grid, experiences grid, destinations grid, blog posts) is locked to a single layout. Admins have no way to choose between a grid, carousel/slider, list, or featured-highlight layout. There are no animation or transition options either.

---

## Solution

### Part 1: Theme-Aligned Colors

**Approach:** Audit all components with hardcoded Tailwind color classes and replace them with semantic tokens that respond to the brand palette. This uses the existing `getStatusColors()` utility in `src/lib/utils.ts` where applicable, and maps remaining hardcoded colors to the closest semantic token.

**Mapping:**

```text
bg-amber-100 / text-amber-700  -->  bg-accent/10 text-accent (for feature badges)
bg-green-100 / text-green-600  -->  Uses getStatusColors('success') 
bg-red-100 / text-red-600      -->  Uses getStatusColors('error') or text-destructive
bg-blue-100 / text-blue-600    -->  Uses getStatusColors('running') or text-primary
```

**Files to modify (public-facing, highest impact):**


| File                        | Change                                 |
| --------------------------- | -------------------------------------- |
| `InstantBookingBadge.tsx`   | amber --> accent tokens                |
| `PropertyCard.tsx`          | amber/green badges --> accent/semantic |
| `QuickBookCard.tsx`         | Already mostly semantic, minor fixes   |
| `LiveAvailabilityBadge.tsx` | green/amber --> semantic status tokens |
| `DestinationCard.tsx`       | gold-accent badge already OK, verify   |


**Files to modify (admin, lower priority but included):**


| File                          | Change                      |
| ----------------------------- | --------------------------- |
| `PMSConnectionHealthCard.tsx` | green/red/blue --> semantic |
| `PMSSyncStatusPanel.tsx`      | green --> semantic          |
| `GuestyQuotaMonitor.tsx`      | status colors --> semantic  |


**Also we should have a single column slider especially for mobile mode showcasing either properties or experiences or destinations . Blog components** like `TipCallout.tsx` are intentionally styled with fixed semantic colors for readability (tip = amber, info = blue) and will be kept as-is since they are content presentation, not chrome.

### Part 2: Icon Picker for Navigation Items

**Change:** Replace the plain text `<Input>` for the icon field in `NavigationItemFormDialog.tsx` with the existing `IconPicker` component (already used in Page Content editor). This gives admins a visual grid with search to pick any Lucide icon.

**Files to modify:**


| File                           | Change                                                                  |
| ------------------------------ | ----------------------------------------------------------------------- |
| `NavigationItemFormDialog.tsx` | Import and use `IconPicker` component instead of `Input` for icon field |


This is a small change -- the `IconPicker` component already exists and works well.

### Part 3: Section Display Modes (Layout + Animation Options)

This is the largest piece. It introduces a new database table and admin UI to let admins choose how each content section renders.

#### New Database Table: `section_display_settings`


| Column              | Type        | Purpose                                             |
| ------------------- | ----------- | --------------------------------------------------- |
| `id`                | uuid (PK)   | Primary key                                         |
| `page_slug`         | text        | Which page (e.g., `home`, `about`)                  |
| `section_key`       | text        | Which section (e.g., `properties`, `experiences`)   |
| `layout_mode`       | text        | `grid` (default), `carousel`, `list`, `featured`    |
| `columns`           | integer     | Number of grid columns (2, 3, or 4)                 |
| `animation`         | text        | `fade-up` (default), `scale-in`, `slide-in`, `none` |
| `autoplay`          | boolean     | For carousel mode, auto-advance                     |
| `autoplay_interval` | integer     | Seconds between slides                              |
| `items_per_view`    | integer     | For carousel, how many visible at once              |
| `show_navigation`   | boolean     | Show prev/next arrows (carousel)                    |
| `show_dots`         | boolean     | Show pagination dots (carousel)                     |
| `updated_at`        | timestamptz | Auto-set                                            |


**Unique constraint** on `(page_slug, section_key)`.
**RLS**: Public read, admin full CRUD.

**Seed data:** Insert defaults for all existing sections so current behavior is preserved.

#### New Hook: `useSectionDisplay`

```text
useSectionDisplay(pageSlug, sectionKey) --> { layoutMode, columns, animation, ... }
```

Returns the display configuration for a section, with sensible defaults if no database row exists.

#### New Component: `SectionRenderer`

A wrapper component that takes children (the content items) and renders them according to the display settings:

- **Grid mode**: CSS grid with configurable columns
- **Carousel mode**: Embla carousel (already installed) with arrows, dots, autoplay
- **List mode**: Vertical stack with alternating layout
- **Featured mode**: First item large, rest in a smaller grid below

Each mode applies the chosen entrance animation using Framer Motion.

#### Admin UI: Section Display Editor

Add a "Display Settings" expandable panel to each section in `AdminPageContent.tsx`. This shows:

- Layout mode selector (4 visual options: grid, carousel, list, featured)
- Column count (for grid)
- Animation selector (4 options with preview)
- Carousel-specific options (autoplay, interval, arrows, dots)

#### Frontend Integration

Update these page sections to use `SectionRenderer`:

- Homepage: properties, destinations, experiences, blog posts
- Properties page: property grid
- Destinations page: destination grid
- Experiences page: experience grid
- Blog page: post grid

---

## Files to Create


| File                                    | Purpose                                                 |
| --------------------------------------- | ------------------------------------------------------- |
| `src/hooks/useSectionDisplay.ts`        | Hook for reading/writing section display settings       |
| `src/components/ui/SectionRenderer.tsx` | Universal layout renderer (grid/carousel/list/featured) |


## Files to Modify


| File                                                | Change                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/components/admin/NavigationItemFormDialog.tsx` | Replace icon text input with `IconPicker`                              |
| `src/components/properties/InstantBookingBadge.tsx` | amber --> accent tokens                                                |
| `src/components/properties/PropertyCard.tsx`        | amber/green --> semantic tokens                                        |
| `src/components/booking/LiveAvailabilityBadge.tsx`  | green/amber --> semantic tokens                                        |
| `src/components/admin/PMSConnectionHealthCard.tsx`  | hardcoded colors --> semantic                                          |
| `src/components/admin/PMSSyncStatusPanel.tsx`       | green --> semantic                                                     |
| `src/pages/Index.tsx`                               | Wrap property/destination/experience/blog grids with `SectionRenderer` |
| `src/pages/Properties.tsx`                          | Wrap property grid with `SectionRenderer`                              |
| `src/pages/About.tsx`                               | Wrap values grid with `SectionRenderer`                                |
| `src/hooks/usePageContent.ts`                       | No schema changes needed -- display settings are separate              |
| `src/pages/admin/AdminPageContent.tsx`              | Add display settings panel per section                                 |


## Database Migration

One migration creating `section_display_settings` table with RLS policies and seed data.

## What Does NOT Change

- Booking logic, PMS integrations, pricing -- untouched
- The `page_content` CMS system -- enhanced, not replaced
- Image overlays using `text-white` over dark backgrounds -- these are correct as-is
- Blog article styling (TipCallout colors are intentional for content semantics)