

# Mobile Hero: Show Cards & Transitions

## Problem
The card slider is entirely hidden on mobile (`!isMobile` guard on line 187). Users only see a static background with text — no cards, no sliding effects, no visual sense of property rotation.

## Solution
Show a horizontal card strip on mobile below the heading content, with smaller cards and swipe-friendly layout. Keep all transitions working.

### Changes to `src/components/home/HeroSection.tsx`

1. **Remove the `!isMobile` gate** on the card slider block (line 187)
2. **Responsive card sizing**: Use smaller cards on mobile (`w-[120px] h-[180px]` vs desktop `w-[190px] h-[340px]`)
3. **Reposition for mobile**: On mobile, move cards below the text content (stacked vertically: heading → cards → footer). Use flex-col on mobile, flex-row on desktop for the main content area
4. **Show navigation arrows on mobile**: Currently the footer arrows are visible, but also add touch-swipe support via `onTouchStart`/`onTouchEnd` handlers on the container for left/right swiping
5. **Adjust text sizing**: The heading is already responsive (`text-4xl md:text-5xl`), keep as-is
6. **Footer on mobile**: Show pagination + arrows (already visible), hide social icons (already `hidden md:flex`), hide center label (already `hidden md:block`) — no changes needed

### Layout on mobile:
```text
┌─────────────────────┐
│   Background image   │
│                      │
│  PROPERTY NAME       │
│  Description text    │
│  [Explore]           │
│                      │
│  ┌────┐┌────┐┌────┐ │
│  │Card││Card││Card│  │
│  └────┘└────┘└────┘  │
│                      │
│      01/04  ◀ ▶      │
└──────────────────────┘
```

### Touch swipe
Add simple touch detection (track `touchStartX`, compare with `touchEndX` on end, threshold ~50px) to trigger `goNext`/`goPrev`.

