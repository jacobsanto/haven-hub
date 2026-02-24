

# Enhance Mobile-Friendly Gallery Reorder Controls

## Problem

The current `GalleryEditor` has basic mobile arrow buttons, but they fall short on touch devices:

- Action buttons (remove, set-as-hero) are hidden behind `group-hover` which doesn't trigger on touch
- Arrow buttons are 24px (h-6 w-6), below the 44px minimum touch target standard
- No visual animation when items swap via arrows -- the change is jarring
- Helper text says "Drag to reorder" on mobile where native drag doesn't work
- The overlay darkens on hover only, so mobile users see no controls at all

## Solution

Improve the existing `GalleryEditor.tsx` to be properly mobile-friendly with better touch controls and visual drag feedback.

### Changes

**1. Always-visible controls on mobile**
- Remove `opacity-0 group-hover:opacity-100` gating on mobile for action buttons (remove, hero)
- Show a persistent semi-transparent overlay on mobile so buttons are always readable
- Keep hover-reveal behavior on desktop (`md:opacity-0 md:group-hover:opacity-100`)

**2. Larger touch targets for arrow buttons**
- Increase mobile arrow buttons from `h-6 w-6` (24px) to `h-9 w-9` (36px) with adequate padding, meeting the 44px effective touch area with surrounding space
- Keep compact size on desktop

**3. Animated swap feedback**
- Add a brief CSS transition (`transition-transform`) on the image cards
- When `moveItem` is called, briefly highlight the swapped card with a scale pulse using a `justMoved` state that auto-clears after 300ms

**4. Context-aware helper text**
- Show "Drag to reorder" on desktop, "Use arrows to reorder" on mobile
- Use the existing `useIsMobile` hook to switch text

**5. Better disabled state for arrows**
- Disabled arrows get reduced opacity and a muted style so users understand they're at the boundary

## File to Modify

- `src/components/admin/GalleryEditor.tsx`

### Technical Detail

```text
Key state additions:
  - justMovedIndex: number | null   (briefly set after arrow move, cleared via setTimeout)

Mobile detection:
  - Import useIsMobile from '@/hooks/use-mobile'

CSS changes (all Tailwind):
  - Mobile action buttons: "opacity-100 md:opacity-0 md:group-hover:opacity-100"
  - Mobile overlay: "bg-black/20 md:bg-black/0 md:group-hover:bg-black/40"
  - Arrow buttons: "h-9 w-9 md:h-6 md:w-6"
  - Swap animation: "transition-all duration-200" + conditional "scale-105 ring-2 ring-primary/30"
  - Helper text: conditional on useIsMobile()
```

No new files, no new dependencies, no database changes.
