
# Fix Font Syncing Between Admin Dashboard and Frontend

## Problem Summary

When you change fonts in the Admin Settings (e.g., set heading font to "Georgia"), the database correctly saves this choice, but the frontend continues displaying the hardcoded default font (Playfair Display). This happens because Tailwind's font configuration bypasses the CSS variables that the admin system updates.

## Root Cause

| Layer | Current Behavior | Problem |
|-------|------------------|---------|
| Database | Stores `heading_font: Georgia` | Working correctly |
| BrandContext | Sets `--font-serif: "Georgia", serif` | Working correctly |
| Tailwind Config | Uses `serif: ["Playfair Display", "Georgia", "serif"]` | Hardcoded - ignores CSS variables |
| Components | Use `className="font-serif"` | Gets Tailwind's hardcoded value |

The Tailwind-generated CSS for `font-serif` outputs:
```css
.font-serif { font-family: Playfair Display, Georgia, serif; }
```

This static CSS overrides the dynamic CSS variable because it has higher specificity.

## Solution

Update `tailwind.config.ts` to reference CSS variables instead of hardcoded font names, making Tailwind's utility classes dynamic:

```text
BEFORE (hardcoded):
fontFamily: {
  serif: ["Playfair Display", "Georgia", "serif"],
  sans: ["Lato", "system-ui", "sans-serif"],
}

AFTER (CSS variable-based):
fontFamily: {
  serif: ["var(--font-serif)", "serif"],
  sans: ["var(--font-sans)", "sans-serif"],
}
```

Also update `src/index.css` to set default values for these CSS variables in `:root`, ensuring fonts work even before the BrandContext loads.

## Technical Implementation

### File 1: tailwind.config.ts

Change the fontFamily configuration to use CSS variables:

```typescript
fontFamily: {
  serif: ["var(--font-serif)", "serif"],
  sans: ["var(--font-sans)", "sans-serif"],
}
```

### File 2: src/index.css

Add default font CSS variables to `:root` so fonts display correctly during initial load:

```css
:root {
  /* ... existing variables ... */
  
  /* Typography - default fonts (overridden by BrandContext) */
  --font-serif: "Playfair Display", serif;
  --font-sans: "Lato", sans-serif;
}
```

Remove the fallback values from the body/heading rules since the variables now have defaults:

```css
body {
  font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
}
```

## How It Works After the Fix

```text
1. Page loads
   └─> CSS uses default --font-serif: "Playfair Display"
   
2. BrandContext fetches settings from database
   └─> Gets heading_font: "Georgia"
   
3. BrandContext updates CSS variable
   └─> Sets --font-serif: "Georgia", serif
   
4. All elements using font-serif update instantly
   └─> Headings now display in Georgia
```

## Files to Modify

| File | Change |
|------|--------|
| `tailwind.config.ts` | Replace hardcoded fonts with CSS variable references |
| `src/index.css` | Add default font variables to `:root`, simplify body/heading rules |

## Verification Steps

After implementation:
1. Go to Admin Settings and change the heading font to something distinctive (e.g., "Cormorant Garamond")
2. Navigate to the homepage
3. Verify all headings now use the selected font
4. Repeat for body font selection
