

# Hero Slider — Dark Minimalist Card-Deck Redesign

## Concept
Replace the current full-bleed image slider with a **split-panel dark minimalist layout**: left side has large typography (property name, location, description) with staggered word-reveal animations; right side has a **stacked card deck** where each property is a card with its hero image, and clicking/auto-advancing fans through them with 3D transforms (translate, scale, rotate). The entire hero sits on a dark gradient background with the existing grain overlay and cursor-reactive spotlight.

## Data Integration
This will pull from the **existing systems** — no new tables or APIs needed:
- **Properties**: from `useFeaturedProperties()` (already used) — provides `name`, `city`, `country`, `hero_image_url`, `short_description`, `base_price`, `bedrooms`, `bathrooms`
- **Branding**: from `useBrand()` context — fonts, colors already flow through CSS variables
- **Hero settings**: from `useHeroSettings()` — search bar toggle

The branding config reference in the user's spec maps directly to our existing `BrandContext`:
- `SITE_BRANDING.typography.display` → `--font-serif` (already dynamic)
- `SITE_BRANDING.typography.body` → `--font-sans` (already dynamic)
- `SITE_BRANDING.colors` → CSS custom properties (already dynamic from admin)

No destination-specific accent colors will be hardcoded. Instead, derive a subtle per-slide tint from the existing `--accent` theme token with varying opacity.

## Layout (Desktop)

```text
┌────────────────────────────────────────────────────────┐
│  DARK GRADIENT BG + GRAIN + SPOTLIGHT                  │
│                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │ 01 — VILLA NAME     │  │  ┌───────────────┐  │     │
│  │                     │  │  │  Card 3 (back)│  │     │
│  │ Property            │  │  │  ┌───────────┐│  │     │
│  │ Name                │  │  │  │ Card 2    ││  │     │
│  │                     │  │  │  │ ┌───────┐ ││  │     │
│  │ Short description   │  │  │  │ │Card 1 │ ││  │     │
│  │ ───── accent line   │  │  │  │ │(front)│ ││  │     │
│  │                     │  │  │  │ └───────┘ ││  │     │
│  │ [EXPLORE STAY →]    │  │  │  └───────────┘│  │     │
│  └─────────────────────┘  │  └───────────────┘  │     │
│                           └─────────────────────┘     │
│  ← • • — • →  01/04      [Search Form]               │
└────────────────────────────────────────────────────────┘
```

## Layout (Mobile)
On mobile, the card deck hides. The dark bg remains with a faded property image behind at low opacity. Text stacks vertically with smaller type. Dots + swipe for navigation.

## Files to Modify/Create

### `src/components/home/hero/heroStyles.ts`
- Update keyframes: remove `heroDiagonalReveal`, `heroKenBurns`. Add card deck transition keyframes if needed (most transforms will be inline CSS transitions).
- Keep `heroProgressFill`, `heroProgressRing`.

### `src/components/home/HeroSection.tsx` — Full rewrite
- **Background**: Dark gradient (`from-[#1A1A1A] to-[#2A2A2A]`) instead of full-bleed property images. On mobile, show active property image at ~15% opacity behind.
- **Left panel**: Slide index label (`01 — PROPERTY NAME`), large serif heading (property name via `WordReveal`), description, accent divider line, CTA button linking to property detail.
- **Right panel** (desktop only): Card deck — all 4 property cards stacked with CSS transforms. Active card is front (scale 1, no rotation). Others offset with `translateY`, `scale`, `rotateZ` based on distance from active index. Cards show property hero image + name overlay. Click a card to navigate to it.
- **Card transitions**: Pure CSS `transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1)` on transform/opacity/z-index.
- **Bottom nav**: Keep existing social icons, progress bars, odometer counter, prev/next arrows. Add elongated dot indicators (active = wider bar).
- **Search form**: Positioned below the left text panel on desktop, below content on mobile.
- **Autoplay**: Keep existing ref-based stable autoplay. Pause on hover over card deck area.

### `src/components/home/hero/WordReveal.tsx`
- No changes needed — already does blur-to-sharp word stagger.

### `src/components/home/hero/OdometerCounter.tsx`
- No changes needed.

### `src/components/home/hero/GrainOverlay.tsx`
- No changes needed — already provides film grain on dark backgrounds.

## Key Implementation Details

**Card deck math** (from user spec, adapted):
```typescript
const CARD_SPACING = 30;    // px vertical offset per card
const CARD_ROTATION = 2;    // degrees per position
const CARD_SCALE_BASE = 0.85;
const CARD_SCALE_STEP = 0.05;

// For each card at position `idx` relative to `current`:
const offset = idx - current;
const translateY = offset * CARD_SPACING;
const rotateZ = offset * CARD_ROTATION;
const scale = idx === current ? 1 : CARD_SCALE_BASE + Math.abs(offset) * CARD_SCALE_STEP;
```

**Dark background** uses semantic tokens so admin theme changes propagate:
- `bg-primary` for the dark base (since admin can set primary to dark navy)
- `text-primary-foreground` for white text
- `border-accent/30` for subtle accent borders on cards
- Falls back to hardcoded dark values if brand colors are light (detect via luminance check)

**CTA button**: "EXPLORE STAY →" links to `/properties/${property.slug}`.

**Touch/swipe**: Preserved from current implementation.

**Reduced motion**: Cards snap without animation, text renders instantly.

## What This Replaces
- Full-bleed background image cross-fade → Dark solid bg with card deck
- Diagonal clip-path reveal → Card stack shuffle animation
- Ken Burns zoom → Removed (no full-bleed images on desktop)
- Cursor spotlight → Kept (works great on dark backgrounds)
- Parallax scroll → Kept for text offset
