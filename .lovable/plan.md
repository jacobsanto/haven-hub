

# Hero Section Redesign: 4-Property Rotating Slider

## Overview
Replace the current static hero with an interactive full-screen hero that cycles through 4 properties. One property fills the background (landscape), while the other 3 appear as portrait cards on the right. Clicking "Next" smoothly transitions the first card into the new background.

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  [Navbar - transparent, as-is]                          │
│                                                         │
│  ┌──────────────────┐          ┌─────┐ ┌─────┐ ┌─────┐ │
│  │  ACTIVE PROPERTY │          │Card1│ │Card2│ │Card3│ │
│  │  ─────────────── │          │     │ │     │ │     │ │
│  │  Heading (2 lines)│         │     │ │     │ │     │ │
│  │  Subtitle         │         │     │ │     │ │     │ │
│  │  [Explore Button] │         │📍Loc│ │📍Loc│ │📍Loc│ │
│  └──────────────────┘          └─────┘ └─────┘ └─────┘ │
│                                                         │
│  Social Icons    UNIQUE LOCATIONS    01/04  ◀ ▶         │
└─────────────────────────────────────────────────────────┘
```

## Data Source
- Uses `useFeaturedProperties()` — first 4 active properties from the database
- Each property already has `hero_image_url`, `name`, `city`, `country`, `short_description`, `slug`
- The hero_image_url serves as both background (landscape) and card image (portrait crop via CSS)
- No new database tables or columns needed

## Admin Configurability
- Already editable: property images, names, descriptions via existing admin property forms
- Hero settings (search bar visibility, etc.) remain in `hero_settings` table
- Add new hero_settings keys: `hero_heading_line1`, `hero_heading_line2` for the active property's decorative heading override (optional, falls back to property name split)

## Component Changes

### `src/components/home/HeroSection.tsx` — Full rewrite
- **State**: `activeIndex` (0-3) tracks which property is the background
- **Background layer**: Two stacked `<div>`s with cross-fade CSS transition (opacity) for smooth background swap. Previous bg fades out while new one fades in over ~800ms
- **Left content**: Active property's heading (split into 2 lines from `display_name || name`), `short_description`, and a gradient "Explore" button linking to `/properties/{slug}`
- **Right card slider**: 3 portrait cards (the other 3 properties) displayed vertically or horizontally, each showing the property image cropped portrait, name, and `📍 {city}` at bottom
- **Footer bar**: Social icons (left), "UNIQUE LOCATIONS" label (center), pagination `01 / 04` + prev/next circular arrows (right)
- **Transition logic**: On "Next" click, increment `activeIndex` (mod 4). The card array is derived by filtering out the active property and ordering cyclically. CSS transitions handle the cross-fade (~800ms) and card slide animation
- **Reduced motion**: Skip cross-fade, use instant swap

### `src/hooks/useHeroSettings.ts` — Minor addition
- Add defaults for `hero_heading_line1`, `hero_heading_line2` (empty = auto-derive from property name)

### No changes to
- `Index.tsx` (still renders `<HeroSection />`)
- `Header.tsx` (already transparent on homepage)
- Database schema (all data exists)

## Animation Details
- Background cross-fade: CSS `transition: opacity 0.8s ease`; two absolute layers, toggling opacity
- Card entry: `framer-motion` `AnimatePresence` with slide-left for cards entering/exiting
- Text content: fade-in with slight Y translate on property change
- Auto-play: Optional interval (e.g., 6s) that pauses on hover, configurable via hero_settings

## Mobile Behavior
- Cards stack below the heading or hide entirely on small screens
- Footer simplifies to pagination arrows only
- Background and text remain full-width

