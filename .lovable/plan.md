

# Add Villa Background Image Behind Effects

## Change
Show the active property's hero image as a full-bleed background on both desktop and mobile, behind all the dark overlays, grain, and spotlight effects. Currently only mobile shows a faded image at 15% opacity — this will extend to all viewports with a dark gradient overlay on top to maintain readability.

## Implementation

### `src/components/home/HeroSection.tsx`

1. **Remove the mobile-only condition** on the background image (lines 118-124). Make it always render for all viewports.

2. **Increase opacity slightly** from `opacity-15` to around `opacity-25` or `opacity-30` so the villa image is more visible but still behind the dark treatment.

3. **Add a dark gradient overlay div** on top of the image (before the spotlight) to preserve text contrast — something like `bg-gradient-to-b from-[#1A1A1A]/70 via-[#1A1A1A]/50 to-[#2A2A2A]/80`.

4. **Add a CSS transition** on the background image so it cross-fades smoothly when the active property changes.

Result: The villa photo becomes a cinematic backdrop visible through the dark gradient, grain, and spotlight layers — giving depth while keeping the minimalist dark aesthetic.

