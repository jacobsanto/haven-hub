

# Fix: Card Deck Should Not Duplicate the Featured Property

## Problem
The left panel displays the active property's name, description, and CTA. The card deck on the right shows **all properties including the active one** — so the front card is always a duplicate of what's already featured on the left. This is redundant.

## Solution
Filter the active property out of the card deck. The deck becomes a "peek at the other villas" element — clicking a card in the deck switches the featured property.

### `src/components/home/HeroSection.tsx`
- Pass a filtered list to `CardDeck` that excludes the current `activeIndex` property
- Pass a mapping callback so clicking a deck card sets the correct `activeIndex` in the parent

### `src/components/home/hero/CardDeck.tsx`
- Receives the non-active properties only
- When a card is clicked, calls `onSelect` with the **original index** (not the filtered index)
- All cards now stack naturally without one being "active/front" — the first card in the filtered list is the top card, others fan behind it

### Mapping Logic
```typescript
// In HeroSection:
const otherProperties = properties
  .map((p, i) => ({ ...p, originalIndex: i }))
  .filter((_, i) => i !== activeIndex);

// CardDeck receives these and uses originalIndex for onSelect
```

The deck will show 3 cards (if 4 total), all slightly offset/rotated. The top card is the "next up" property. Clicking any card promotes it to the featured slot on the left.

