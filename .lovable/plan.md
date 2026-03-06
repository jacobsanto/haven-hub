

## Plan: Replace Section Layout Options with Hero-Style Showcase Variants

### Goal
Replace the current 4 layout modes (Grid, Carousel, List, Featured) for homepage sections with the 7 hero slider variants as selectable showcase styles. Each section (Destinations, Discover Villas, Featured Vacations, Experiences) will be able to render its items using any of the 7 cinematic presentation styles.

### Architecture

The hero slider variants currently accept `{ properties, activeIndex, onSelect }` and render full-screen single-active-item showcases. We need section-level wrapper components that:
- Accept generic items (destinations, properties, experiences) as children or data
- Manage their own `activeIndex` state + autoplay
- Render the chosen variant's visual style adapted for mid-page use (not full-bleed, contained in a section)
- Include navigation controls (arrows, dots)

### New Component: `SectionShowcase`

Create `src/components/ui/SectionShowcase.tsx` — a mid-page showcase component that:

1. Takes `layout_mode` from `useSectionDisplay` settings (now storing variant IDs like `parallax-depth`, `cinematic`, etc.)
2. For legacy values (`grid`, `carousel`, `list`, `featured`), delegates to existing `SectionRenderer`
3. For hero variant values (`parallax-depth`, `split-reveal`, `morph-tiles`, `cinematic`, `vertical-curtain`, `card-deck`, `bright-minimalist`), renders a contained showcase section with:
   - A fixed-height container (~500-600px) instead of full viewport height
   - The chosen variant's visual style adapted to work with generic item data
   - Built-in activeIndex state, autoplay, and navigation controls

Each variant adaptation will map generic item data (image, title, subtitle, link, badge) to the variant's visual template.

### Interface for Generic Items

```typescript
interface ShowcaseItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  link: string;
  meta?: string; // e.g. price, duration
}
```

Each homepage section will map its data (destinations, properties, experiences) to this interface before passing to `SectionShowcase`.

### Admin Settings Update

Replace `LAYOUT_OPTIONS` (4 items) with all 11 options (7 hero variants + 4 original layouts):

| ID | Name | Description |
|----|------|-------------|
| `grid` | Grid | Responsive column layout |
| `carousel` | Carousel | Horizontal slider with navigation |
| `list` | List | Vertical stacked cards |
| `featured` | Featured | Hero card + supporting grid |
| `parallax-depth` | Parallax Depth | Full-bleed parallax with scale transitions |
| `split-reveal` | Split Reveal | 55/45 split with clip-path reveal |
| `morph-tiles` | Morph Tiles | 4-tile grid that expands active tile |
| `cinematic` | Cinematic | Centered text with Ken Burns zoom |
| `vertical-curtain` | Vertical Curtain | Vertical clip-path with side nav dots |
| `card-deck` | Card Deck | Stacked cards with ambient blur |
| `bright-minimalist` | Bright Minimalist | Light split layout with color-tinted cards |

The selector UI will be split into two groups: "Card Layouts" (grid/carousel/list/featured) and "Showcase Styles" (the 7 hero-inspired variants).

### Homepage Section Changes

Each of the 4 sections will:
1. Map its data to `ShowcaseItem[]`
2. Check `settings.layout_mode` — if it's a hero variant, render `SectionShowcase`; if it's a card layout, render `SectionRenderer` as today
3. Keep section headers/titles unchanged

### No Database Changes
The `layout_mode` column is already a `string` type, so it can store any variant ID.

### Files

| File | Change |
|------|--------|
| `src/components/ui/SectionShowcase.tsx` | **New** — Mid-page showcase component with 7 adapted hero variants |
| `src/pages/admin/AdminSettings.tsx` | Update `LAYOUT_OPTIONS` to include all 11 options with grouped UI |
| `src/components/home/DestinationsShowcase.tsx` | Add data mapping + conditional SectionShowcase rendering |
| `src/components/home/DiscoverVillasSection.tsx` | Same pattern |
| `src/components/home/FeaturedVacationSection.tsx` | Same pattern |
| `src/components/home/LiveExperiencesSection.tsx` | Same pattern |
| `src/hooks/useSectionDisplay.ts` | Extend `layout_mode` type to include variant IDs |

