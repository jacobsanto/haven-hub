

# Mobile Hero: Replace Cards with Dot Indicators

## Changes to `src/components/home/HeroSection.tsx`

1. **Hide card slider on mobile**: Wrap the card slider container with a `hidden md:block` class so it only appears on desktop/tablet.

2. **Add dot indicators on mobile**: Below the active property text block (and above the footer), render a row of 4 small dots — one per property. The active dot gets a filled/highlighted style (e.g., `bg-white w-2.5 h-2.5`), inactive dots get a muted style (`bg-white/40 w-2 h-2`). Dots are tappable to jump to that property. Only visible on mobile (`flex md:hidden`).

3. **Keep existing mobile features**: Touch swipe, arrows in footer, and background cross-fade all remain unchanged.

### Dot indicator markup (conceptual):
```tsx
<div className="flex md:hidden items-center justify-center gap-3 mt-4">
  {properties.map((_, i) => (
    <button
      key={i}
      onClick={() => { /* jump to property i */ }}
      className={`rounded-full transition-all ${i === activeIndex ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/40'}`}
    />
  ))}
</div>
```

