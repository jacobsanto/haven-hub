

# Dark Mode Palette Propagation

## Problem

The `applyDarkPalette()` function in `BrandContext.tsx` correctly generates a `.dark { ... }` CSS override style tag with all 26 variables (base colors, foreground companions, popover, sidebar). However, the `.dark` class is **never toggled** on the HTML element because:

1. There is no `ThemeProvider` from `next-themes` wrapping the app
2. There is no dark mode toggle anywhere in the UI

The dark palette infrastructure is complete -- it just needs to be activated.

## Changes

### 1. `src/App.tsx` -- Add ThemeProvider

Wrap the app tree with `ThemeProvider` from `next-themes`:
- `attribute="class"` so it adds/removes the `.dark` class on `<html>`
- `defaultTheme="light"` to start in light mode
- `enableSystem={false}` since this is brand-controlled, not OS-controlled
- Place it inside `QueryClientProvider` but outside `BrandProvider`

### 2. `src/components/layout/Header.tsx` -- Add dark mode toggle

Add a Moon/Sun icon button in the header's right section (next to currency switcher):
- Uses `useTheme()` from `next-themes` to toggle between "light" and "dark"
- Shows Sun icon in dark mode, Moon icon in light mode
- Styled consistently with the existing icon buttons (ghost, rounded-full)
- Handles the transparent homepage state like other header buttons

### 3. `src/components/layout/Footer.tsx` -- Add dark mode toggle (optional mirror)

Add a small toggle in the footer for accessibility, so users can switch modes from the bottom of the page too.

## Technical Details

### ThemeProvider placement

```text
QueryClientProvider
  ThemeProvider (attribute="class", defaultTheme="light")
    AuthProvider
      BrandProvider
        ...rest of app
```

This ensures the `.dark` class is on `<html>` before `BrandProvider` runs `applyDarkPalette()`, and the injected `.dark { ... }` style tag takes effect immediately.

### Header toggle button

```text
[CurrencySwitcher] [DarkModeToggle] [Search] [Wishlist] [UserMenu/BookNow]
```

Uses `useTheme()` hook:
- `theme` -- current value ("light" or "dark")
- `setTheme()` -- toggles between them

### No changes to BrandContext

The existing `applyDarkPalette()` already:
- Sets all 10 base color variables under `.dark`
- Auto-computes all 6 foreground companions
- Syncs popover (bg + foreground)
- Syncs all 8 sidebar variables
- Syncs `--input` to border

It just needs the `.dark` class to actually be present on `<html>`.

## Files Modified

1. `src/App.tsx` -- Wrap with `ThemeProvider`
2. `src/components/layout/Header.tsx` -- Add Moon/Sun toggle button
3. `src/components/layout/Footer.tsx` -- Add small footer toggle

