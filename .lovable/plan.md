

# Fix Font & Typography Dashboard Connection

## Current State

The font pipeline is **architecturally correct**: `BrandContext` sets `--font-serif` and `--font-sans` CSS variables, Tailwind's `font-serif`/`font-sans` utilities reference them, and the CSS base layer applies them to headings and body. When you change fonts in the admin, they DO propagate.

However, two issues exist:

### Issue 1: Hardcoded `text-white` bypasses the semantic system
The Header (transparent state on homepage) and the Button `gold` variant still use hardcoded `text-white` / `bg-white` classes instead of semantic tokens. This means those elements won't adapt to theme changes.

**Affected locations:**
- `src/components/layout/Header.tsx` — ~15 instances of `text-white`, `bg-white/10` for transparent homepage state
- `src/components/ui/button.tsx` — `gold` variant uses `text-white`

### Issue 2: No granular typography controls in admin
The admin only has heading font and body font selectors. There are no controls for:
- Font weights (heading vs body)
- Letter spacing
- Button/CTA text style
- Navigation text size

## Plan

### Fix 1: Replace hardcoded `text-white` in Header
Replace all `text-white` / `bg-white/10` conditional classes with `text-primary-foreground` / `bg-primary-foreground/10` for the transparent hero state. This ensures the header adapts to whatever the brand's primary foreground color is.

**File:** `src/components/layout/Header.tsx`

### Fix 2: Replace `text-white` in Button gold variant
Change `text-white` to `text-primary-foreground` in the gold variant definition.

**File:** `src/components/ui/button.tsx`

### Fix 3: Add typography granularity to admin settings (optional enhancement)
Add three new fields to `brand_settings`:
- `heading_weight` (400-700, default 500)
- `body_weight` (300-500, default 400)  
- `heading_letter_spacing` (normal, wide, wider)

These get applied in `BrandContext.applyTheme()` as additional CSS variables (`--heading-weight`, `--body-weight`, `--heading-tracking`) and referenced in the CSS base layer.

**Files:**
- DB migration: add 3 columns to `brand_settings`
- `src/contexts/BrandContext.tsx` — apply new vars
- `src/index.css` — reference new vars in base layer
- `src/pages/admin/AdminSettings.tsx` — add controls to typography section
- `src/hooks/useBrandSettings.ts` — add new fields to interface

### Summary

| File | Change |
|---|---|
| `src/components/layout/Header.tsx` | Replace `text-white` → `text-primary-foreground` |
| `src/components/ui/button.tsx` | Gold variant: `text-white` → `text-primary-foreground` |
| DB migration | Add `heading_weight`, `body_weight`, `heading_letter_spacing` columns |
| `src/hooks/useBrandSettings.ts` | Add new fields to interface + defaults |
| `src/contexts/BrandContext.tsx` | Apply new CSS vars in `applyTheme` |
| `src/index.css` | Use new CSS vars in base heading/body rules |
| `src/pages/admin/AdminSettings.tsx` | Add weight/spacing controls to typography section |

