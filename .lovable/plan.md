

# Fix Property Count on Destination Cards

## Problem
The destination cards show "0 properties" because the count logic in `Destinations.tsx` matches properties by comparing `property.city` to `destination.name` (string matching), which is unreliable and often fails.

## Solution
Use the `destination_id` foreign key on the `properties` table instead of string matching. Properties already have a `destination_id` column linking them to destinations.

## Changes

### `src/pages/Destinations.tsx`
Update `getPropertyCount` to match by `destination_id` instead of city name:

```typescript
// Before (unreliable string matching)
const getPropertyCount = (destinationName: string) => {
  if (!properties) return 0;
  return properties.filter(p => 
    p.city.toLowerCase() === destinationName.toLowerCase()
  ).length;
};

// After (reliable FK matching)
const getPropertyCount = (destinationId: string) => {
  if (!properties) return 0;
  return properties.filter(p => p.destination_id === destinationId).length;
};
```

Update the usage in the JSX to pass `destination.id` instead of `destination.name`:

```tsx
propertyCount={getPropertyCount(destination.id)}
```

### `src/pages/DestinationDetail.tsx`
Apply the same fix there if it also uses city-name matching for filtering properties (will verify during implementation).

No database or backend changes needed -- the `destination_id` column already exists on `properties`.

