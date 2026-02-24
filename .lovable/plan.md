

# Fix Currency Switcher Styling in Header

## Problem

The currency switcher (Globe icon) in the header doesn't match the other icons when over the homepage hero. Other icons get white/transparent styling via `isTransparent`, but the CurrencySwitcher is rendered without those classes, making it look out of place on the hero.

## Change

### `src/components/layout/Header.tsx` (line 122)

Pass the same transparent-aware classes to the CurrencySwitcher that the dark mode toggle and other buttons already use:

```tsx
// Before
<CurrencySwitcher variant="icon" />

// After
<CurrencySwitcher
  variant="icon"
  className={cn(
    "rounded-full",
    isTransparent && "text-white/80 hover:text-white hover:bg-white/10"
  )}
/>
```

No changes needed in `CurrencySwitcher.tsx` itself -- it already accepts and merges a `className` prop.

