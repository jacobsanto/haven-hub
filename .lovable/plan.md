

# Full Color Palette Propagation

## Problem

The color palette editor saves colors and sets CSS variables, but the theme does NOT fully propagate across the site because:

1. **Missing foreground companion variables** -- `applyTheme()` sets `--primary` but NOT `--primary-foreground`, `--secondary-foreground`, `--accent-foreground`, `--muted-foreground`, `--card-foreground`, `--destructive-foreground`. This means buttons, cards, and badges can become unreadable when colors change (e.g., a dark primary with dark foreground text).

2. **Popover and sidebar variables are ignored** -- Dropdowns, select menus, context menus, and the admin sidebar all use `--popover`, `--popover-foreground`, `--sidebar-background`, etc. These are never updated by `applyTheme()`.

3. **~40 files use hardcoded Tailwind colors** -- Classes like `bg-blue-600`, `text-emerald-700`, `bg-amber-100` bypass the palette entirely. Most of these fall into two categories:
   - **Status indicators** (confirmed = emerald, pending = amber, error = red) -- these are intentionally semantic and should stay hardcoded for clarity.
   - **Admin dashboard decorative colors** (quick action icons, stat cards) -- these could be converted but are low-priority admin-only visuals.

## Scope Decision

**What MUST change** (affects every public-facing page):
- Add auto-computed foreground companions for all 10 color tokens
- Sync popover variables to background/foreground
- Sync sidebar variables to the palette

**What should NOT change** (intentional design):
- Status color indicators (emerald/amber/red for confirmed/pending/failed) -- these are semantic, not brand colors
- Blog callout variants (tip = amber, info = blue, timing = purple) -- these are content-type indicators
- Admin dashboard quick-action icon colors -- decorative variety, admin-only

## Changes

### 1. `src/contexts/BrandContext.tsx` -- Complete `applyTheme()`

Add an `autoForeground()` helper that determines whether white or dark text is more readable on a given HSL background (using relative luminance). Then set ALL companion variables:

```text
For each base color (primary, secondary, accent, muted, card, destructive):
  --{name}-foreground = autoForeground(baseColor)

Sync derived variables:
  --popover         = --card (or --background)
  --popover-foreground = --card-foreground
  --input           = --border

Sidebar sync:
  --sidebar-background       = --background
  --sidebar-foreground        = --foreground
  --sidebar-primary           = --primary
  --sidebar-primary-foreground = --primary-foreground
  --sidebar-accent            = --accent
  --sidebar-accent-foreground  = --accent-foreground
  --sidebar-border            = --border
  --sidebar-ring              = --ring
```

The `autoForeground()` function:
- Parses the HSL string (e.g., `"245 51% 19%"`)
- Converts to RGB, computes relative luminance
- Returns a light foreground (`"0 0% 100%"`) if luminance < 0.5, or dark foreground (the current `--foreground` value) if luminance >= 0.5
- This ensures text is always readable on any background color

### 2. `src/contexts/BrandContext.tsx` -- Dark palette foreground sync

The existing `applyDarkPalette()` function injects raw key-value pairs. Update it to also auto-compute foreground companions for any base color present in the dark palette, using the same `autoForeground()` logic.

### 3. No database changes needed

All foreground values are computed client-side from the stored base colors. No new columns required.

### 4. No changes to status/semantic colors

The hardcoded emerald/amber/red status colors in `src/lib/utils.ts` and admin components are intentional semantic indicators (confirmed, pending, error) and will remain unchanged. These are not "brand" colors.

## Technical Details

### Auto-foreground computation

```typescript
function parseHsl(hslStr: string): [number, number, number] {
  const parts = hslStr.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [0, 0, 50];
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
}

function hslToLuminance(h: number, s: number, l: number): number {
  // Convert HSL to RGB, then compute relative luminance
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return c;
  };
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(f(0)) + 0.7152 * toLinear(f(8)) + 0.0722 * toLinear(f(4));
}

function autoForeground(baseHsl: string): string {
  const [h, s, l] = parseHsl(baseHsl);
  const luminance = hslToLuminance(h, s, l);
  return luminance > 0.4 ? '244 42% 28%' : '0 0% 100%';
}
```

### Complete variable list set by applyTheme()

```text
Base (10):        --primary, --secondary, --accent, --background, --foreground,
                  --muted, --card, --border, --destructive, --ring

Foreground (6):   --primary-foreground, --secondary-foreground, --accent-foreground,
                  --muted-foreground, --card-foreground, --destructive-foreground

Derived (2):      --input (= border), --popover, --popover-foreground

Sidebar (8):      --sidebar-background, --sidebar-foreground, --sidebar-primary,
                  --sidebar-primary-foreground, --sidebar-accent,
                  --sidebar-accent-foreground, --sidebar-border, --sidebar-ring
```

Total: 26 CSS variables fully synced to the palette.

## Files Modified

1. `src/contexts/BrandContext.tsx` -- Add `autoForeground()` helper, expand `applyTheme()` to set all 26 variables, update `applyDarkPalette()` to include foreground companions

