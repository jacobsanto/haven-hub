

# Comprehensive PMS Sync Audit & Fix Plan

## Critical Issues Found

### Issue 1: Invalid sync_type Value
**Location:** `pms-sync-cron/index.ts` line 472
**Problem:** The code uses `sync_type: "availability_bookings"` but the database constraint only allows: `full`, `property`, `availability`, `rates`, `booking`
**Impact:** Sync run records fail to create, which breaks tracking but doesn't stop the sync itself

### Issue 2: Booking Sync Not Working - Wrong API Endpoint
**Location:** `pms-sync-cron/index.ts` lines 98-106
**Problem:** The booking sync uses Tokeet's `/inquiry` API which is for reservations/inquiries. However, the availability data already contains the booking information (guest names, dates) from the `/rental/{id}/availability` endpoint. The inquiry API may be returning different data or the status filtering is too strict.
**Impact:** 0 bookings are ever created from PMS - the logs confirm "0 bookings created, 0 updated" on every sync

### Issue 3: Booking Sync Date Range Only 6 Months
**Location:** `pms-sync-cron/index.ts` lines 98-103
**Problem:** Booking sync only looks 6 months ahead, while availability sync looks 12 months
**Impact:** Inconsistent data between availability blocks and booking records

### Issue 4: Inquiry API Status Filtering May Be Too Strict  
**Location:** `pms-sync-cron/index.ts` lines 120-124
**Problem:** The code filters for status `booked`, `confirmed`, or `instant` but Tokeet may use different status values
**Impact:** Bookings may be filtered out incorrectly

---

## Root Cause Analysis

The availability data from Tokeet's `/rental/{id}/availability` endpoint actually contains:
```json
[
  {"from":"2026-02-03", "to":"2026-02-04", "title":"STELLA", "available":1},
  {"from":"2026-02-14", "to":"2026-03-17", "title":"Manoj Katwal", "available":1},
  {"from":"2026-03-19", "to":"2026-03-29", "title":"Stanislav Natov", "available":1}
]
```

This IS the booking data! The `title` field contains the guest name. The current architecture uses TWO separate APIs:
1. `/rental/{id}/availability` → Get blocked date ranges (working)  
2. `/inquiry` → Get booking details (NOT working - returns no matching records)

**The fix should extract booking data directly from the availability response** since it already contains guest names and date ranges.

---

## Solution Architecture

### Phase 1: Fix Immediate Issues

1. **Fix sync_type constraint** - Use valid value `availability` or add `availability_bookings` to allowed values
2. **Extend booking sync range to 12 months** - Match availability range  
3. **Add debug logging for inquiry API** - Understand why no bookings are found

### Phase 2: Improve Booking Extraction

Since the availability API already contains booking info (guest name in `title` field), we should:
1. Extract booking records directly from availability response
2. Use the `/inquiry` API as a secondary source for additional details (email, phone, price)
3. Cross-reference both sources for complete booking records

---

## Technical Changes

### File: `supabase/functions/pms-sync-cron/index.ts`

```text
CHANGE 1: Fix sync_type (line 472)
- Before: sync_type: "availability_bookings"
- After:  sync_type: "availability"

CHANGE 2: Extend booking sync to 12 months (lines 101-103)
- Before: endDate.setMonth(endDate.getMonth() + 6)
- After:  endDate.setMonth(endDate.getMonth() + 12)

CHANGE 3: Add debug logging for inquiry API response (after line 113)
+ console.log(`Property ${propertyId}: Inquiry API response:`, JSON.stringify(responseData).substring(0, 500));

CHANGE 4: Extract bookings from availability response
Create new function that parses the availability response to:
- Extract guest name from `title` field
- Create booking records for ranges with `available: 1` and non-empty `title`
- Use pkey/id from availability record as external_booking_id

CHANGE 5: Improve inquiry status filtering (lines 120-124)
- Add more status values: "reserved", "accepted", "pending"
- Log filtered vs total inquiry counts for debugging
```

### Database Migration (if needed)
Option A: Add `availability_bookings` to allowed sync_type values
```sql
ALTER TABLE pms_sync_runs 
DROP CONSTRAINT pms_sync_runs_sync_type_check;

ALTER TABLE pms_sync_runs 
ADD CONSTRAINT pms_sync_runs_sync_type_check 
CHECK (sync_type = ANY (ARRAY['full', 'property', 'availability', 'rates', 'booking', 'availability_bookings']));
```

---

## Expected Outcome

After the fix:
1. **All 20 properties** sync availability for the next **12 months**
2. **Booking records** are created from PMS data with guest names, dates, and source (Airbnb, Booking.com, etc.)
3. **Sync runs** are properly recorded in `pms_sync_runs` for monitoring
4. **Calendar shows accurate availability** matching what you see in Tokeet

---

## Testing Steps

1. Deploy the fixed edge function
2. Trigger manual sync from Admin > PMS Health
3. Check `pms_sync_runs` table for successful record creation
4. Verify `bookings` table has new records with `external_booking_id`
5. Compare Centro House March calendar with Tokeet to confirm accuracy
6. Repeat for 2-3 other properties to ensure consistency

