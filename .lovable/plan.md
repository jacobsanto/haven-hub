

## Plan: Remove opacity reduction from hero background image

Currently the hero background image has `opacity-25` applied, making it very dark/faded. The user wants the image at full brightness and clarity.

### Change

**File: `src/components/home/HeroSection.tsx`** (~line 144)
- Remove `opacity-25` from the background image div's className, so the image renders at full natural brightness.

That's it — one class removal.

