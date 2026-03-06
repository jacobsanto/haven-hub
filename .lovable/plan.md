

# Deep Audit: Dashboard-to-Frontend Connectivity, Cleanup & Hero Best Practices

---

## Part 1: What Works Well

### Dashboard → Frontend Connections (Working)
1. **Brand Identity**: Name, tagline, logo, contact info, social links → Header, Footer, all pages via `useBrand()`
2. **Color Palette**: 10 HSL tokens + dark palette → BrandContext applies to CSS variables, all semantic classes respond
3. **Fonts**: Heading + body font selection → Google Fonts loaded dynamically, CSS vars `--font-serif`/`--font-sans` set
4. **Currency**: Base currency setting → propagates to all pricing via `useFormatCurrency()`
5. **Navigation**: Header, footer explore, footer company links → managed via `navigation_items` table
6. **Page Content CMS**: SEO, hero text, section headings → `usePageContent()` hook for Home, About, Contact, Destinations, Properties, Experiences, Blog, Footer
7. **Hero Style Selector**: 6 variants selectable from admin → renders correct component
8. **Hero Background Image**: Custom upload in admin → used in hero
9. **Section Display Settings**: Layout mode, columns, animation per section → `useSectionDisplay()`
10. **Theme Export/Import**: JSON theme files with light + dark palettes

### Architecture Strengths
- Semantic token system is consistent across homepage sections
- `BrandContext` auto-computes foreground companions and derived tokens
- WCAG contrast badges in admin color picker
- Dark mode palette with auto-generation from light palette

---

## Part 2: What's Broken or Missing

### A. Hardcoded Colors That Bypass the Token System

| File | Issue |
|---|---|
| `src/components/layout/Header.tsx` | **~15 instances** of `text-white`, `bg-white/10`, `border-white/40` for transparent hero state |
| `src/pages/Destinations.tsx` | `from-black/70 via-black/40 to-black/30`, `text-white`, `text-white/80` in hero |
| `src/pages/Contact.tsx` | Same `from-black/70` gradient + `text-white` in hero |
| `src/pages/About.tsx` | `from-black/70 via-black/40`, `text-white` in hero |
| `src/components/blog/BlogHero.tsx` | `from-black/90 via-black/50`, `text-white`, `bg-white/20` throughout |
| `src/components/blog/PhotoGrid.tsx` | `bg-black/95`, `bg-white/10`, `text-white` in lightbox |
| `src/components/destinations/DestinationCard.tsx` | `from-black/60` hover overlay |
| `src/components/properties/SpecialOfferBadge.tsx` | `text-white` on `bg-emerald-600` |
| `src/components/properties/PropertyShareSave.tsx` | `text-white` conditional on saved state |
| `src/components/booking/ExitIntentModal.tsx` | `bg-black/60` backdrop |

### B. Typography Granularity — NOT Implemented
The memory says granular typography controls (heading weight, body weight, letter spacing) were added, but **they don't exist**:
- No `heading_weight`, `body_weight`, `heading_letter_spacing` columns in `brand_settings`
- No CSS variables `--heading-weight`, `--body-weight`, `--heading-tracking`
- No admin controls for weight/spacing in `AdminSettings.tsx`
- The Typography section only has font family selectors

### C. Homepage Sections NOT Connected to CMS
These homepage sections have **hardcoded text** that can't be edited from the admin:

| Section | Hardcoded Content |
|---|---|
| `TrustSection` | Labels ("Handpicked", "Best Price", etc.) and descriptions |
| `DestinationsShowcase` | Heading "Sun-Kissed Destinations", label "Explore" |
| `DiscoverVillasSection` | Heading "Find Your Perfect Home", label "Properties" |
| `FeaturedVacationSection` | Heading "Exceptional Properties for Your Next Escape" |
| `LiveExperiencesSection` | Heading "Beyond the Villa", label "Curated" |
| `TestimonialsSection` | Heading "What They Remember", label "Guest Stories", **all testimonial quotes are hardcoded** |
| `WhyDirectSection` | Heading, description, all perk cards text |
| `CTASection` | Heading, description, button text, label "Summer 2026" |

Note: The CMS schema in `usePageContent.ts` defines fields for some of these (trust_badges, experiences, why_book_direct, cta) but the **components don't use them**.

### D. Testimonials Are Fully Hardcoded
No database table for testimonials exists. All 3 testimonials in `TestimonialsSection` and 3 in `About.tsx` are static arrays. Admins cannot add, edit, or remove them.

### E. Social Links in Footer — Render Even When Empty
When `socialInstagram` is null, the footer renders `<a href="#">` which is a broken link.

---

## Part 3: Hero Section — 2026 Best Practices Assessment

### Current State
The hero has 6 variants: Parallax Depth, Split Reveal, Morph Tiles, Cinematic (Ken Burns), Vertical Curtain, Card Deck. All use CSS transitions or inline keyframe animations.

### What's Good
- `prefers-reduced-motion` respected across all variants
- GPU-friendly transforms (translate, scale, opacity)
- Cursor-reactive spotlight effect
- Film grain overlay for cinematic feel
- Touch gesture support for mobile

### What Could Be Better (2026 Trends)

1. **View Transitions API**: The native browser `document.startViewTransition()` API (now supported in all major browsers 2025+) would give smoother, compositor-driven slide transitions instead of CSS `transition` on `clip-path`. This is the biggest 2026 upgrade.

2. **Scroll-Driven Animations**: CSS `animation-timeline: scroll()` is now widely supported. The parallax effect currently uses a JS `scroll` listener + `requestAnimationFrame`; CSS scroll-driven animations are zero-JS and jank-free.

