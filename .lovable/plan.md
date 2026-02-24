

# Frontend Design System Overhaul -- Arivia Luxury Style

## Recommended Style: Images 3/4/6 (Clean Full-Bleed Hero)

The cleanest variant with: full-bleed hero imagery, frosted-glass search bar overlaid on the hero, gold gradient CTA buttons, transparent header over hero, and "Scroll to Discover" prompt. No competing text overlays -- the photography speaks for itself.

**No font changes** as requested. Existing Playfair Display + Lato remain.

---

## Phase 1: Design Tokens and Global Styles

### File: `src/index.css`

- Add a `.glass-panel` component class: `backdrop-blur-xl bg-white/70 border border-white/30 shadow-lg`
- Add a `.btn-gold-gradient` class: warm gold-to-bronze linear gradient for primary CTAs (like "Search Villas")
- Add `.scroll-indicator` animation (bounce arrow)
- Refine `.card-organic` to use softer, warmer shadows matching the reference
- Add warm cream tint to section backgrounds (`bg-[#faf8f5]` style via CSS variable)

### File: `tailwind.config.ts`

- Add `glass` shadow token
- Add `warm-cream` color alias using CSS variable

---

## Phase 2: Header -- Transparent Over Hero

### File: `src/components/layout/Header.tsx`

Current: `bg-background/80 backdrop-blur-md border-b border-border/50` always.

Change to:
- **On homepage at top**: fully transparent background, white text, no border
- **On scroll or non-homepage**: solid white with backdrop blur (current behavior)
- Add thin vertical separators (`|`) between nav items like the reference
- Add Heart icon (wishlist) and Search icon in right section matching reference
- "Book Now" button gets gold gradient outline style matching reference
- Nav items use lighter weight, wider spacing

### File: `src/components/layout/PageLayout.tsx`

- On homepage, remove `pt-[72px]` padding since header is transparent and overlays the hero

---

## Phase 3: Homepage Hero Redesign

### File: `src/pages/Index.tsx`

Current: Hero with gradient overlay, "Book Your Perfect Escape" heading, SearchBar, trust badges.

Change to:
- **Full-bleed hero** (100vh) using the first featured property image with minimal overlay (just a subtle bottom gradient for readability)
- Remove the "Book Your Perfect Escape" heading text -- let the image be the focus
- SearchBar positioned at vertical center-bottom of hero, using frosted glass panel style
- Add "SCROLL TO DISCOVER" text + animated down-arrow below search bar
- Remove FloatingBlob decorative elements from hero (they compete with the photo)
- Trust badges section becomes a horizontal bar with gold line-art icons below the hero fold (like "Handpicked Excellence", "Unmatched Views", "Concierge Service" from the reference)
- Remove UrgencyBanner from top of page

### File: `src/components/search/SearchBar.tsx` (hero variant)

Current: Card-style container with grid of inputs.

Change to:
- Frosted glass pill shape (`glass-panel` + `rounded-full` or `rounded-2xl`)
- Horizontal layout: Check-In | Check-Out | Guests | Gold "Search Villas" button
- Each field separated by subtle vertical dividers
- "Search Villas" button uses gold gradient with right arrow
- Inputs are borderless, clean, with small label text above

---

## Phase 4: Content Section Styling

### File: `src/pages/Index.tsx` (continued)

- Featured Destinations section: warm cream background, wider card spacing
- "Book Your Stay" section: clean white background, refined card hover effects
- "Why Book Direct" section: icons use gold/bronze tones instead of primary blue, clean centered layout
- Blog section: consistent card styling

### File: `src/components/destinations/DestinationCard.tsx`

- Softer border radius (rounded-2xl), warmer shadow
- Hover effect: subtle scale + shadow lift (matching reference's organic feel)

### File: `src/components/booking/QuickBookCard.tsx`

- Align with reference property card style (rounded corners, warm shadows, price display)

---

## Phase 5: Secondary Pages

### File: `src/pages/Properties.tsx`

- Header section uses warm cream background instead of `bg-secondary/30`
- Search bar inherits frosted glass style
- Property grid cards use refined styling

### File: `src/pages/About.tsx`

- Hero uses a full-width property image background (like homepage) instead of gradient
- Content sections use alternating white/warm-cream backgrounds
- Stats section uses gold accents instead of primary blue
- Value cards use gold icon accents

### File: `src/pages/Contact.tsx`

- Similar hero treatment with property background image
- Form fields use softer styling, gold accent on submit button
- Contact info cards with warm styling

### File: `src/pages/Destinations.tsx`

- Hero with property image background
- Cards use refined warm styling

---

## Phase 6: Footer and Global Elements

### File: `src/components/layout/Footer.tsx`

- Keep dark footer but refine: use the warm navy tone
- CTA section uses gold gradient button instead of solid primary
- Subtle gold accents on social icons hover

### File: `src/components/booking/FloatingBookButton.tsx`

- Use gold gradient background matching the "Search Villas" button style

### File: `src/components/ui/button.tsx`

- Add a `gold` variant with warm gradient background for primary CTAs throughout the site

---

## Summary of Key Visual Changes

| Element | Current | New (Reference Style) |
|---|---|---|
| Header | Solid white always | Transparent on homepage hero, white on scroll |
| Hero | Gradient overlay + big text | Full-bleed photo, minimal overlay |
| Search bar | Card with border | Frosted glass pill |
| CTA buttons | Solid primary blue | Gold gradient |
| Section backgrounds | White / pale-blue | White / warm cream |
| Card shadows | Cool-toned | Warm-toned, softer |
| Trust badges | Small text with icons | Gold line-art icons, bolder text |
| Decorative blobs | Present on multiple pages | Removed (let photography shine) |

## Files Modified (Total: ~12)

1. `src/index.css` -- glass panel, gold gradient, scroll indicator classes
2. `tailwind.config.ts` -- warm-cream color, glass shadow token
3. `src/components/layout/Header.tsx` -- transparent on hero, nav separators, gold Book Now
4. `src/components/layout/PageLayout.tsx` -- conditional hero padding
5. `src/pages/Index.tsx` -- full-bleed hero, scroll indicator, trust badges redesign
6. `src/components/search/SearchBar.tsx` -- frosted glass pill layout
7. `src/components/ui/button.tsx` -- gold variant
8. `src/pages/About.tsx` -- image hero, gold accents
9. `src/pages/Contact.tsx` -- image hero, gold accents
10. `src/pages/Destinations.tsx` -- image hero, warm styling
11. `src/pages/Properties.tsx` -- warm cream header, refined cards
12. `src/components/layout/Footer.tsx` -- gold gradient CTA button
13. `src/components/booking/FloatingBookButton.tsx` -- gold gradient style

## Important Notes

- No font changes (Playfair Display + Lato preserved)
- No business logic changes -- purely visual/layout
- Admin pages are NOT touched -- only guest-facing frontend
- All existing hooks, services, and data flow remain untouched
- This is a large change -- recommend implementing in 2-3 batches for safer iteration

