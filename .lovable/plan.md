

## Font Cleanup and Fira Font Family Addition

### Problem

1. **Hardcoded font imports in `src/index.css`** — Six `@import` statements load Playfair Display, Lato, Space Grotesk, Lora, Space Mono, and Inter statically, regardless of what the admin selects in the dashboard. The BrandContext already dynamically loads the selected Google Font via `loadGoogleFont()`, making these static imports redundant and wasteful.

2. **Hardcoded fallback fonts in `tailwind.config.ts`** — The Tailwind config sets `Lora` as the serif fallback and `Inter` as the sans fallback and `Space Mono` as the mono fallback. These override whatever the admin selects in brand settings until the CSS variables from BrandContext kick in, causing a flash of wrong font (FOUT).

3. **Missing Fira font family** — Neither `Fira Sans` nor `Fira Serif` (nor `Fira Code` / `Fira Mono`) appear in the dashboard font lists.

### What stays the same (no changes needed)

- `font-serif` / `font-sans` / `font-mono` Tailwind utility classes used throughout 137+ component files — these are correct and semantic. They resolve to CSS variables set by BrandContext.
- The `BrandContext.tsx` dynamic font loading via `loadGoogleFont()` — this is the correct mechanism.
- The `FontSelector` component — works fine, just needs a bigger font list.

### Changes

#### 1. Remove all static Google Font `@import` lines from `src/index.css`

Remove lines 1-6 (the six `@import url(...)` statements). The BrandContext already loads the selected fonts dynamically. These static imports load unused fonts and cause bandwidth waste.

#### 2. Update Tailwind font fallbacks in `tailwind.config.ts`

Replace hardcoded font names with CSS variable references so fonts always match the admin selection:

```typescript
fontFamily: {
  serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
  sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
},
```

This ensures that `font-serif`, `font-sans`, and `font-mono` classes everywhere automatically reflect the dashboard-selected fonts with no flash.

#### 3. Add Fira font family to dashboard font lists in `src/pages/admin/AdminSettings.tsx`

Add to `HEADING_FONTS`:
- `Fira Sans` (works well for modern headings)
- `Fira Serif` (editorial/classic headings)

Add to `BODY_FONTS`:
- `Fira Sans` (clean body text)
- `Fira Code` (if monospaced body is desired)
- `Fira Sans Condensed` (compact layouts)

#### 4. Update `src/index.css` CSS variable defaults

Keep the existing `--font-serif` and `--font-sans` CSS variable declarations in `:root` as-is — they serve as fallbacks before BrandContext loads. No change needed here since they already use generic system font stacks.

### Summary

| File | Change |
|------|--------|
| `src/index.css` | Remove 6 static `@import url(...)` lines |
| `tailwind.config.ts` | Replace hardcoded font names with `var(--font-serif/sans/mono)` references |
| `src/pages/admin/AdminSettings.tsx` | Add Fira Sans, Fira Serif, Fira Sans Condensed, Fira Code to font lists |

