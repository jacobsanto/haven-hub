

# Theme Export/Import and Dark Mode Toggle

## Overview

Add two features to the Color Palette settings tab:

1. **Theme Export/Import** -- Export the current color scheme as a JSON file and import one back, enabling sharing themes across environments.
2. **Dark Mode Toggle with Contrast Checks** -- A light/dark mode toggle that auto-generates dark mode colors from the current palette, with WCAG contrast ratio warnings.

## Changes

### 1. `src/pages/admin/AdminSettings.tsx` -- Theme Export/Import + Dark Mode

**Export Feature:**
- "Export Theme" button in the Colors tab header
- Exports all 10 color fields + fonts as a JSON file (`.havenhub-theme.json`)
- File download triggered via `Blob` + `URL.createObjectURL`
- JSON schema includes a `version` key for future compatibility

**Import Feature:**
- "Import Theme" button next to Export
- Hidden `<input type="file" accept=".json">` triggered by button click
- Validates the imported JSON structure before applying
- Shows toast on success/failure
- Updates `formState` (does NOT auto-save -- user must click "Save Changes" to persist)

**Dark Mode Section:**
- New "Mode" subsection at the top of the Colors tab
- Two-button toggle: "Light" / "Dark" (not a system-level dark mode -- this controls which palette set is being edited)
- When toggling to "Dark", auto-generate inverted colors from current light palette:
  - Background becomes dark (swap background/foreground lightness)
  - Card becomes slightly lighter than background
  - Muted darkens
  - Border darkens
  - Primary/accent may shift lightness for visibility
- User can manually adjust after auto-generation
- Save stores a new `dark_` prefixed set of color columns (or a `dark_palette` JSONB column)

**Contrast Checks:**
- For each color pair (e.g., primary on background, foreground on background, destructive on background), compute WCAG contrast ratio
- Display a small badge next to each color: green checkmark (>= 4.5:1), amber warning (3:1-4.5:1), red fail (< 3:1)
- Uses relative luminance formula: `L = 0.2126*R + 0.7152*G + 0.0722*B`
- Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)`
- Computed client-side, no backend needed

### 2. Database Migration -- Add `dark_palette` column

Add a single JSONB column to `brand_settings`:
- `dark_palette` (jsonb, nullable, default null) -- stores the dark mode color overrides as `{ primary_color, secondary_color, ... }`

This avoids adding 10+ new columns. When null, the system uses the CSS-defined dark mode defaults from `index.css`.

### 3. `src/hooks/useBrandSettings.ts` -- Extend interface

- Add `dark_palette` to `BrandSettings` interface as `Record<string, string> | null`
- Add to `defaultBrandSettings` as `null`

### 4. `src/contexts/BrandContext.tsx` -- Apply dark palette

- In `applyTheme()`, if `settings.dark_palette` exists, inject it as CSS variables scoped under `.dark` class
- Create a `<style>` tag with `.dark { --primary: ...; --background: ...; }` overrides
- This integrates with the existing `next-themes` dark mode toggle already in the app

### 5. Theme JSON Schema

```text
{
  "version": 1,
  "name": "My Custom Theme",
  "light": {
    "primary_color": "245 51% 19%",
    "secondary_color": "243 29% 86%",
    "accent_color": "32 48% 66%",
    "background_color": "0 0% 100%",
    "foreground_color": "244 42% 28%",
    "muted_color": "243 29% 86%",
    "card_color": "0 0% 100%",
    "border_color": "243 29% 86%",
    "destructive_color": "0 55% 55%",
    "ring_color": "32 48% 66%"
  },
  "dark": { ... } | null,
  "fonts": {
    "heading_font": "Playfair Display",
    "body_font": "Lato"
  }
}
```

## Technical Details

### Contrast ratio computation (inline in AdminSettings.tsx):

```typescript
function getRelativeLuminance(hslStr: string): number {
  // Parse HSL -> convert to RGB -> compute luminance
  const hex = hslStringToHex(hslStr);
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hsl1: string, hsl2: string): number {
  const l1 = getRelativeLuminance(hsl1);
  const l2 = getRelativeLuminance(hsl2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Dark palette auto-generation logic:

- Take current light palette
- Invert lightness values: `newL = 100 - oldL` (clamped)
- Adjust saturation slightly (reduce by ~10% for dark backgrounds)
- Keep hue unchanged
- User can override any value after generation

### BrandContext dark palette injection:

```typescript
function applyDarkPalette(palette: Record<string, string>) {
  let styleEl = document.getElementById('brand-dark-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'brand-dark-overrides';
    document.head.appendChild(styleEl);
  }
  const vars = Object.entries(palette)
    .map(([key, val]) => `--${key.replace(/_color$/, '').replace(/_/g, '-')}: ${val};`)
    .join('\n  ');
  styleEl.textContent = `.dark {\n  ${vars}\n}`;
}
```

## Files Modified

1. **Database migration** -- Add `dark_palette` JSONB column to `brand_settings`
2. `src/hooks/useBrandSettings.ts` -- Add `dark_palette` to interface and defaults
3. `src/contexts/BrandContext.tsx` -- Apply dark palette overrides via injected `<style>` tag
4. `src/pages/admin/AdminSettings.tsx` -- Export/Import buttons, dark mode editing section, contrast ratio badges

