

# Fix "Contact Us" Button Styling

## Problem Identified

The "Contact Us" button in the CTA section (line 410 of `src/pages/Index.tsx`) currently uses:
```tsx
<Button size="lg" variant="outline" className="rounded-full px-8 border-background/30 text-background hover:bg-background/10">
```

This creates a nearly invisible white-on-white outline button with very subtle hover state on the dark background section.

## Solution

Change the button to use the **`secondary` variant** (same as the "Browse Properties" button next to it), which provides:
- Solid background color for visibility
- Clear hover state with 80% opacity
- Consistent styling with its sibling button

---

## Implementation

### File: `src/pages/Index.tsx`

**Line 410** - Change from:
```tsx
<Button size="lg" variant="outline" className="rounded-full px-8 border-background/30 text-background hover:bg-background/10">
  Contact Us
</Button>
```

**To:**
```tsx
<Button size="lg" variant="secondary" className="rounded-full gap-2 px-8">
  Contact Us
</Button>
```

This makes the "Contact Us" button match the "Browse Properties" button style, providing:
- Solid pale blue background (`bg-secondary`)
- Navy text color (`text-secondary-foreground`)
- Visible hover state (`hover:bg-secondary/80`)

---

## Visual Result

| Before | After |
|--------|-------|
| Ghost-like white outline | Solid secondary background |
| Barely visible hover | Clear 80% opacity hover |
| Inconsistent with sibling | Matches "Browse Properties" |

