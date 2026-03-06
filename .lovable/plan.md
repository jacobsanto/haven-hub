

# Homepage Redesign: Dark Cinematic Theme + Admin Hero Style Selector

## Overview

Redesign the homepage to match the dark, cinematic aesthetic from the uploaded reference file while keeping Arivia's brand colors (semantic tokens). The reference uses a dark background (`#0a0a0f`), warm sand/gold accents, serif + sans font pairing, and consistent section treatments with subtle borders and card styles. The current homepage already has the right section sequence but uses a light theme. This plan converts all sections to the dark editorial treatment and adds an admin control to select between 6 hero slider styles.

## Current vs Target

| Section | Current | Target (from reference) |
|---|---|---|
| **Overall theme** | Light bg, semantic colors | Dark bg (`--bg`, `--bg2`), warm sand accents, grain overlay |
| **Trust Bar** | Light cards, 2-column layout | Dark horizontal 4-column bar with border-top/bottom, icons in sand color |
| **Destinations** | Carousel with light cards | 4-column grid, 3:4 aspect ratio cards with dark gradient overlays, hover lift |
| **Experiences** | Carousel-based | 4-column grid of dark cards with sand borders on hover, category badges |
| **Testimonials** | Left text + right photo mosaic | Centered single testimonial card with large quote mark, sand accent divider |
| **Features/WhyDirect** | Two feature sections | Consolidate into one "Book Direct, Live Better" split section with 4 perk cards |
| **CTA** | None | New warm gradient CTA section at bottom before footer |
| **Search Bar** | Inside hero overlay | Floating dark card below hero with 4-field grid + search button |

## Implementation Plan

### 1. Database Migration
Insert `hero_style` setting into `hero_settings` table:
```sql
INSERT INTO hero_settings (key, value) VALUES ('hero_style', 'card-deck') ON CONFLICT DO NOTHING;
```

### 2. New Files

#### `src/components/home/hero/HeroSliderVariants.tsx`
Port all 6 slider styles from the uploaded file, adapted to:
- Use real property data from props (not hardcoded slides)
- Use Tailwind + CSS variables for styling (semantic brand colors mapped to the dark palette)
- Respect `prefers-reduced-motion`
- Each exports: `ParallaxDepthHero`, `SplitRevealHero`, `MorphTilesHero`, `CinematicHero`, `VerticalCurtainHero`
- The existing `CardDeck` remains as the 6th option

#### `src/components/home/SearchBarOverlay.tsx`
Floating search bar that sits below the hero (negative margin overlap), matching the reference's dark card with 4-field grid (Destination, Check In, Check Out, Guests) + Search button. Reuses logic from existing `HeroSearchForm` but with the dark card treatment.

#### `src/components/home/WhyDirectSection.tsx`
New "Book Direct, Live Better" section: 2-column split layout (left: heading + description, right: 4 perk cards in 2x2 grid). Dark `bg2` background with border treatment.

#### `src/components/home/CTASection.tsx`
Warm gradient CTA card: centered heading "Your Dream Villa Awaits", subtitle, and "Explore Villas" button with sand/accent background.

### 3. Modified Files

#### `src/components/home/HeroSection.tsx`
- Read `heroStyle` from `useHeroSettings()`
- Map setting to corresponding slider component
- Render selected variant, passing properties + navigation callbacks
- Keep shared footer bar (social, dots, nav arrows) as overlay on all variants

#### `src/hooks/useHeroSettings.ts`
- Add `hero_style: 'card-deck'` to DEFAULTS
- Expose `heroStyle` in return

#### `src/components/home/TrustSection.tsx`
Restyle to dark horizontal trust bar:
- Dark background (`bg-[#111118]`), border-top/bottom
- 4 icons in a single row, centered, sand-colored icons
- Remove 2-column layout, use simple centered grid

#### `src/components/home/DestinationsShowcase.tsx`
- Switch from carousel to 4-column grid on desktop
- 3:4 aspect ratio cards with dark gradient overlays
- Hover: translateY(-6px) + image scale(1.06)
- Dark background, sand accent for location labels

#### `src/components/home/LiveExperiencesSection.tsx` (becomes Experiences)
- Restyle as dark card grid (4-column) with category badges
- Dark card background, sand border on hover
- Show duration + price, remove carousel

#### `src/components/home/TestimonialsSection.tsx`
- Single centered testimonial (not side-by-side)
- Large decorative quote mark in sand/accent
- Dark card with border, centered divider line
- Keep navigation arrows for cycling

#### `src/components/home/FeaturesSection.tsx`
- Remove or merge with new WhyDirectSection
- Can be hidden via section display settings

#### `src/pages/Index.tsx`
Update section order:
1. HeroSection (with selectable slider)
2. SearchBarOverlay (floating below hero)
3. TrustSection (dark bar)
4. DestinationsShowcase (dark grid)
5. DiscoverVillasSection (keep but darken)
6. LiveExperiencesSection (dark card grid)
7. TestimonialsSection (centered dark)
8. WhyDirectSection (new)
9. CTASection (new)

#### `src/pages/admin/AdminSettings.tsx` — `HeroImageSection`
Expand to include:
- **Hero Style selector**: visual grid of 6 cards (icon/thumbnail + name)
- Each card shows style name and brief description
- Clicking saves `hero_style` via `useHeroSettingsMutations`
- Active style highlighted with accent border
- Keep existing hero background image upload below

### 4. Dark Theme Approach

Rather than changing the global brand colors (which affect the entire site), the homepage sections will use explicit dark classes/styles scoped to the homepage:
- Sections get explicit dark backgrounds: `bg-[#0a0a0f]`, `bg-[#111118]`, `bg-[#1a1a24]`
- Text colors: `text-[#f0ece4]`, `text-[#a8a29e]`, `text-[#6b6560]`
- Accent/sand colors continue using `text-accent` (which maps to the brand's gold/sand)
- Cards: `bg-[#15151f]` with `border-white/[0.06]`
- This keeps all other pages (properties, blog, etc.) unaffected

### 5. Grain Overlay
Add a global grain overlay component to the homepage wrapper (already exists in `GrainOverlay` component, extend to full page scope for the homepage).

## Files Summary
| File | Action |
|---|---|
| `src/components/home/hero/HeroSliderVariants.tsx` | Create |
| `src/components/home/SearchBarOverlay.tsx` | Create |
| `src/components/home/WhyDirectSection.tsx` | Create |
| `src/components/home/CTASection.tsx` | Create |
| `src/components/home/HeroSection.tsx` | Modify (slider selection) |
| `src/hooks/useHeroSettings.ts` | Modify (add heroStyle) |
| `src/components/home/TrustSection.tsx` | Restyle dark |
| `src/components/home/DestinationsShowcase.tsx` | Restyle dark grid |
| `src/components/home/LiveExperiencesSection.tsx` | Restyle dark cards |
| `src/components/home/TestimonialsSection.tsx` | Restyle centered dark |
| `src/pages/Index.tsx` | Update section order |
| `src/pages/admin/AdminSettings.tsx` | Add hero style selector |
| DB migration | Insert `hero_style` default |

