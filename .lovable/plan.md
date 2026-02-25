

# Complete CMS Overhaul: Unified Color System, Premium Hero, Motion System, and Mobile-First UX

This plan covers all 8 deliverables (A through H) from the approved request. It is a deep, systematic refactor touching CSS foundations, Tailwind config, every page, key components, and the admin panel.

---

## Part A: Eliminate Dual Color System (Global)

### CSS Foundation (`src/index.css`)

**Remove** these 7 custom variables from `:root`:
```text
--navy-blue, --primary-blue, --gold-accent, --sand-brown, --light-blue, --pale-blue, --warm-cream
```

**Add** two derived tokens:
```text
--accent-hover: 38 83% 61%;    (for gradient/hover states, derived from accent)
--section-alt: 36 33% 97%;     (alternating section background)
```

**Update** these CSS classes to use semantic tokens:
- `.btn-organic` -- `hsl(var(--gold-accent))` becomes `hsl(var(--accent))`; hover uses `hsl(var(--accent-hover))`
- `.btn-gold-gradient` -- both gradient stops use `--accent` and `--accent-hover`
- `.card-organic` -- shadow references `--accent` and `--foreground` instead of `--gold-accent` and `--navy-blue`
- `.hero-gradient` -- `--pale-blue` becomes `--muted`
- `.hover-lift` -- `--navy-blue` becomes `--foreground`

### Tailwind Config (`tailwind.config.ts`)

**Remove** custom color entries: `navy-blue`, `primary-blue`, `gold-accent`, `sand-brown`, `light-blue`, `pale-blue`, `warm-cream`

**Add** two new semantic colors:
```text
"accent-hover": "hsl(var(--accent-hover))"
"section-alt": "hsl(var(--section-alt))"
```

**Update** `boxShadow` values -- replace hardcoded HSL strings with CSS variable references.

### Pages -- Token Replacement

| File | Find | Replace |
|------|------|---------|
| `Index.tsx` | `bg-warm-cream` (3x) | `bg-section-alt` |
| `Index.tsx` | `text-gold-accent` (6x) | `text-accent` |
| `Index.tsx` | `bg-gold-accent/90` | `bg-accent/90` |
| `Index.tsx` | `bg-gold-accent/10` | `bg-accent/10` |
| `Index.tsx` | `bg-gold-accent/20` | `bg-accent/20` |
| `Index.tsx` | `border-gold-accent/30` | `border-accent/30` |
| `Index.tsx` | `text-gold-accent/90` | `text-accent/90` |
| `About.tsx` | `bg-warm-cream` (2x) | `bg-section-alt` |
| `About.tsx` | `bg-gold-accent/10` | `bg-accent/10` |
| `About.tsx` | `text-gold-accent` (3x) | `text-accent` |
| `Contact.tsx` | `bg-gold-accent/10` | `bg-accent/10` |
| `Contact.tsx` | `text-gold-accent` (2x) | `text-accent` |
| `Contact.tsx` | `hover:text-gold-accent` | `hover:text-accent` |
| `Contact.tsx` | `bg-warm-cream` (2x) | `bg-section-alt` |
| `Destinations.tsx` | `bg-warm-cream` (1x) | `bg-section-alt` |

### Components -- Token Replacement

| File | Find | Replace |
|------|------|---------|
| `SearchBar.tsx` | `text-gold-accent` (4x) | `text-accent` |
| `DestinationCard.tsx` | `bg-gold-accent` | `bg-accent` |
| `Footer.tsx` | `hover:text-gold-accent` (3x) | `hover:text-accent` |
| `MobileBookingCTA.tsx` | `hsl(var(--navy-blue) / 0.12)` | `hsl(var(--foreground) / 0.12)` |

---

## Part B: BrandContext Enhancement -- Sync Derived Tokens

Update `BrandContext.tsx` `applyTheme()` to also set `--accent-hover` and `--section-alt` as derived values whenever the admin changes palette:

```text
--accent-hover: same hue as accent, +15% saturation, -5% lightness
--section-alt: same hue as background, slightly warmer/tinted
```

This ensures the alternating section backgrounds and button hover states always harmonize with the admin-chosen palette.

---

## Part C: Admin Theme Panel Enhancements

The existing Admin Settings already has color pickers and font selectors. Enhancements:

1. **Add radius scale control** -- a slider for `--radius` (0.25rem to 1.5rem)
2. **Add shadow intensity control** -- light/medium/strong presets that scale `card-organic` and `hover-lift` shadows
3. **Add spacing density control** -- compact/normal/airy that adjusts section padding via a CSS variable
4. No new database columns needed -- store these as additional keys in the existing `brand_settings` JSON or as new columns

