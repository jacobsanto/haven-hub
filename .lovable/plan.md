

# Property Detail Page -- Clean Aesthetic Refinement

## Current Issues (from visual inspection)

1. **Gallery**: Only the hero image fills the left half when a property has no secondary images -- the right side is completely empty white space
2. **Description**: Long text appears as a wall of text with no truncation or visual break
3. **Quick Stats bar**: The `-mt-12` overlap creates awkward spacing between gallery and content
4. **Booking Widget**: Price header uses default foreground color instead of the gold accent; CTA button class `btn-organic` uses gold but could be more prominent
5. **Section headings**: Lack the serif weight and subtle gold accent that would tie them to the brand
6. **Property name**: Could use more visual weight with the navy color being more deliberate
7. **PropertyCard**: Still uses `card-organic` with shadow and `hover-lift` which feels heavy

## Changes

### 1. PropertyGallery.tsx -- Full-width hero fallback
- When there are fewer than 2 images, render a single full-width hero image instead of the half-empty bento grid
- Keep the bento grid for properties with 2+ images

### 2. PropertyDetail.tsx -- Description truncation and spacing
- Add a "Read more / Read less" toggle for descriptions longer than 3 lines (~300 characters)
- Remove the `-mt-12` overlap on QuickStats -- use standard spacing instead
- Add a subtle gold accent line under the property name (a small decorative `border-b` or `<hr>` in gold)
- Increase the top padding after the gallery for cleaner breathing room

### 3. PropertyQuickStats.tsx -- Refined stat bar
- Remove the `-mt-12 relative z-10` overlap positioning
- Use a simple horizontal divider approach: stats displayed inline with pipe separators or thin vertical dividers
- Add subtle gold accent to the stat values (using `text-[hsl(var(--gold-accent))]`)

### 4. BookingWidget.tsx -- Gold accent treatment
- Apply gold color to the price display (`text-[hsl(var(--accent))]` for the price number)
- Ensure the CTA button uses the gold accent prominently
- Add a thin gold top border to the widget card for visual distinction

### 5. PropertyCard.tsx -- Cleaner card styling
- Replace `card-organic` with a simpler `border border-border/50 rounded-2xl bg-card` 
- Remove `hover-lift` animation, use subtle `hover:shadow-md` instead
- Remove the motion animations on individual cards for a more stable feel

### 6. Section headings (PropertyDetail.tsx)
- Add a small gold decorative element (a short line or bar) before each section heading
- Keep the existing `font-serif` styling but bump to `font-semibold` for more weight

### 7. SimilarProperties.tsx -- Cleanup
- Remove `motion` wrapper animation (consistent with the "reduce motion" principle)
- Remove `card-organic` reference in loading skeleton

## Files Modified

| File | Change |
|------|--------|
| `src/components/properties/PropertyGallery.tsx` | Full-width fallback for single image |
| `src/pages/PropertyDetail.tsx` | Description truncation, spacing fixes, gold accents on section headings |
| `src/components/properties/PropertyQuickStats.tsx` | Remove overlap positioning, gold stat values, inline layout |
| `src/components/booking/BookingWidget.tsx` | Gold price accent, gold top border |
| `src/components/properties/PropertyCard.tsx` | Cleaner card, remove heavy animations |
| `src/components/properties/SimilarProperties.tsx` | Remove motion wrapper, clean skeleton |

No database changes. No new dependencies.

