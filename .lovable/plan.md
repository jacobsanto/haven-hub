

# Property Page Redesign -- Clean, Editorial Luxury

## What Changes

The property detail page currently feels busy with too many colored backgrounds (purple highlight badges, accent-tinted At-a-Glance cards, colored icon circles) and inconsistent spacing. The redesign strips it back to a clean, editorial luxury aesthetic using primarily **white, navy text, and subtle grey borders** -- letting the property photos and content breathe.

## Design Principles

- **White space is the luxury** -- generous padding between sections, no colored card backgrounds
- **Two colors only** -- navy text and gold accent (sparingly, for CTAs and key price info)
- **Thin borders over colored backgrounds** -- sections divided by subtle `border-b` lines instead of colored cards
- **Typography hierarchy** -- let Playfair Display headings and Lato body do the work

## Changes by Component

### 1. PropertyDetail.tsx (page layout)
- Remove the `AtAGlanceCards` component entirely -- its info is redundant with the QuickStats bar and the overview section
- Increase section spacing from `space-y-12` to `space-y-16`
- Add thin `border-b border-border/30` dividers between major sections
- Reduce excessive motion animations (remove per-section `whileInView` -- keep only the initial page load fade)
- Clean up the content grid gap

### 2. PropertyQuickStats.tsx
- Remove the frosted glass background (`bg-background/80 backdrop-blur-xl`)
- Use a clean white card with a thin border instead
- Remove colored icon backgrounds -- use plain navy icons inline
- Simplify to a horizontal stat row with text only (no icon circles)

### 3. PropertyHighlights.tsx (badges variant)
- Change from colored `bg-secondary` rounded-full badges to clean text items with a small bullet or dash
- Remove motion animations on individual badges
- Use a simple two-column grid with clean typography

### 4. AmenityList.tsx (grid variant)
- Remove `bg-secondary/30` colored backgrounds on amenity tiles
- Use clean white cards with thin borders or a simple list layout
- Remove `whileHover` scale animations -- keep it static and professional
- Simplify category headers

### 5. RoomBreakdown.tsx
- Replace `card-organic` (shadowed cards) with clean bordered containers
- Remove colored icon circles, use inline navy icons
- Cleaner summary stat presentation

### 6. NeighborhoodInfo.tsx
- Remove `card-organic` shadow cards, use `border border-border/50` containers
- Remove colored icon circles (`bg-primary/10`), use plain icons

### 7. BookingWidget.tsx
- Keep the sticky sidebar but simplify -- remove `card-organic` heavy shadow
- Use clean border card with subtle shadow
- Keep the gold CTA button as the single accent pop

### 8. PropertyStickyNav.tsx
- Simplify active state from `bg-primary text-primary-foreground` (filled pill) to a simple underline indicator
- Reduce visual weight

### 9. HouseRulesAccordion.tsx
- Ensure consistent clean styling with thin borders

## Files Modified

| File | Change |
|------|--------|
| `src/pages/PropertyDetail.tsx` | Remove AtAGlanceCards, add section dividers, increase spacing, reduce motion |
| `src/components/properties/PropertyQuickStats.tsx` | Clean white card, remove colored icon backgrounds |
| `src/components/properties/PropertyHighlights.tsx` | Simple grid layout, remove colored badges |
| `src/components/properties/AmenityList.tsx` | Remove colored tile backgrounds, simplify hover effects |
| `src/components/properties/RoomBreakdown.tsx` | Clean bordered containers, inline icons |
| `src/components/properties/NeighborhoodInfo.tsx` | Remove heavy card shadows, use light borders |
| `src/components/properties/PropertyStickyNav.tsx` | Underline-style active indicator |
| `src/components/booking/BookingWidget.tsx` | Lighter card shadow, clean borders |

No database changes. No new files. Pure styling and layout refinement.

