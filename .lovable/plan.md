

# Plan: Fix Availability Calendar Alignment with Bookings

## Problem Summary

The availability calendars in the booking engine are not correctly aligned with actual bookings due to **multiple interconnected issues**:

### Issue 1: Off-by-One Error in PMS Sync (Root Cause)
**Location:** `supabase/functions/pms-sync-cron/index.ts` lines 323-328

The sync loop blocks the checkout date when it shouldn't:
```typescript
// Current (WRONG):
for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
  blockedDates.add(d.toISOString().split("T")[0]);
}

// Example: Booking Feb 3 → Feb 4 blocks BOTH Feb 3 AND Feb 4
// Should only block Feb 3 (checkout day is available for new check-ins)
```

**Evidence from database:**
- STELLA's booking: check_in Feb 3, check_out Feb 4 → Feb 4 is blocked (WRONG)
- James's booking: check_in Feb 10, check_out Feb 11 → Feb 11 is blocked (WRONG)

### Issue 2: Frontend Calendar Data Flow
The booking engine calendars use `useAvailabilityCalendar` hook which reads from the `availability` table. The logic is:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Tokeet PMS  ──sync──▶  availability table  ◀──read──  AvailabilityCalendar │
│                              │                                           │
│                              │                                           │
│                        bookings table (NOT used by calendar)             │
└─────────────────────────────────────────────────────────────────────────┘
```

The calendar **does not** directly reference the `bookings` table. It only reads from `availability`. This means:
1. PMS sync must be accurate
2. Any locally-created bookings must also update the `availability` table

### Issue 3: Local Bookings Don't Block Availability
When a booking is created directly through the website, it adds to the `bookings` table but **does NOT automatically create corresponding `availability` records**.

The `useCheckDateRangeAvailability` hook (lines 113-158 in `useCheckoutFlow.ts`) checks BOTH tables, but the calendar display only uses the `availability` table.

---

## Solution Architecture

### Fix 1: Correct the PMS Sync Date Range Loop
Change the loop condition from `<=` to `<` for the end date:

```typescript
// FIXED: Don't include checkout date in blocked dates
for (let d = new Date(rangeStart); d < rangeEnd; d.setDate(d.getDate() + 1)) {
  blockedDates.add(d.toISOString().split("T")[0]);
}
```

### Fix 2: Update Frontend Calendar to Also Check Bookings Table
Modify `useAvailabilityCalendar` to merge data from BOTH sources:
1. `availability` table (PMS-synced blocks)
2. `bookings` table (local bookings that may not be in PMS yet)

```typescript
// Enhanced logic in useAvailabilityCalendar
const { data: localBookings } = await supabase
  .from('bookings')
  .select('check_in, check_out')
  .eq('property_id', propertyId)
  .in('status', ['pending', 'confirmed'])
  .gte('check_out', startDate)
  .lte('check_in', endDate);

// Merge booking dates into blocked dates
localBookings?.forEach(booking => {
  const start = parseISO(booking.check_in);
  const end = parseISO(booking.check_out);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    // Mark as blocked due to booking
  }
});
```

### Fix 3: Create Trigger to Auto-Update Availability on Booking Insert
Add a database trigger that automatically creates `availability` records when a booking is created:

```sql
CREATE OR REPLACE FUNCTION sync_booking_to_availability()
RETURNS TRIGGER AS $$
DECLARE
  d DATE;
BEGIN
  -- On INSERT or UPDATE: block the booking dates
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Block all dates from check_in to check_out (exclusive)
    FOR d IN SELECT generate_series(NEW.check_in, NEW.check_out - 1, '1 day')::date
    LOOP
      INSERT INTO availability (property_id, date, available)
      VALUES (NEW.property_id, d, false)
      ON CONFLICT (property_id, date) DO UPDATE SET available = false;
    END LOOP;
  END IF;
  
  -- On DELETE or status change to cancelled: unblock dates
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN
    FOR d IN SELECT generate_series(OLD.check_in, OLD.check_out - 1, '1 day')::date
    LOOP
      DELETE FROM availability 
      WHERE property_id = OLD.property_id AND date = d;
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Fix 4: One-Time Data Cleanup
Run a cleanup to fix existing off-by-one errors in the database.

---

## Technical Changes

| File | Change |
|------|--------|
| `supabase/functions/pms-sync-cron/index.ts` | Fix loop: `d <= rangeEnd` → `d < rangeEnd` |
| `src/hooks/useCheckoutFlow.ts` | Add booking table query, merge with availability |
| Database migration | Add trigger for auto-syncing bookings to availability |
| One-time SQL | Clean up incorrectly blocked checkout dates |

---

## Expected Outcome

1. **PMS sync** creates correct blocked dates (check-in to day before check-out)
2. **Local bookings** automatically block their dates via trigger
3. **Calendars** show accurate availability by reading merged data
4. **Check-out dates** remain available for new check-ins

---

## Testing Steps

1. Deploy fixed edge function
2. Run database migration for trigger
3. Execute one-time cleanup SQL
4. Trigger manual PMS sync
5. Verify Centro House Feb 4, Feb 11 are now AVAILABLE
6. Create a test booking and verify calendar updates immediately
7. Compare calendar with Tokeet to confirm full alignment

