

# Plan: Fix PMS Availability Sync Logic

## Problem Summary
The availability calendar is showing **all dates as blocked** for Centro House because:

1. **The Tokeet API returns `available: 1` for BOOKED date ranges** (counterintuitive naming)
2. **The sync correctly marks booking dates as blocked** (this part works)
3. **The unblock/cleanup logic is failing** — dates that are NOT in any booking should be deleted from the `availability` table (to show as available), but they remain as `available: false`

### Evidence
- Tokeet API shows bookings: Feb 3-4, Feb 10-11, Feb 14+ (with guest names)
- Database shows ALL dates Feb 3-28 as blocked (including gaps like Feb 5-9, Feb 12-13)
- The cleanup logic at lines 312-339 should delete dates not in current bookings, but it's not working

---

## Root Cause Analysis

Looking at the sync function in `pms-sync-cron/index.ts`:

```text
Current Cleanup Logic (lines 312-339):
1. Fetch existing blocked dates from DB
2. Filter to find dates NOT in current blockedDates set  
3. Delete those dates using .in(date, datesToUnblock)

Problem: The .in() query might be failing silently on large arrays,
or the date comparison is failing due to format differences.
```

---

## Solution

### 1. Fix Date Comparison Issue
The `blockedDates` Set uses ISO format (`2026-02-05`) but Supabase might return dates in a different format. Add proper date normalization.

### 2. Improve Cleanup Reliability  
Instead of using `.in()` with a potentially large array, batch the deletions in smaller chunks or use a different approach:

```typescript
// Instead of:
await adminClient.from("availability").delete().in("date", datesToUnblock);

// Use batched deletes or DELETE WHERE NOT IN approach:
// Delete all blocked dates in range that are NOT in the current booking dates
```

### 3. Add Debug Logging
Log the number of dates being unblocked to verify the cleanup is executing.

---

## Technical Changes

### File: `supabase/functions/pms-sync-cron/index.ts`

**Changes to `syncPropertyAvailability` function:**

1. **Normalize date formats** before comparison:
```typescript
const normalizeDate = (d: string) => d.split('T')[0];
const datesToUnblock = existingBlocked
  .map((r) => normalizeDate(r.date))
  .filter((d) => !blockedDates.has(d));
```

2. **Batch delete operations** to avoid query limits:
```typescript
// Delete in batches of 100
const BATCH_SIZE = 100;
for (let i = 0; i < datesToUnblock.length; i += BATCH_SIZE) {
  const batch = datesToUnblock.slice(i, i + BATCH_SIZE);
  await adminClient.from("availability").delete()
    .eq("property_id", propertyId)
    .in("date", batch);
}
```

3. **Add logging** for visibility:
```typescript
console.log(`Property ${propertyId}: ${blockedDates.size} blocked, ${datesToUnblock.length} to unblock`);
```

---

## Additional Fix: Clear All Stale Blocked Dates

A one-time cleanup is needed for Centro House to reset its availability. This can be done by:

1. Delete all `available: false` records for Centro House
2. Trigger a fresh sync to repopulate only the actual booking dates

```sql
-- Cleanup query (run once)
DELETE FROM availability 
WHERE property_id = '73c9e26e-9f09-4989-b3ab-00b0c7685848' 
AND available = false;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/pms-sync-cron/index.ts` | Fix date normalization, batch deletes, add logging |

---

## Expected Outcome After Fix

1. **Booking dates show as blocked** (red): Feb 3-4, Feb 10-11, Feb 14-Mar 17, etc.
2. **Gap dates show as available** (green): Feb 5-9, Feb 12-13, etc.
3. **Calendar accurately reflects Tokeet availability**

---

## Testing Steps

1. Run the cleanup SQL to reset Centro House availability
2. Deploy the fixed edge function
3. Trigger a manual sync from Admin PMS Health
4. Verify the calendar shows correct blocked/available dates
5. Compare with Tokeet calendar to ensure accuracy

