
# Availability Calendar Sync Fix Plan

## Problem Summary

The calendars were showing all dates as unavailable because:

1. **Stale blocks accumulated in the database** - The `availability` table had 721 blocked entries when only ~620 should exist based on actual bookings
2. **The PMS sync unblock logic wasn't running consistently** - Earlier sync runs showed "0 stale dates to unblock" when there were clearly stale blocks
3. **The `sync_booking_to_availability` trigger is NOT attached** - The function exists but there's no trigger using it, causing inconsistency when local bookings are created/cancelled

## Current Status (After Recent Sync)

The database is now correct! The sync at 23:25 successfully:
- Identified 100 stale dates to unblock
- Cleaned up February availability (Feb 4-9 now correctly available)
- Total blocked dates reduced from 721 to 621

**Centro House February 2026 (Now Correct):**
| Date Range | Status | Guest |
|------------|--------|-------|
| Feb 3 | Blocked | STELLA |
| Feb 4-9 | Available | - |
| Feb 10 | Blocked | James |
| Feb 11-13 | Available | - |
| Feb 14 - Mar 16 | Blocked | Manoj Katwal |
| Mar 17-18 | Available | - |
| Mar 19-28 | Blocked | Stanislav Natov |

## Root Causes

### Issue 1: Database Trigger Not Attached
The `sync_booking_to_availability` function exists but is NOT triggered by any events on the `bookings` table. This means:
- When local bookings are created → dates aren't blocked
- When bookings are cancelled → dates aren't unblocked
- This creates drift between `bookings` and `availability` tables

### Issue 2: Stale Cache in Frontend
The user's browser cached old availability data from before the sync cleanup. The real-time subscription should trigger a refetch, but there may be a timing gap.

## Fixes Required

### Fix 1: Attach the Database Trigger (CRITICAL)

Create a trigger to connect `sync_booking_to_availability` to the `bookings` table:

```sql
CREATE TRIGGER sync_booking_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_to_availability();
```

This ensures local booking changes immediately update the availability table.

### Fix 2: Add Query Staleness Handling

Reduce the `staleTime` in `useAvailabilityCalendar` to ensure fresher data:

**Current:** `staleTime: 30000` (30 seconds)
**Change to:** `staleTime: 10000` (10 seconds)

Also add a `refetchInterval` for the booking flow pages:

```typescript
refetchInterval: 60000, // Refetch every minute as backup
```

### Fix 3: Improve Real-time Invalidation Logging

Add console logging to the real-time subscription to verify it's working:

```typescript
.on('postgres_changes', { event: '*', ... }, (payload) => {
  console.log('[RT] Availability change:', payload.eventType, payload.new?.date || payload.old?.date);
  queryClient.invalidateQueries({ queryKey: ['availability-calendar', propertyId] });
})
```

### Fix 4: Force Refetch After Sync Now

When the admin triggers "Sync Now", ensure all connected calendars refetch:

```typescript
onSuccess: () => {
  // Broadcast to all tabs/windows
  queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
  queryClient.invalidateQueries({ queryKey: ['availability'] });
}
```

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Create trigger on `bookings` table |
| `src/hooks/useCheckoutFlow.ts` | Reduce staleTime, add refetchInterval |
| `src/hooks/useRealtimeAvailability.ts` | Add debug logging (optional) |
| `src/hooks/useAdvanceCMSync.ts` | Ensure Sync Now invalidates all calendars |

## Database Migration SQL

```sql
-- Create trigger to sync booking changes to availability table
CREATE TRIGGER sync_booking_availability_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_to_availability();
```

## Verification Steps

After implementing:
1. Create a test booking → verify availability table blocks those dates
2. Cancel the booking → verify availability table unblocks those dates
3. Trigger a PMS sync → verify calendar updates within seconds
4. Open same property in two browser tabs → verify both update simultaneously

## Expected Outcome

1. Local booking changes immediately reflected in availability
2. PMS sync continues to be the primary source of truth
3. Real-time updates propagate to all connected clients
4. No more stale blocks accumulating in the database
