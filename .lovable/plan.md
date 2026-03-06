

# Replace Hardcoded Dark Colors with Semantic Brand Tokens

## Problem
All homepage sections use hardcoded hex colors (`#0a0a0f`, `#111118`, `#15151f`, `#f0ece4`, `#6b6560`, `#a8a29e`) instead of the semantic CSS variables managed by the admin brand settings. This means changing brand colors in the dashboard has no effect on the homepage.

## Solution
Replace all hardcoded colors with Tailwind semantic classes that map to CSS variables from the brand system:

### Color Mapping
| Hardcoded | Semantic Replacement |
|---|---|
| `bg-[#0a0a0f]` | `bg-background` |
| `bg-[#111118]` | `bg-muted` |
| `bg-[#15151f]` | `bg-card` |
| `text-[#f0ece4]` | `text-foreground` |
| `text-[#6b6560]` | `text-muted-foreground` |
| `text-[#a8a29e]` | `text-muted-foreground` |
| `border-white/[0.06]` | `border-border` |
| `text-[#0a0a0f]` (on accent buttons) | `text-accent-foreground` |
| `from-[#0a0a0f]/85` (gradients) | `from-background/85` |

### Files to Update (8 files)
1. **`src/pages/Index.tsx`** — wrapper `bg-[#0a0a0f]` → `bg-background`
2. **`src/components/home/TrustSection.tsx`** — bg, text colors
3. **`src/components/home/DestinationsShowcase.tsx`** — bg, text, gradient, skeleton, badge colors
4. **`src/components/home/DiscoverVillasSection.tsx`** — bg, text, skeleton, button colors
5. **`src/components/home/FeaturedVacationSection.tsx`** — bg, text, gradient colors
6. **`src/components/home/LiveExperiencesSection.tsx`** — bg, text, card bg, skeleton colors
7. **`src/components/home/TestimonialsSection.tsx`** — bg, text, card bg, nav colors
8. **`src/components/home/WhyDirectSection.tsx`** — bg, text, card bg colors
9. **`src/components/home/CTASection.tsx`** — bg, text, button colors
10. **`src/components/home/SearchBarOverlay.tsx`** — bg, text, card bg, input colors

No database or hook changes needed — this is purely a Tailwind class swap in 10 component files.

