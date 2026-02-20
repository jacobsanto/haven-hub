

# Live Weather Widget + English-Only Geocoding

## 1. Animated Weather Widget on Destination Pages

Replace the static "Climate" info card on the destination detail page with a minimal, animated real-time weather widget. It will show:
- Current temperature
- Weather condition (sunny, cloudy, rain, etc.) with a small animated icon (CSS keyframe animations -- sun pulse, cloud drift, rain drops)
- A one-line description like "Sunny, 28C"

**Data source**: Open-Meteo API (free, no API key required). It needs latitude/longitude to fetch weather.

### How it works
- A new edge function `destination-weather` accepts `{ latitude, longitude }` and calls `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current_weather=true`
- A new hook `useDestinationWeather` calls the function
- A new component `WeatherWidget` renders the animated result
- The widget replaces the Climate card in the sidebar on `DestinationDetail.tsx`
- Falls back to the static climate text if coordinates are missing or the API fails

### Database change
Add `latitude` and `longitude` columns to the `destinations` table so weather can be fetched per destination.

```sql
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
```

## 2. Geocode Function Returns English Results

Update the `geocode-address` edge function to add `&accept-language=en` to the Nominatim API URL. This ensures all city names, regions, and countries come back in English, enabling reliable destination matching.

**Change**: One line in the URL construction:
```
...&accept-language=en&limit=5
```

## Files

| Action | File | Purpose |
|--------|------|---------|
| Migrate | destinations table | Add latitude, longitude columns |
| Modify | `supabase/functions/geocode-address/index.ts` | Add `accept-language=en` param |
| Create | `supabase/functions/destination-weather/index.ts` | Fetch live weather from Open-Meteo |
| Create | `src/hooks/useDestinationWeather.ts` | Hook to call the weather function |
| Create | `src/components/destinations/WeatherWidget.tsx` | Animated weather display component |
| Modify | `src/pages/DestinationDetail.tsx` | Replace Climate card with WeatherWidget |
| Modify | `src/types/destinations.ts` | Add latitude/longitude to Destination interface |

## Technical Details

### Edge Function: `destination-weather`
- Public (no auth required -- weather is guest-facing)
- Calls Open-Meteo current weather API
- Returns `{ temperature, weathercode, windspeed, is_day }`
- Maps WMO weather codes to human labels and icon types (sunny/cloudy/rainy/snowy/stormy)

### WeatherWidget Component
- Minimal card with animated weather icon (CSS animations via Tailwind keyframes)
- Shows temperature, condition text, and the static climate description below
- Loading skeleton while fetching
- Graceful fallback to static climate text on error or missing coordinates

### Geocode English Fix
- Single param addition `&accept-language=en` to Nominatim URL ensures consistent English results for destination/property matching

