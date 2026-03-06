

## Fix: Darken the blurred hero background

**File**: `src/components/home/HeroSection.tsx`, line 153

Change the overlay from `bg-foreground/40` (which renders as a white wash in dark theme) to `bg-black/50` so the blurred background image is properly darkened.

Single-line change.

