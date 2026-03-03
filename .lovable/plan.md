

# Mobile Hero Section Fix

## Current Issues (visible in screenshot)
- Heading text ("BLE VILLA") is very faint and hard to read against the background
- Cards sit in the middle of the screen, overlapping the background image awkwardly
- Large empty gap between navbar and content
- Cards are too tall relative to mobile viewport, pushing content below fold
- Footer pagination area has too much empty space above it

## Solution

### Changes to `src/components/home/HeroSection.tsx`

**Mobile layout restructure** — keep `flex-col` but position content better:

1. **Text area**: Center-vertically in the upper ~60% of the screen. Increase mobile heading size slightly (`text-3xl` → keep `text-4xl`). The gradient overlays already exist but on mobile we need a stronger left gradient since text sits at the left edge of a smaller screen. Add `from-black/70` on mobile instead of `from-black/60`.

2. **Cards**: Position at the bottom of the screen, above the footer. Reduce card height to `h-[130px]` on mobile (from `h-[160px]`) so they don't dominate. Keep `w-[110px]`. Cards should sit in a row that's visually anchored to the bottom, not floating in the middle.

3. **Layout flow**: Change from current `flex-1 flex items-center` (which centers everything vertically) to a structure where:
   - On mobile: text sits at ~40% from top (using `pt-[30vh]` or similar), cards sit near bottom with small gap before footer
   - On desktop: keep current side-by-side centered layout

4. **Footer**: On mobile, center the pagination and arrows. Already mostly works.

### Specific CSS changes:
- Main content wrapper: On mobile use `flex-col justify-end pb-20` instead of `items-center`, so text + cards stack from the bottom up
- Or alternatively: split into two zones — text zone (absolute, centered vertically at ~35-40% from top) and card zone (absolute, anchored ~120px from bottom)
- Mobile gradient: slightly stronger `from-black/70` on the left gradient for mobile text readability
- Card container on mobile: add `justify-center` to center the 3 cards horizontally

### Best practice alignment:
- Touch swipe already implemented ✓
- Arrows already visible on mobile ✓  
- Social icons hidden on mobile ✓ (correct — saves space)
- Auto-play works on mobile ✓

