

# Fix Missing Scrollbar-Hide Utility Class

## Problem Identified

After investigating the `/properties` page, I found that **vertical page scrolling is working correctly**. However, there's a missing CSS utility class that could cause visual/functional issues in specific components.

### Issue: `scrollbar-hide` Class Not Defined

The `scrollbar-hide` utility class is used in 2 files but never defined in the CSS or Tailwind configuration:

| File | Line | Context |
|------|------|---------|
| `PropertyGallery.tsx` | 186 | Thumbnail strip horizontal scroll |
| `PropertyStickyNav.tsx` | 72 | Navigation links horizontal scroll |

This class is intended to hide scrollbars while allowing scrolling (common for horizontal overflow areas on mobile).

---

## Solution

Add the `scrollbar-hide` utility class to the project's CSS.

### Implementation: Add to `src/index.css`

Add the following CSS utility in the `@layer utilities` section:

```css
@layer utilities {
  /* Existing utilities... */

  /* Hide scrollbar but allow scrolling */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
}
```

---

## Technical Details

### What This Utility Does
- Hides the scrollbar visually while maintaining scroll functionality
- Commonly used for:
  - Horizontal thumbnail strips
  - Horizontal navigation menus
  - Carousel-like components on mobile

### Cross-Browser Support
- **Chrome/Safari/Opera**: Uses `::-webkit-scrollbar` pseudo-element
- **Firefox**: Uses `scrollbar-width: none`
- **IE/Edge Legacy**: Uses `-ms-overflow-style: none`

### Files Changed
- `src/index.css` (1 addition)

### Impact
- Low risk change - only adds missing utility
- Components using this class will now properly hide scrollbars
- No breaking changes to existing functionality

---

## Alternative: Tailwind Plugin

If you prefer using a Tailwind plugin, you could install `tailwind-scrollbar-hide`:

```bash
npm install tailwind-scrollbar-hide
```

Then add to `tailwind.config.ts`:

```typescript
plugins: [
  require("tailwindcss-animate"),
  require("tailwind-scrollbar-hide")
],
```

However, the CSS solution is simpler and doesn't require an additional dependency.

