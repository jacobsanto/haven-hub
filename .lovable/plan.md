

## Plan: Redesign Properties Page & Property Detail Modal

Replace the current Properties listing page and PropertyDetail page with the design from the uploaded `Arivia_Villas-2.jsx` reference. All colors will use semantic tokens (no hardcoded hex values).

### What Changes

The uploaded file defines 4 key UI sections to adopt:
1. **Hero Banner** — Ambient blurred background with stats (total villas, destinations, avg rating)
2. **Sticky Filter Bar** — Glass-morphism search + destination/price/guest selectors + sort + grid/list toggle + expandable "More" filters (property type pills, instant book)
3. **Villa Cards** — Grid cards with hover image-dot navigation, gradient overlays, price pill, favorite button, badges; List cards with horizontal layout
4. **Detail Modal** — Full overlay with 21:9 gallery, prev/next + thumbnail dots, tabbed content (overview/amenities/highlights), stats row, CTA buttons

### Architecture

**No new pages.** The PropertyDetail page remains a full page (not a modal) since it has rich content (rooms, neighborhood, policies, booking flow). But we add a **quick-view modal** on the Properties listing that shows the uploaded design's detail popup. Clicking "View Full Details" in the modal navigates to the full PropertyDetail page.

Actually, re-reading the request: "the property individual pop up page" — the user wants the detail to be a popup/modal from the listing page, matching the uploaded design. The full PropertyDetail page route will still exist for direct links/SEO, but the primary interaction from the listing is via modal.

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Properties.tsx` | **Rewrite** | New layout: Hero Banner + Sticky FilterBar + Grid/List cards + Quick-view modal |
| `src/components/properties/VillaCardGrid.tsx` | **New** | Grid card with hover image dots, gradient overlay, price pill, fav button, badges |
| `src/components/properties/VillaCardList.tsx` | **New** | Horizontal list card with image + content side-by-side |
| `src/components/properties/VillaDetailModal.tsx` | **New** | Full-screen overlay modal with 21:9 gallery, tabs (overview/amenities/highlights), stats, CTA |
| `src/components/properties/PropertiesHeroBanner.tsx` | **New** | Ambient blurred hero with stats counters |
| `src/components/properties/PropertiesFilterBar.tsx` | **New** | Sticky glass-morphism filter bar with search, selects, sort, view toggle, expandable filters |
| `src/components/properties/SearchResultCard.tsx` | **Keep** | Still used for date-search results (list view with pricing) |
| `src/components/booking/QuickBookCard.tsx` | **Keep** | Still used by homepage sections |

### Color Mapping (Semantic Tokens Only)

All inline `var(--bg)`, `var(--sand)`, etc. from the reference will map to:

| Reference | Semantic Token |
|-----------|---------------|
| `var(--bg)`, `var(--bg2)` | `bg-background`, `bg-muted` |
| `var(--card)` | `bg-card` |
| `var(--line)`, `var(--line2)` | `border-border`, `border-border/50` |
| `var(--text)` | `text-foreground` |
| `var(--text-mid)` | `text-muted-foreground` |
| `var(--text-dim)` | `text-muted-foreground/60` |
| `var(--sand)`, `var(--warm)` | `text-accent`, `text-primary` |
| `var(--sand-dim)` | `bg-accent/10` |
| `var(--sea)` (instant book) | `text-emerald-500` (utility, not brand) |
| `var(--coral)` (heart) | `text-destructive` |

### Design Details

**Hero Banner:**
- Relative section with the first property's hero image as ambient blur background (`blur-[80px] brightness-[0.15] saturate-50 scale-130`)
- Gradient overlay from background color
- Centered: "Our Collection" label, "Handpicked *Villas*" heading (italic em in accent), subtitle
- Stats row: total villas | destinations count | avg rating — separated by vertical dividers

**Filter Bar:**
- `sticky top-[72px]` (below header), `z-50`, `bg-background/95 backdrop-blur-xl border-b border-border`
- Top row: Search input (with icon) | Destination select | Price range select | Guest select | "More" toggle | Sort select | Grid/List toggle | Result count
- Expanded row (on "More" click): Property type pills + Instant Book toggle + Clear All button
- All using shadcn Select, Input, Button components with semantic styling

**Grid Card (`VillaCardGrid`):**
- `bg-card border border-border rounded-2xl overflow-hidden` with hover lift (`hover:-translate-y-1.5`) and shadow
- Image: `aspect-[4/3]`, gradient overlay at bottom, hover image-dot navigation (invisible grid zones that change image on hover)
- Top-left: Featured badge (accent bg), Instant badge (emerald tint)
- Top-right: Heart/favorite button (circle, backdrop-blur)
- Bottom-right: Price pill (`bg-background/70 backdrop-blur`)
- Body: Location (accent, uppercase tracking), rating + reviews, serif title, italic tagline, stats row (guests/beds/baths/type)

**List Card (`VillaCardList`):**
- `grid grid-cols-[360px_1fr]` on desktop, stacked on mobile
- Similar content but includes description (2-line clamp) and price on the right

**Detail Modal (`VillaDetailModal`):**
- Fixed overlay with `bg-black/70 backdrop-blur-sm`, scroll container
- Modal: `bg-muted border border-border rounded-2xl max-w-[1000px]`
- Gallery: `aspect-[21/9]`, gradient overlay, close/fav/share buttons, prev/next arrows, thumbnail dots
- Content: Location + title + tagline (left), price (right)
- Stats row: guests, bedrooms, bathrooms, area, rating — with accent icons
- Tabbed content: overview (description + tag badges), amenities (3-col grid with icons), highlights (list with check icons)
- CTA: "Check Availability" (outline) + "Book This Villa" (primary) — both trigger booking flow

### Properties.tsx New Structure

```
PageLayout
  PageSEO
  PropertiesHeroBanner (total, destinations count, avg rating)
  PropertiesFilterBar (sticky, all filter state)
  main (max-w-[1200px] mx-auto)
    if empty → EmptyState
    if grid → VillaCardGrid grid (auto-fill, minmax(320px, 1fr))
    if list → VillaCardList stack
  CTA Banner (concierge section)
  VillaDetailModal (when selected)
```

The existing filter logic (useAvailableProperties, useProperties, date search) is preserved. The filter bar adapts: when dates are provided, it shows the date context; otherwise it shows the full filter bar.

### No Database Changes Required

All data comes from existing `properties` table via existing hooks.
