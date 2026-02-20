

# Fix Homepage Destination Cards

## Problem

The homepage (`Index.tsx`) uses `useDestinations()` which fetches **all** destinations (including drafts), while the Destinations page uses `useActiveDestinations()`. This causes:

1. Draft destinations (e.g., "Santorini") appearing on the homepage for admin users
2. No property count shown on homepage destination cards (the `propertyCount` prop is never passed)
3. Mismatched query cache keys between homepage and destinations page

## Solution

### 1. Switch homepage to use `useFeaturedDestinations()` (src/pages/Index.tsx)

- Replace `useDestinations` import with `useFeaturedDestinations`
- This fetches only `status = 'active'` AND `is_featured = true` destinations, which is exactly what the homepage needs
- Remove the manual `filter(d => d.is_featured)` logic since the hook already handles it

### 2. Add property count to homepage destination cards (src/pages/Index.tsx)

- Import `useProperties` to get property data
- Pass `propertyCount` to each `DestinationCard` by counting properties with matching `destination_id`

## Technical Changes

**File: `src/pages/Index.tsx`**

- Line 14: Change `useDestinations` to `useFeaturedDestinations`
- Line 23: Update hook call to `useFeaturedDestinations()`
- Line 22: Add `useProperties()` call to get property data
- Line 32: Simplify to just `destinations?.slice(0, 3)` since the hook already filters by featured + active
- Line 149: Pass `propertyCount={properties?.filter(p => p.destination_id === destination.id).length || 0}` to `DestinationCard`

No database changes required. No new files needed.

