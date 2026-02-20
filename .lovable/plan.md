

# Enhanced Property Quick-Onboard with Auto-Location and Destination Mapping

## What This Delivers

The quick-onboard wizard will be upgraded so that when an admin types a property address or city, the system automatically:
- Fills in city, region, country, and coordinates
- Matches and links the property to an existing destination
- Stores a full street address and lat/lng for future map features

## Changes Overview

### 1. Database: Add Address Fields to Properties Table

Add new columns to the `properties` table:
- `address` (text, nullable) -- full street address
- `latitude` (numeric, nullable) -- GPS latitude
- `longitude` (numeric, nullable) -- GPS longitude
- `postal_code` (text, nullable) -- postal/zip code

These are all optional so existing properties and the full editor continue to work unchanged.

### 2. Backend Function: Geocoding Service

Create a new edge function `geocode-address` that:
- Accepts a free-text address query
- Calls the OpenStreetMap Nominatim API (free, no API key required)
- Returns structured location data: city, region, country, postal code, latitude, longitude
- Includes proper User-Agent header per Nominatim usage policy

### 3. Quick-Onboard Wizard Enhancements (Step 2 -- Location)

Upgrade the Location step with:
- A single "Address or Place" search input with a "Lookup" button
- On lookup, calls the geocode function and auto-fills: address, city, region, country, postal code, latitude, longitude
- Admin can review and override any auto-filled field
- A destination auto-match: after city/country are filled, the system checks existing destinations and auto-selects the best match (by name matching city or country)
- If a matching destination is found, it shows a chip like "Linked to: Santorini". If not, it shows "No matching destination" (admin can still select manually)

### 4. Full Property Form Enhancement

Add the same address/coordinates fields to `AdminPropertyForm.tsx`:
- New "Address" text field and "Lookup" button in the location section
- Latitude/longitude fields (read-only, populated by lookup)
- Same geocoding + destination auto-match logic

### 5. Type Updates

Update `Property` interface in `src/types/database.ts` to include `address`, `latitude`, `longitude`, `postal_code`.

---

## Technical Details

### Migration SQL
```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS postal_code text;
```

### Edge Function: `supabase/functions/geocode-address/index.ts`
- Accepts `{ query: string }` via POST
- Calls `https://nominatim.openstreetmap.org/search?q=...&format=json&addressdetails=1&limit=5`
- Returns array of results with structured address components
- No API key needed; rate-limited to 1 req/sec by Nominatim policy (acceptable for admin use)
- CORS headers included

### Destination Auto-Match Logic
After geocoding fills city/country, the wizard queries existing destinations and matches by:
1. Exact city name match against destination name
2. Country match as fallback
3. If multiple matches, prefer the one marked `is_featured`

This runs client-side using the already-fetched destinations list (via `useDestinations` hook), so no extra database call.

### Files Created
- `supabase/functions/geocode-address/index.ts` -- geocoding edge function
- `src/hooks/useGeocode.ts` -- hook wrapping the geocode call

### Files Modified
- `src/types/database.ts` -- add address/lat/lng/postal_code to Property interface
- `src/pages/admin/AdminQuickOnboard.tsx` -- add address lookup, destination auto-match, new form fields
- `src/pages/admin/AdminPropertyForm.tsx` -- add address/coordinates section with lookup
- `src/hooks/useProperties.ts` -- include new fields in transformProperty

### No Breaking Changes
- All new columns are nullable with no defaults required
- Existing properties continue working as-is
- The full editor gains optional new fields without disrupting current layout

