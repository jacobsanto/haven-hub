

## Clean Up Font Defaults — Use Only Fira Serif / Fira Sans Everywhere

### Problem
Your chosen fonts are **Fira Serif** (headings) and **Fira Sans** (body), set in the database. But the codebase has mismatched defaults in two places that cause wrong fonts to flash before brand settings load:

1. **`src/hooks/useBrandSettings.ts`** — `defaultBrandSettings` hardcodes `Playfair Display` / `Lato`
2. **`src/index.css`** — CSS variable defaults use generic system font stacks (`ui-serif, Georgia` / `system-ui, Roboto, Helvetica`)
3. **`tailwind.config.ts`** — Font family fallbacks include `ui-serif, Georgia` / `ui-sans-serif, system-ui`

### Changes

#### 1. `src/hooks/useBrandSettings.ts`
Update `defaultBrandSettings` to match your actual chosen fonts:
- `heading_font: 'Fira Serif'` (was `Playfair Display`)
- `body_font: 'Fira Sans'` (was `Lato`)

#### 2. `src/index.css`
Update CSS variable defaults to use Fira fonts as primary, with clean fallbacks:
- `--font-serif: "Fira Serif", ui-serif, Georgia, serif`
- `--font-sans: "Fira Sans", ui-sans-serif, system-ui, sans-serif`

#### 3. `tailwind.config.ts`
No change needed — already uses `var(--font-serif)` and `var(--font-sans)`, so it inherits correctly.

#### 4. `index.html`
Add a preload `<link>` for Fira Serif and Fira Sans so the fonts start downloading immediately, before BrandContext even runs:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Serif:wght@300;400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap" />
```

This eliminates the flash of wrong fonts entirely — the correct fonts are loaded from the start, and all defaults match what's in your database.