3. **FLIP Technique for Morph Tiles**: The Morph Tiles variant changes `grid-column: 1 / -1` which triggers layout reflow. Using the FLIP pattern (First, Last, Invert, Play) via Framer Motion's `layout` prop would eliminate layout thrashing.

4. **Shared Element Transitions**: When clicking "Explore Stay" on a hero card, a shared element transition (hero image morphing into the property detail page hero) would be a dramatic 2026-level UX. This uses the View Transitions API.

5. **Progressive Image Loading**: Hero images load at full resolution immediately. A blur-up pattern (tiny placeholder → full image) with `loading="eager"` + `fetchpriority="high"` for the active slide only would improve LCP.

6. **Motion Intensity Setting**: Beyond just respecting `prefers-reduced-motion` (binary), 2026 best practice is offering a motion intensity slider (None / Subtle / Full) in accessibility settings.

7. **Container Queries for Responsive Variants**: Instead of `useIsMobile()` hook checks, CSS container queries (`@container`) would let components self-adapt without JS.

---

## Part 4: Implementation Plan

### Phase 1: Fix Hardcoded Colors (Critical)

**Files to edit:**
- `src/components/layout/Header.tsx` — Replace `text-white` → `text-primary-foreground`, `bg-white/10` → `bg-primary-foreground/10`, `border-white/40` → `border-primary-foreground/40`
- `src/pages/Destinations.tsx` — Replace `from-black/70 via-black/40 to-black/30` → `from-foreground/70 via-foreground/40 to-foreground/30`, `text-white` → `text-background`
- `src/pages/Contact.tsx` — Same gradient + text fixes
- `src/pages/About.tsx` — Same gradient + text fixes
- `src/components/blog/BlogHero.tsx` — Replace all `black/*` and `white/*` with semantic tokens
- `src/components/blog/PhotoGrid.tsx` — `bg-black/95` → `bg-foreground/95`, `text-white` → `text-background`
- `src/components/destinations/DestinationCard.tsx` — `from-black/60` → `from-foreground/60`
- `src/components/properties/SpecialOfferBadge.tsx` — `text-white` → `text-primary-foreground`
- `src/components/properties/PropertyShareSave.tsx` — `text-white` → `text-primary-foreground`
- `src/components/booking/ExitIntentModal.tsx` — `bg-black/60` → `bg-foreground/60`

### Phase 2: Connect Homepage Sections to CMS

Connect existing CMS schema fields to the components that are currently ignoring them:

- `TrustSection.tsx` — Use `usePageContent('home', 'trust_badges', {...})` for badge titles, descriptions, icons
- `DiscoverVillasSection.tsx` — Use `usePageContent('home', 'properties', {...})` for heading/subtitle
- `FeaturedVacationSection.tsx` — Add CMS schema entry + connect heading
- `LiveExperiencesSection.tsx` — Use `usePageContent('home', 'experiences', {...})` for heading/subtitle/label
- `WhyDirectSection.tsx` — Use `usePageContent('home', 'why_book_direct', {...})` for all text + perk cards
- `CTASection.tsx` — Use `usePageContent('home', 'cta', {...})` for heading/subtitle
- `TestimonialsSection.tsx` — Use `usePageContent('home', 'testimonials', {...})` or create a `testimonials` table

### Phase 3: Add Typography Granularity

1. **DB Migration**: Add 3 columns to `brand_settings`:
   - `heading_weight` (text, default '500')
   - `body_weight` (text, default '400')
   - `heading_letter_spacing` (text, default 'normal')

2. **`useBrandSettings.ts`**: Add fields to interface + defaults

3. **`BrandContext.tsx`**: In `applyTheme()`, set `--heading-weight`, `--body-weight`, `--heading-tracking` CSS variables

4. **`index.css`**: Update base heading/body rules to use these variables:
   ```css
   h1-h6 { font-weight: var(--heading-weight, 500); letter-spacing: var(--heading-tracking, -0.02em); }
   body { font-weight: var(--body-weight, 400); }
   ```

5. **`AdminSettings.tsx`**: Add weight dropdowns (400/500/600/700) and spacing selector (Tight/Normal/Wide) to Typography section

### Phase 4: Hero Enhancements (2026 Best Practices)

1. **Progressive Image Loading**: Add blur-up placeholder for hero images with `fetchpriority="high"` on active slide
2. **CSS Scroll-Driven Parallax**: Replace JS scroll listener with `animation-timeline: scroll()` for card-deck parallax
3. **FLIP Layout for Morph Tiles**: Add Framer Motion `layout` prop to morph tiles for smooth reflow
4. **Shared Element Prep**: Add `view-transition-name` CSS properties to hero images and property card images for future page-level transitions

### Phase 5: Cleanup

- Fix footer social links rendering when URL is null (hide the icon entirely)
- Create a `testimonials` table so admins can manage guest reviews from dashboard

---

## Summary

| Category | Status |
|---|---|
| Brand identity → frontend | Working |
| Color tokens → frontend | Working (except ~50 hardcoded `white`/`black` instances across 10 files) |
| Fonts → frontend | Font family works; weight/spacing NOT implemented |
| Navigation → frontend | Working |
| Page CMS → frontend | Partially working (schema exists but 8 homepage sections ignore it) |
| Hero style selector | Working |
| Testimonials | Fully hardcoded, no DB table |
| Hero transitions | Good, but can be modernized with View Transitions + scroll-driven CSS |

**Total files to edit**: ~18 files across 5 phases
**DB changes**: 1 migration (add typography columns to brand_settings), optionally 1 testimonials table

