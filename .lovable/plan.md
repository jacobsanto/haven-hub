
# Interactive Map View for Properties Page

## Overview

Replace the "Map View Coming Soon" placeholder with a fully interactive map using **Leaflet** (free, no API key needed) that displays property pins. Hovering over a pin shows a rich villa card popup with image, price, stats, and booking CTA.

## Approach

Use **Leaflet** + **react-leaflet** -- a free, open-source map library that requires no API keys. OpenStreetMap tiles provide the base map at no cost.

### New Dependencies

- `leaflet` -- map rendering engine
- `react-leaflet` -- React bindings for Leaflet
- `@types/leaflet` -- TypeScript definitions

### New Component: `PropertyMapView`

**File:** `src/components/properties/PropertyMapView.tsx`

A full-height interactive map that:

1. **Renders pins** for every property that has valid `latitude` and `longitude` values (skips properties without coordinates)
2. **Custom markers** styled with the brand's primary color (custom SVG pin icon, not the default blue Leaflet marker)
3. **Auto-fits bounds** to show all property pins on load using `fitBounds`
4. **Hover popup** -- when hovering a marker, a styled popup appears showing:
   - Property hero image (aspect 16:9, rounded top)
   - Property name (font-serif)
   - Location (city, country)
   - Key stats row: bedrooms, bathrooms, max guests (with icons)
   - Price per night (formatted with currency context)
   - Instant booking badge (if applicable)
   - Special offer badge (if active)
   - "View Details" link to the property page
   - "Book Now" button that opens `PropertyBookingPopup`
5. **Click behavior** -- clicking the popup's "View Details" navigates to `/properties/{slug}`
6. **Responsive** -- map takes full available height (min 500px on desktop, 400px on mobile)
7. **Properties without coordinates** -- a small banner below the map notes "X properties not shown (missing location data)" if any are missing lat/lng

### Popup Design

The hover popup mimics the QuickBookCard layout in miniature:

```text
+---------------------------+
| [Hero Image - 16:9]       |
| [Instant Book badge]      |
+---------------------------+
| Villa Name          price  |
| City, Country      /night |
| Bed 3 | Bath 2 | Guests 6 |
| [View Details] [Book Now] |
+---------------------------+
```

- Width: 280px
- White background, rounded-xl, shadow-lg
- Same border style as QuickBookCard: `border-[rgba(30,60,120,0.08)]`

### Leaflet CSS

Import Leaflet's CSS in the component file. The default Leaflet tile attribution is kept (required by OpenStreetMap license).

### Changes to Properties Page

**File:** `src/pages/Properties.tsx`

Replace the "Map View Coming Soon" placeholder block (lines 323-331) with:

```text
<PropertyMapView
  properties={properties || []}
  isLoading={isLoading}
/>
```

No other changes to the page. The grid/map toggle buttons already exist and work.

## Files Touched

1. **`src/components/properties/PropertyMapView.tsx`** -- NEW: Map component with Leaflet, custom markers, hover popups
2. **`src/pages/Properties.tsx`** -- Replace placeholder with `PropertyMapView` component

## What Does NOT Change

- No database changes -- lat/lng fields already exist on properties
- No backend changes
- Grid view unchanged
- Booking flow unchanged
- QuickBookCard unchanged
- All filters continue to work (the map receives the already-filtered `properties` array)

## Technical Notes

- Leaflet is ~40KB gzipped, lightweight compared to Google Maps or Mapbox
- No API key required -- uses free OpenStreetMap tiles
- Properties without coordinates are gracefully excluded with a count indicator
- The map re-fits bounds whenever the filtered properties list changes
- Popup uses React portals via react-leaflet's `Popup` component for full React rendering inside map popups