---

## Part D: Homepage Hero Upgrades

### D1: Premium Featured Villa Card

Replace the current small `w-28 h-28` card with a larger, more impressive hero card:

- Larger image area (aspect-video or similar)
- "Top Pick" badge, star rating, 3 key highlights (bedrooms, guests, location)
- Stronger CTA button
- Glass-panel backdrop with better typography hierarchy
- On mobile: full-width card below the search bar
- On desktop: max-w-xl centered card

### D2: Fix Hero Quick-Nav Icons

The current code uses `resolveIcon()` which works correctly at runtime. The issue is the icon circle styling. Update to:

- **Transparent background, stroke-only circle**: `border border-accent` with no fill
- Ensure icon name from database is used without any hardcoded fallback overriding the admin choice
- Verify `resolveIcon` does not cache stale values (it doesn't -- it resolves on each render from the database-fetched `nav.icon`)

---

## Part E: 2026-Ready Motion System

### E1: Global Motion Infrastructure

Create a motion utilities module (`src/lib/motion.ts`):

```text
- Shared easing curves (ease-premium, ease-out-expo)
- Stagger container/child variants
- Viewport-triggered reveal variants
- prefers-reduced-motion wrapper that disables all motion
- GPU-only transforms (opacity + translate + scale)
```

### E2: Page-by-Page Motion

**Homepage**
- Hero: staggered entrance (headline delay 0, subtitle delay 0.1, search delay 0.2, featured card delay 0.3)
- Section headings: fade-up on viewport entry
- Cards: stagger reveal (already partially done via SectionRenderer, enhance timing)

**Property Detail**
- Gallery: already uses swipe; ensure smooth snapping
- Amenities: stagger reveal
- CTA: subtle scale pulse (not spammy -- one gentle pulse then stop)

**About**
- Story paragraphs: sequential fade-up
- Values cards: stagger from SectionRenderer
- Stats: count-up animation on viewport entry

**Experiences**
- Cards: stagger reveal (already via SectionRenderer)
- Mobile: cards are tap-friendly (no hover dependency)

**Contact**
- Form fields: progressive reveal (each field fades in after previous)
- Success state: scale-in + checkmark animation

### E3: Reduced Motion Support

Wrap all Framer Motion usage with a `useReducedMotion()` check. When enabled:
- All `initial` states become final states (no animation)
- Transitions become instant
- No floating/pulsing animations

---

## Part F: Mobile-First Fixes

1. **Hero featured card**: Full-width on mobile, no overflow clipping
2. **Quick-nav icons**: Horizontal scroll on small screens if more than 4 items
3. **Section padding**: Reduce to `py-16` on mobile (currently `py-24`)
4. **Gallery swipe**: Already Embla-based; verify touch behavior
5. **Bottom-sheet modals**: Already using Vaul/Sheet for MobileBookingCTA
6. **Thumb-friendly CTAs**: Minimum 44px touch targets verified
7. **No hover dependency**: All hover states have tap equivalents on mobile

---

## Part G: Cleanup and Maintainability

1. Remove dead CSS variables from `src/index.css`
2. Remove unused Tailwind color entries from config
3. Ensure no component uses literal color values that bypass the token system
4. All shadow values reference CSS variables

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Remove 7 hardcoded variables, add 2 derived tokens, update 5 CSS classes |
| `tailwind.config.ts` | Remove 7 custom colors, add 2 new ones, update boxShadow |
| `src/contexts/BrandContext.tsx` | Add derived token computation in `applyTheme()` |
| `src/pages/Index.tsx` | Replace all hardcoded brand tokens + upgrade hero card + enhance motion |
| `src/pages/About.tsx` | Replace tokens + enhance motion |
| `src/pages/Contact.tsx` | Replace tokens + progressive form reveal |
| `src/pages/Destinations.tsx` | Replace tokens |
| `src/components/search/SearchBar.tsx` | Replace `text-gold-accent` with `text-accent` |
| `src/components/destinations/DestinationCard.tsx` | Replace `bg-gold-accent` with `bg-accent` |
| `src/components/layout/Footer.tsx` | Replace `hover:text-gold-accent` with `hover:text-accent` |
| `src/components/booking/MobileBookingCTA.tsx` | Replace `--navy-blue` shadow with `--foreground` |
| `src/pages/admin/AdminSettings.tsx` | Add radius/shadow/spacing controls |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/motion.ts` | Shared motion variants, easing curves, reduced-motion utility |

## No Database Changes Required

All token changes are CSS-level. The existing `brand_settings` table and `BrandContext` already handle admin palette propagation -- this plan ensures every component actually respects those tokens.

