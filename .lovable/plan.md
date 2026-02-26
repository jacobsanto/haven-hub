# Enrich AI Content Generator with Full Entity Knowledge

## Problem

When generating AI content for a property (or destination/experience), the system only passes a small subset of data to the AI. For example, properties only send `city, country, bedrooms, bathrooms, short_description, description, amenities` -- completely missing the **property type** (villa, apartment, estate), **max guests**, **area size**, **exact address/coordinates**, **highlights**, **room breakdown**, **nearby attractions**, **house rules**, **neighborhood description**, **region**, and **base price**.

This means the AI writes generic content without knowing whether it's writing about a beachfront villa or a city apartment, how many guests it accommodates, what the neighborhood is like, or what attractions are nearby.

## Solution

Two changes:

### 1. Pass complete entity data from `AdminAIContent.tsx`

Expand the `existingData` payload in the `items` useMemo to include all available fields per entity type:

**Properties** -- add: `property_type`, `region`, `max_guests`, `base_price`, `area_sqm`, `highlights`, `rooms`, `nearby_attractions`, `neighborhood_description`, `house_rules`, `address`, `latitude`, `longitude`

**Destinations** -- add: `long_description`, `best_time_to_visit`, `climate`, `latitude`, `longitude`

**Experiences** -- add: `long_description`, `includes`, `destination_id`, `is_featured`

**Blog Posts** -- add: `content`, `article_style`

### 2. Structure the context clearly in the edge function prompt

Instead of dumping raw JSON (`JSON.stringify(existingData)`), format it into labeled, human-readable sections so the AI understands the context properly. For example:

```text
PROPERTY CONTEXT:
- Name: Villa Amalfi
- Type: Villa
- Location: Positano, Campania, Italy
- Address: Via Roma 12
- Coordinates: 40.6281, 14.4849
- Size: 350 m2 | 4 Bedrooms | 3 Bathrooms | Up to 8 Guests
- Base Price: EUR 450/night
- Amenities: infinity pool, private chef, sea view, WiFi, air conditioning
- Highlights: Panoramic Amalfi Coast views, Private beach access
- Rooms: Master Suite, Guest Bedroom x2, Living Room, Chef's Kitchen
- Nearby: Path of the Gods (2km), Positano Beach (500m)
- Neighborhood: Perched on a cliff overlooking the Mediterranean...
- House Rules: No smoking indoors, No pets
```

This gives the AI rich, structured knowledge about the exact property so it can write accurate, specific, compelling content -- not generic filler.

## Files Modified

### `src/pages/admin/AdminAIContent.tsx` (lines 45-57)

Expand each case in the `items` useMemo to spread all available entity fields into `existingData`.

### `supabase/functions/generate-content/index.ts` (lines 684-689)

Replace the raw JSON dump with a formatter that structures `existingData` into clearly labeled sections based on `contentType` (property, destination, experience, blog).

## No Database Changes

All fields already exist in the database. This is purely about passing and formatting existing data.

Also add the change of uploading hero image or video in homepage and not taking the photo from the featured property 