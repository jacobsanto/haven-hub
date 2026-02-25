

# Fix Hero Card & Search Bar Backgrounds

## What's Wrong

Both the Top Pick card and the Search Bar use the `.glass-panel` class, which applies `background: hsl(var(--background) / 0.75)` -- a 75% opaque background. Over the dark hero photograph, this creates a visible colored panel that hurts readability and looks heavy.

## The Fix

### 1. Top Pick Card -- Transparent Frosted Glass

Replace the `glass-panel` class on the featured villa card with a custom transparent glass treatment:
- Background: `bg-black/20 backdrop-blur-md` (very subtle dark tint + blur for readability over photos)
- Border: `border border-white/15` (faint white edge)
- Text inside remains white (already is) -- now reads cleanly over a lightly blurred photo background
- The card content area (below the image) also gets `bg-black/30 backdrop-blur-md` instead of the current opaque background

**File:** `src/pages/Index.tsx` (line 179)
- Change: `glass-panel rounded-2xl` to `bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl`
- Update content area `p-4` div to also have transparent dark glass styling

### 2. Search Bar -- White Background Inside

Give the search bar an explicit white/card background so it looks like a solid, readable input bar over the hero:
- Replace `glass-panel` class with `bg-white/95 backdrop-blur-sm border border-white/50 shadow-lg`
- This creates a clean white pill that is legible over any hero image
- On dark mode, it will use `bg-card/95` instead

**File:** `src/components/search/SearchBar.tsx` (line 137)
- Change: `glass-panel rounded-2xl lg:rounded-full` to `bg-card/95 backdrop-blur-sm border border-border/30 shadow-lg rounded-2xl lg:rounded-full`

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove `glass-panel` from featured villa card, use transparent dark glass instead |
| `src/components/search/SearchBar.tsx` | Remove `glass-panel`, use solid white/card background with subtle blur |

### What Does NOT Change
- The `.glass-panel` CSS class itself stays in `index.css` (used elsewhere)
- Hero overlay gradients, text colors, booking logic -- untouched
- All other pages and components -- unaffected
