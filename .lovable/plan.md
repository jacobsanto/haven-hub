
# Plan: Add Booking Import to PMS Availability Sync

## Problem Identified
Currently, the scheduled PMS sync (`pms-sync-cron`) only imports **availability blocks** from Tokeet. While this correctly blocks dates in calendars, it doesn't create actual booking records for OTA bookings. This means:

- Dates appear blocked but you don't know why
- No guest information is visible for external bookings
- No booking records for revenue tracking or management
- Admin must manually trigger reconciliation to import bookings

## Solution
Integrate booking import into the scheduled availability sync so that when blocked date ranges are detected, the system also fetches and imports the corresponding booking/inquiry records from Tokeet.

---

## Implementation Approach

### 1. Enhance pms-sync-cron Edge Function
Modify the existing scheduled sync to also fetch and import bookings:

```text
Current Flow:
  [Cron Trigger] → Fetch Availability → Upsert Blocked Dates → Done

New Flow:
  [Cron Trigger] → Fetch Availability → Upsert Blocked Dates 
                 → Fetch Inquiries → Create/Update Bookings → Done
```

### 2. Add Booking Fetch Logic
For each mapped property, after syncing availability:
- Call Tokeet's `/inquiry` endpoint with the property's rental_id
- Filter for `status = booked` or `status = confirmed`
- For each inquiry not already in local DB, create a booking record
- For existing bookings, update dates if changed (like reconciliation does)

### 3. Optimize for Performance
To avoid hitting compute limits:
- Only fetch inquiries for the next 6 months
- Process one property at a time (already done for availability)
- Skip properties that were recently synced (within last hour)
- Batch database operations where possible

---

## Technical Changes

### File: `supabase/functions/pms-sync-cron/index.ts`

Add a new helper function `syncPropertyBookings` that:
1. Fetches inquiries from Tokeet for the property
2. Filters to active bookings only
3. Upserts booking records (using external_booking_id for deduplication)
4. Updates availability for booking date ranges

Modify `syncPropertyAvailability` to also call `syncPropertyBookings` after syncing availability.

### New Sync Summary
The sync result will now include:
- `synced` (properties with successful availability sync)
- `failed` (properties with errors)
- `bookingsCreated` (new OTA bookings imported)
- `bookingsUpdated` (existing bookings with date changes)

---

## Data Flow Diagram

```text
┌─────────────────────┐
│  pg_cron (5 min)    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   pms-sync-cron     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  For each mapped property:          │
│                                     │
│  1. Fetch /rental/{id}/availability │
│     └─► Upsert blocked dates        │
│                                     │
│  2. Fetch /inquiry?rental_id={id}   │ ◄── NEW
│     └─► Filter booked/confirmed     │
│     └─► Upsert booking records      │
│     └─► Update availability dates   │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Update sync status │
│  & timestamps       │
└─────────────────────┘
```

---

## Booking Record Creation

When a new Tokeet inquiry is found:

| Haven Hub Field | Tokeet Source |
|-----------------|---------------|
| external_booking_id | inquiry.pkey |
| property_id | via pms_property_map lookup |
| check_in | inquiry.arrive (unix timestamp) |
| check_out | inquiry.depart (unix timestamp) |
| nights | calculated |
| guest_name | inquiry.guest_name |
| guest_email | inquiry.guest_email |
| guest_phone | inquiry.guest_phone |
| guests | inquiry.num_guests |
| adults | inquiry.num_adults |
| children | inquiry.num_child |
| total_price | inquiry.booked_price |
| source | inquiry.source (mapped to booking_com/airbnb/etc) |
| status | "confirmed" |
| payment_status | "paid" (OTA bookings are prepaid) |
| pms_sync_status | "synced" |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/pms-sync-cron/index.ts` | Add `syncPropertyBookings` function and integrate with existing sync flow |

---

## Benefits After Implementation

1. **Complete Visibility**: All OTA bookings appear in Admin Bookings page
2. **Real-Time Sync**: Bookings imported every 5 minutes (or on manual trigger)
3. **I DONT WANT Revenue Tracking**: Accurate booking revenue data from all channels
4. **Guest Information**: Guest details available for all external bookings
5. **Unified Calendar**: Calendar shows blocked dates with associated booking info

---

## Fallback Behavior

- If Tokeet inquiry API fails, availability sync still completes successfully
- Booking import errors are logged but don't block availability updates
- Duplicate bookings are prevented via `external_booking_id` matching
