

# Color Palette Settings Upgrade

## Overview

Upgrade the Color Palette tab in Admin Settings with a visual color picker, additional color fields, updated defaults, and bug fixes for a more intuitive theming experience.

## Current Issues

- Colors are entered as raw HSL text strings -- not user-friendly
- Only 5 color fields exist (primary, secondary, accent, background, foreground), but the CSS system uses more (muted, card, border, destructive, ring)
- No visual color picker -- admins have to know HSL format
- The BrandContext only applies 5 CSS variables, leaving muted/card/border/ring unaffected by brand changes

## Changes

### 1. Database Migration -- Add new color columns

Add 5 new nullable columns to `brand_settings`:
- `muted_color` (text) -- muted backgrounds
- `card_color` (text) -- card surfaces
- `border_color` (text) -- borders and dividers
- `destructive_color` (text) -- error/danger states
- `ring_color` (text) -- focus rings

### 2. `src/hooks/useBrandSettings.ts` -- Extend interface and defaults

- Add the 5 new color fields to the `BrandSettings` interface and `defaultBrandSettings`
- Default values derived from current `index.css` values:
  - muted: `243 29% 86%`
  - card: `0 0% 100%`
  - border: `243 29% 86%`
  - destructive: `0 55% 55%`
  - ring: `32 48% 66%`

### 3. `src/contexts/BrandContext.tsx` -- Apply new CSS variables

Update `applyTheme()` to also set `--muted`, `--card`, `--border`, `--destructive`, and `--ring` CSS variables when the new columns have values.

### 4. `src/pages/admin/AdminSettings.tsx` -- Major Color Tab upgrade

**Visual Color Picker:**
- Add an `<input type="color">` next to each color field
- Convert between HSL (stored format) and hex (picker format) using helper functions
- The text input remains for precise HSL entry; the picker provides a visual alternative

**More Color Fields:**
- Add the 5 new colors (muted, card, border, destructive, ring) to the form state and the color grid
- Organized into two groups: "Brand Colors" (primary, secondary, accent) and "System Colors" (background, foreground, muted, card, border, destructive, ring)

**Updated Defaults:**
- Keep existing defaults but ensure all 10 fields have sensible values

**Improved Preview:**
- Expand the preview section to show muted backgrounds, card surfaces, borders, and destructive button alongside existing previews

### 5. Helper functions for color conversion

Add to the AdminSettings file (or a small utility):
- `hslStringToHex(hsl)` -- converts `"245 51% 19%"` to `"#1a1847"` for the color picker input
- `hexToHslString(hex)` -- converts `"#1a1847"` to `"245 51% 19%"` for storage

## Technical Details

### Color Picker Implementation

Each color row will look like:

```text
[ Color Picker ] [ HSL Text Input          ] [ Preview Swatch ]
  (type=color)    "245 51% 19%"               (live preview)
```

- Editing the picker updates the HSL text input
- Editing the text input updates the picker
- Both reflect in the preview swatch

### Form State Changes

```typescript
interface FormState {
  // ... existing fields ...
  muted_color: string;
  card_color: string;
  border_color: string;
  destructive_color: string;
  ring_color: string;
}
```

### Color Groups in UI

```text
Brand Colors
  Primary     [picker] [input]  -- Main brand color
  Secondary   [picker] [input]  -- Supporting color
  Accent      [picker] [input]  -- Special highlights

System Colors
  Background  [picker] [input]  -- Page background
  Foreground  [picker] [input]  -- Main text color
  Muted       [picker] [input]  -- Muted backgrounds
  Card        [picker] [input]  -- Card surfaces
  Border      [picker] [input]  -- Borders & dividers
  Destructive [picker] [input]  -- Error/danger states
  Ring        [picker] [input]  -- Focus rings
```

## Files Modified

1. **Database migration** -- Add 5 new columns to `brand_settings`
2. `src/hooks/useBrandSettings.ts` -- Extend interface + defaults
3. `src/contexts/BrandContext.tsx` -- Apply new CSS variables in `applyTheme()`
4. `src/pages/admin/AdminSettings.tsx` -- Color picker, new fields, improved preview

