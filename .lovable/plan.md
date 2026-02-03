
# Tokeet API Date Interpretation - FINDINGS

## Discovery Summary

After investigation, we found that **Tokeet has TWO different data sources that don't align**:

### 1. Availability API (`/rental/{id}/availability`)
- Returns calendar blocked ranges with guest names in `title` field
- **Shows dates that are OFF by 1 day** (e.g., James shows `Feb 10-11` instead of `Feb 11-14`)
- Contains ALL calendar blocks including OTA bookings, manual blocks, etc.

### 2. Inquiry API (`/inquiry`)
- Returns actual booking/inquiry records with accurate `arrive`/`depart` timestamps
- Has correct dates using Unix timestamps
- **Does NOT contain all the same bookings as Availability API**
- Only contains inquiries that came through Tokeet's inquiry system

## Root Cause

The "James" booking visible in the Availability API (with wrong dates) is likely:
- A **manually created block** in Tokeet
- An **iCal import** from another platform
- A **legacy booking** that doesn't have an inquiry record

The Inquiry API only returns bookings that originated as Tokeet inquiries, not manual calendar blocks.

## Current Implementation

The sync now uses:
1. **Inquiry API** for booking data with accurate dates (when available)
2. **Availability API** for calendar blocking (all dates)

This means:
- New OTA bookings through Tokeet will have correct dates
- Legacy/manual bookings may still have incorrect dates from Availability API

## Recommended Actions

### Option A: Manual Fix for Legacy Bookings
Delete the legacy bookings with wrong dates in the admin panel, then they will be recreated on next sync:
- Centro House "James" booking (Feb 10-11 → should be Feb 11-14)
- Other legacy bookings with `tokeet-` prefix in external_booking_id

### Option B: Update Dates Directly in Tokeet
Correct the booking dates directly in Tokeet's calendar, then run a sync.

### Option C: Query Fix (if Tokeet has the data)
The Tokeet calendar may be using a different timezone setting. Check:
1. Tokeet account timezone settings
2. Whether dates in Tokeet UI match what the API returns

## Technical Notes

- Inquiry API uses `guest_arrive`/`guest_depart` (Unix timestamps in seconds)
- Availability API uses `from`/`to` (date strings)
- Status field uses `"accept"` for confirmed bookings, not `"booked"` or `"confirmed"`
