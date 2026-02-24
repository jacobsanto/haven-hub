

# Homepage Hero Section Redesign

## Reference Layout

The reference image shows a hero with this structure:
- Full-bleed background image (destination photo)
- Top-center: Large heading "Experience [Destination]" + subtitle
- Middle-bottom area: Search bar (glass panel) on the LEFT side + a Featured Villa card on the RIGHT side, side by side
- Bottom center: 4 circular navigation icons (page shortcuts)

## Changes Required

### File: `src/pages/Index.tsx` (Hero Section Only)

Restructure the hero section (lines 41-72) to match the reference layout:

1. **Hero heading** -- Add dynamic text at top-center of hero: "Experience [Destination Name]" using the first featured property's destination data, with a subtitle like "Book a luxury villa in [location]". White text, large serif font.

2. **Search + Villa Card row** -- Replace the current centered search bar with a horizontal flex layout:
   - **Left side**: The existing `SearchBar` (glass panel, already styled)
   - **Right side**: A new "Featured Villa" card -- a compact glass-panel card showing:
     - Property hero image (thumbnail)
     - Property name
     - Star rating (gold stars + "4.9")
     - Location (city, country)
     - Price ("From [base_price] / per night")
     - "View Details" button linking to `/properties/[slug]`
   - On mobile: stack vertically (search on top, villa card below)

3. **Bottom navigation icons** -- Replace the "Scroll to Discover" indicator with a row of 4 circular icon buttons linking to key pages:
   - Destinations (MapPin icon)
   - Properties (Home icon)
   - Experiences (Sparkles icon)
   - Blog/Stories (BookOpen icon)
   - Glass-panel style circles, white/translucent with subtle icons

### File: `src/components/search/SearchBar.tsx`

No structural changes needed -- the hero variant already has the right glass-panel pill style. Minor tweak: remove the Destination field from the hero variant since the hero already contextualizes the destination. (Optional -- can keep as-is if simpler.)

---

## Technical Details

### New elements in `Index.tsx` hero section:

**Hero Heading Block** (above search row):
```text
"Experience {heroProperty destination name}"
"Book a luxury villa in {city}, {country}"
```
Uses existing `heroProperty` data (already fetched). Falls back to brand name if no property.

**Featured Villa Card** (new inline component):
- Uses `heroProperty` (the first featured property, already available)
- Shows: `hero_image_url`, `name`, `city`, `country`, `base_price`
- Links to `/properties/${heroProperty.slug}`
- Glass-panel background with rounded corners
- Compact: ~280px wide on desktop

**Bottom Nav Icons**:
- 4 `Link` components with circular glass-panel buttons
- Replaces the current "Scroll to Discover" `motion.div`

### Layout structure (desktop):
```text
|------------------------------------------|
|        Experience Santorini              |
|   Book a luxury villa overlooking...     |
|                                          |
|  [Search Bar (glass)]  [Villa Card]      |
|                                          |
|         [o] [o] [o] [o]                 |
|------------------------------------------|
```

### Layout structure (mobile):
```text
|----------------------|
|  Experience          |
|  Santorini           |
|  subtitle...         |
|                      |
|  [Search Bar]        |
|  [Villa Card]        |
|                      |
|    [o][o][o][o]      |
|----------------------|
```

### Files modified:
- `src/pages/Index.tsx` -- Hero section restructure (lines 41-72)

### No new files, no new hooks, no business logic changes. Pure layout/UI work using existing data.

