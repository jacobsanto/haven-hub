# FloatingBookButton Design Improvements

## Summary

Update the floating booking button to better match its actual function (search/discovery, not date picking) and improve mobile UX with scroll-aware visibility and better positioning.

## Changes (1 file)

### `src/components/booking/FloatingBookButton.tsx`

**Icon and Label Fix**

- Replace `Calendar` icon with `Compass` (desktop) and `Search` (mobile) to match the search/discovery intent
- Change hover text from "Book Now" to "Find a Stay"

**Scroll-Aware Visibility**

- Add a `useEffect` scroll listener that only shows the button after the user scrolls past ~70% of viewport height (past the hero CTA)
- Wrap both desktop and mobile buttons in `AnimatePresence` so they fade in/out smoothly

**Mobile: Bottom-Center Pill**

- Move mobile button from `fixed bottom-4 right-4` to `fixed bottom-5 left-1/2 -translate-x-1/2` (centered)
- Change from icon-only circle to a pill shape with `Search` icon + "Search" text label
- Slightly smaller height (`h-12` instead of `h-14`) for a sleeker look

**Desktop: Always Show Label**

- Show "Find a Stay" label always (not just on hover) since the button only appears after scrolling
- On hover, show a dynamic property count badge (e.g., "- 12 stays") using data from `useProperties`

**Social Proof Badge**

- Import `useProperties` to get the count of available properties
- Show count on both mobile (always) and desktop (on hover) as a subtle secondary text

### Dependencies

- Uses existing `useProperties` hook (no new data fetching)
- No new components or files needed   CREATE ONE FIELD OF AREAS WITH A DROPDOWN SHOWING DESTINATIONS INSTEAD OF HAVING THEM ALL THERE CAVERING ESTATE