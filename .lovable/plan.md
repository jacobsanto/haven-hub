

# Restructure Destinations to Santorini Villages

## Current State

- **1 destination**: "Santorini" (island-level)
- **Properties** have `city` field with village names: Oia, Fira, Thira, Imerovigli, Megalochori, Emporio, Vothonas, Perissa, Mesaria
- **Linking**: Currently matches `property.country` to `destination.country` (too broad)

## Goal

Destinations = Santorini villages (Oia, Fira, Imerovigli, etc.) so guests can browse properties by specific village

## Implementation Plan

### Step 1: Create Village Destinations

Create new destination records for each Santorini village where you have properties:

| Village | Slug | Description |
|---------|------|-------------|
| Oia | oia | Famous for sunsets, blue domes, luxury boutiques |
| Fira | fira | Island capital, vibrant nightlife, caldera views |
| Imerovigli | imerovigli | "Balcony of the Aegean", quietest caldera village |
| Megalochori | megalochori | Traditional wine village, authentic Cycladic charm |
| Emporio | emporio | Medieval fortress village, local atmosphere |
| Vothonas | vothonas | Cave houses, peaceful countryside setting |
| Perissa | perissa | Black sand beach, family-friendly |
| Mesaria | mesaria | Central location, traditional wineries |
| Thira | thira | Historic center, walking distance to Fira |

Each destination will have:
- `name`: Village name
- `slug`: URL-friendly name
- `country`: "Greece"
- `description`: Short village description
- `is_featured`: true for main villages (Oia, Fira, Imerovigli)
- `status`: "active"

### Step 2: Update Property-Destination Linking Logic

Modify how properties connect to destinations:

**Option A (Recommended)**: Use the existing `destination_id` foreign key
- Update each property's `destination_id` to link to its village destination
- Most reliable approach, proper relational data

**Option B**: Match by city name
- Update `DestinationCard`, `Destinations.tsx`, and `DestinationDetail.tsx` to match `property.city` to `destination.name`
- Faster to implement but less structured

### Step 3: Files to Modify

| File | Change |
|------|--------|
| `src/pages/Destinations.tsx` | Update `getPropertyCount()` to filter by city or destination_id |
| `src/pages/DestinationDetail.tsx` | Update `destinationProperties` filter to use city or destination_id |
| `src/components/destinations/DestinationCard.tsx` | No changes needed (receives count as prop) |

### Step 4: Delete or Archive Old Destination

Remove or set to "draft" the old "Santorini" island-level destination after village destinations are created

## Data Changes Required

1. **Insert** 9 new village destinations into `destinations` table
2. **Update** each property's `destination_id` to match its village (or update linking logic)
3. **Delete** or set `status='draft'` on the old "Santorini" destination

## Technical Details

### Updated getPropertyCount in Destinations.tsx

```typescript
// Match by city (village name) instead of country
const getPropertyCount = (destinationName: string) => {
  if (!properties) return 0;
  return properties.filter(p => 
    p.city.toLowerCase() === destinationName.toLowerCase()
  ).length;
};
```

### Updated filter in DestinationDetail.tsx

```typescript
// Filter properties for this destination (by city/village)
const destinationProperties = allProperties?.filter(
  p => destination && p.city.toLowerCase() === destination.name.toLowerCase()
) || [];
```

## Expected Result

- Homepage and Destinations page will show village cards: Oia (2 properties), Fira (4 properties), etc.
- Clicking a village shows only properties in that village
- Guests can browse by specific Santorini location

