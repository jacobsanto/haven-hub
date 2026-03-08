

# Brand Palette & Typography Enforcement — Sliders, Headers, Footers

## Problem

Several components still violate the Arivia brand guidelines:

1. **BrightMinimalistHero** has a hardcoded `COLOR_PALETTE` with hex values (`#FF6B35`, `#1B7B8B`, etc.) and uses `text-white`, `from-black/60` — directly violating the semantic token rule.
2. **All 8 header variants** use `font-semibold` on brand name text — the typography standard requires `font-medium` for headings/labels.
3. **All 8 footer variants** have the same `font-semibold` issue on brand names and section headings.
4. **FooterFullOverlay overlay nav** uses `font-semibold` on nav items in the fullscreen overlay.

The 5 dark slider variants (Parallax, SplitReveal, MorphTiles, Cinematic, VerticalCurtain) are already compliant — they use `font-medium`, `text-foreground`, `text-accent`, and semantic gradient tokens.

---

## Plan

### 1. Fix BrightMinimalistHero — Replace Hardcoded Colors

**File**: `src/components/home/hero/BrightMinimalistHero.tsx`

- Remove the `COLOR_PALETTE` array with hex values
- Replace with accent-based semantic alternatives: the accent line uses `bg-accent`, card border uses `border-accent/30`, dot indicators use `hsl(var(--accent))`, card gradient uses `from-foreground/60` instead of `from-black/60`
- Replace `text-white` and `text-white/80` with `text-primary-foreground` and `text-primary-foreground/80`
- Replace `rgba(255,255,255,0.2)` border with `border-primary-foreground/20`
- Remove `style={{ background: palette.color }}` inline styles and use Tailwind accent tokens

### 2. Fix All 8 Headers — Typography Weight

**Files**: All files in `src/components/layout/headers/`

In each header, change brand name `font-semibold` → `font-medium`:
- `HeaderFloatingGlass.tsx` (line 55)
- `HeaderMegaMenu.tsx` (line 45)
- `HeaderCommandPalette.tsx` (line 62)
- `HeaderContextStrip.tsx` (line 48)
- `HeaderDockNav.tsx` (line 49)
- `HeaderFullOverlay.tsx` (lines 50, 87, 112)
- `HeaderSplitCenter.tsx` (line 65 area)
- `HeaderTickerBar.tsx` (line 75)

Also fix `src/components/layout/Header.tsx` (lines 77, 177).

### 3. Fix All 8 Footers — Typography Weight

**Files**: All files in `src/components/layout/footers/`

Change `font-semibold` → `font-medium` on brand names and heading text in:
- `FooterBento.tsx` (lines 51, 85)
- `FooterGlassmorphic.tsx` (line 88)
- `FooterEditorial.tsx` — already uses `font-medium` (compliant)
- `FooterBrutalist.tsx` — uses `font-medium` (compliant)
- `FooterImmersive.tsx` — uses `font-medium` (compliant)
- `FooterKinetic.tsx` — uses `font-medium` (compliant)
- `FooterMinimal.tsx` — uses `font-medium` (compliant)
- `FooterChatFirst.tsx` — uses `font-medium` on brand name (check heading)

### 4. Fix Main Header Component

**File**: `src/components/layout/Header.tsx`

Change `font-semibold` → `font-medium` on brand name (2 instances, lines 77 and 177).

---

## Summary

| Area | Files | Change |
|------|-------|--------|
| BrightMinimalistHero | 1 file | Remove hardcoded hex palette, use semantic tokens |
| Headers | 9 files | `font-semibold` → `font-medium` on brand names |
| Footers | 2-3 files | `font-semibold` → `font-medium` where needed |

No database changes. No structural changes. All edits are find-and-replace typography and color token swaps.

