

# Replace Hardcoded Hex Colors in Hero Components

## Scope
Two files still contain hardcoded hex colors: `HeroSection.tsx` and `HeroSliderVariants.tsx`. All other homepage sections were already converted.

## Color Mapping Applied

| Hardcoded | Semantic |
|---|---|
| `bg-[#0a0a0f]` | `bg-background` |
| `text-[#f0ece4]` | `text-foreground` |
| `text-[#a8a29e]` | `text-muted-foreground` |
| `text-[#6b6560]` | `text-muted-foreground` |
| `from-[#0a0a0f]` (gradients) | `from-background` |
| `bg-[#f0ece4]` (dots) | `bg-foreground` |
| `hover:text-[#f0ece4]` | `hover:text-foreground` |
| `hover:text-[#0a0a0f]` | `hover:text-accent-foreground` |
| Inline `rgba(10,10,15,...)` | `hsl(var(--background) / opacity)` |

## Files Changed

### 1. `src/components/home/HeroSection.tsx`
- Line 109: `bg-[#0a0a0f]` → `bg-background`
- Line 110: `text-[#a8a29e]` → `text-muted-foreground`
- Line 122: `bg-[#0a0a0f]` → `bg-background`
- Line 150: gradient hex → `from-background`
- Line 171: `text-[#6b6560]` → `text-muted-foreground`
- Line 175: `text-[#f0ece4]` → `text-foreground`
- Line 180: `text-[#a8a29e]` → `text-muted-foreground`
- Line 189: `text-[#a8a29e]` + hover → `text-muted-foreground hover:text-foreground`
- Line 201: `bg-[#f0ece4]` → `bg-foreground`
- Line 228: `text-[#f0ece4]` → `text-foreground`
- Line 248: `text-[#6b6560]` → `text-muted-foreground`
- Line 257: `bg-[#f0ece4]` → `bg-foreground`

### 2. `src/components/home/hero/HeroSliderVariants.tsx`
All 5 slider variants get the same treatment:
- **ParallaxDepthHero**: gradient, heading, subtitle, price subtext (lines 55, 67, 70, 75)
- **SplitRevealHero**: gradient, bg, heading, subtitle, meta text, price, hover button (lines 112, 115, 124, 127, 130, 136, 140)
- **MorphTilesHero**: gradient, heading, subtitle, price subtext (lines 184, 204, 207, 212)
- **CinematicHero**: inline rgba gradient, heading, subtitle, price subtext (line 254, 264, 267, 273)
- **VerticalCurtainHero**: gradient, heading, subtitle, price subtext (lines 308, 318, 321, 326)

Total: ~30 replacements across both files. No logic changes, purely class swaps.

