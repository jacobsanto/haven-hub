
# Fix Map View: Replace react-leaflet with Vanilla Leaflet

## The Problem

The `render2 is not a function` error keeps recurring because `react-leaflet` uses React's internal `Context.Consumer` pattern, and the Vite dependency cache is serving a stale, incompatible bundle. Multiple attempts to fix via version pinning and deduplication have not resolved this.

## The Solution

Remove `react-leaflet` and `@react-leaflet/core` entirely. Rewrite `PropertyMapView` to use vanilla Leaflet directly via React refs. This gives us the exact same map with zero React version conflicts.

The map appearance, pins, popups, and all interactions remain identical -- only the internal wiring changes from react-leaflet's JSX components to imperative Leaflet API calls.

## What Changes

### 1. Remove Dependencies
- Remove `react-leaflet` and `@react-leaflet/core` from package.json
- Keep `leaflet` and `@types/leaflet` (these have no React dependency)

### 2. Rewrite `src/components/properties/PropertyMapView.tsx`

Replace the react-leaflet JSX approach with vanilla Leaflet:

- Use a `useRef<HTMLDivElement>` for the map container
- Initialize the Leaflet map in a `useEffect` with `L.map()`
- Add the OpenStreetMap tile layer with `L.tileLayer()`
- Create markers with `L.marker()` using the same custom SVG pin icon
- Bind popups with `marker.bindPopup()` using HTML strings for the popup content
- Fit bounds with `map.fitBounds()` when properties change
- Clean up with `map.remove()` on unmount

Key differences in popup handling:
- Popups will use HTML strings instead of React components (Leaflet's native approach)
- The "View Details" link works natively as an anchor tag
- The "Book Now" button will navigate to the property page's booking section since we can't render React components inside vanilla Leaflet popups
- Price formatting will be done before building the HTML string

### 3. Popup Content

The popup keeps the same visual design but is built as an HTML string:
- Property hero image (16:9 aspect ratio)
- Instant booking and special offer badges
- Property name, location, price per night
- Bedroom/bathroom/guest stats with SVG icons
- "View Details" and "Book Now" buttons (both as links)

## What Does NOT Change

- Map appearance and tile source (OpenStreetMap)
- Custom pin icon design
- Auto-fit bounds behavior
- Missing-coordinates warning banner
- Loading state
- The Properties page integration (same props interface)
- No database or backend changes

## Technical Details

- `leaflet` (v1.9.4) is a pure JavaScript library with zero framework dependencies
- Vanilla Leaflet popups use HTML strings, which avoids all React context issues
- The map instance lifecycle is managed entirely through `useEffect` cleanup
- Property data is passed to popup HTML via template literals with pre-formatted values
