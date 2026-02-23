
# Google Maps Integration for Property Locations

## What We'll Do

Replace the "Map view coming soon" placeholder on each property page with your custom Google Maps embed. Each property will show a zoomed-in view of its specific location using the latitude/longitude already stored in the database, plus a link to your full custom map.

## Implementation

### 1. Update `NeighborhoodInfo` Component

- Add `latitude` and `longitude` as optional props
- Replace the placeholder `div` (lines 115-123) with:
  - **If the property has coordinates**: A Google Maps `iframe` embed centered on the property's lat/lng at a high zoom level (zoom ~15), using the standard Google Maps embed API (`maps.google.com/maps?q=lat,lng&z=15&output=embed`)
  - **Below it (always)**: A smaller link/button to "View full area map" that opens your custom Google My Maps (`https://www.google.com/maps/d/u/0/embed?mid=1S5lSiOv53CgAoE_ATDkpmI_h4tdoBgo`) in a new tab
  - **If no coordinates**: Fall back to your full custom map embed as the default view

### 2. Update `PropertyDetail.tsx`

- Pass `latitude` and `longitude` from the property object to `NeighborhoodInfo`:
  ```
  <NeighborhoodInfo
    ...existing props
    latitude={property.latitude}
    longitude={property.longitude}
  />
  ```

## Technical Details

### NeighborhoodInfo Props Change

```text
interface NeighborhoodInfoProps {
  ...existing props
  latitude?: number | null;
  longitude?: number | null;
}
```

### Map Rendering Logic

```text
if (latitude && longitude exist)
  --> Show Google Maps iframe: ?q={lat},{lng}&z=15&output=embed
  --> Show "View full area map" link to your custom My Maps
else
  --> Show your custom My Maps iframe as fallback
```

### Styling
- The iframe replaces the placeholder inside the existing `border border-border/50 rounded-xl p-4` container
- `aspect-video` ratio maintained, `rounded-lg overflow-hidden`
- The "View full area map" link styled as a subtle text link with an external-link icon

## Files Changed

| File | Change |
|------|--------|
| `src/components/properties/NeighborhoodInfo.tsx` | Add lat/lng props, replace placeholder with Google Maps iframe |
| `src/pages/PropertyDetail.tsx` | Pass `latitude` and `longitude` to `NeighborhoodInfo` |
