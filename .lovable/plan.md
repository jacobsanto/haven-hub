
# Fix Property List Scrolling in "Choose Your Property" Step

## Problem
The `ScrollArea` wrapping the property list in the "Choose Your Property" step (line 342 of `UnifiedBookingDialog.tsx`) uses `max-h-[50vh]` / `max-h-[40vh]`, but the Radix ScrollArea viewport is set to `h-full w-full`. With only a `max-height` constraint and no fixed height, the viewport expands to fit all content instead of constraining and enabling scroll.

## Fix

### File: `src/components/booking/UnifiedBookingDialog.tsx`

Change the `ScrollArea` class from `max-h-` to a fixed `h-` value so the Radix viewport has a definite height to constrain against. The content inside will scroll when it exceeds this height.

**Line 342** -- change:
```
<ScrollArea className={isMobile ? "max-h-[50vh]" : "max-h-[40vh]"}>
```
to:
```
<ScrollArea className={isMobile ? "h-[50vh]" : "h-[40vh]"}>
```

This gives the ScrollArea a definite height, allowing the internal Radix viewport (`h-full`) to properly constrain and enable scrolling when property cards overflow.

### Single file change, single line edit.
