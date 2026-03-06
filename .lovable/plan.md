

## Plan: Add Homepage Section Layout Selectors to Admin Settings

### What
Add a new settings section in AdminSettings (mirroring the Hero Style Selector pattern) that lets admins pick a layout mode (Grid, Carousel, List, Featured) for each of the 4 homepage content sections. Then wire those sections to use `SectionRenderer` with the saved settings.

### Admin UI — New `HomepageSectionsLayout` component in `AdminSettings.tsx`

Add a new component below `HeroImageSection` that:
- Uses `useAllSectionDisplaySettings()` to load current values and `useUpsertSectionDisplay()` to save
- Renders 4 cards (one per section: Destinations, Discover Villas, Featured Vacations, Experiences)
- Each card has a grid of 4 selectable layout buttons (same pattern as hero style selector): Grid, Carousel, List, Featured
- When "Carousel" is selected, show additional options: autoplay toggle, items_per_view (2-6), show_dots, show_navigation
- Active layout gets `border-primary bg-primary/5` + "Active" badge (identical to hero selector)

Layout options:

| ID | Name | Description |
|----|------|-------------|
| `grid` | Grid | Responsive column layout |
| `carousel` | Carousel | Horizontal slider with navigation |
| `list` | List | Vertical stacked cards |
| `featured` | Featured | Hero card + supporting grid |

Section keys: `destinations`, `discover-villas`, `featured-vacations`, `experiences`

### Homepage Sections — Wrap items in `SectionRenderer`

For each of these 4 files, replace the hardcoded grid/carousel `<div>` with `<SectionRenderer settings={...}>` wrapping individual card items:

1. **`DestinationsShowcase.tsx`** — Import `useSectionDisplay` + `SectionRenderer`. Call `useSectionDisplay('home', 'destinations')`. Wrap destination cards in `<SectionRenderer>`. Keep header unchanged.

2. **`DiscoverVillasSection.tsx`** — Remove shadcn `Carousel` import/usage. Replace with `SectionRenderer`. Call `useSectionDisplay('home', 'discover-villas')`.

3. **`FeaturedVacationSection.tsx`** — Same pattern with key `featured-vacations`.

4. **`LiveExperiencesSection.tsx`** — Same pattern with key `experiences`.

### Files Modified
- `src/pages/admin/AdminSettings.tsx` — Add `HomepageSectionsLayout` component + render it after `HeroImageSection`
- `src/components/home/DestinationsShowcase.tsx`
- `src/components/home/DiscoverVillasSection.tsx`
- `src/components/home/FeaturedVacationSection.tsx`
- `src/components/home/LiveExperiencesSection.tsx`

### No Database Changes
The `section_display_settings` table already exists. `useSectionDisplay` provides defaults when no row exists.

