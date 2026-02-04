

# iCal-Based Availability Sync Architecture

## Summary

Replace the unreliable Tokeet Availability API with iCal feed parsing for calendar blocking. This is a **massive simplification** that eliminates the date shift bugs entirely.

## Why This Works

The Tokeet iCal feed for Centro House contains **perfectly accurate data**:

| Guest | iCal Dates | Matches Tokeet UI |
|-------|------------|-------------------|
| STELLA (Hold 1) | DTSTART=Feb 4, DTEND=Feb 6 | ✅ Feb 4-5, checkout Feb 6 |
| STELLA (Hold 2) | DTSTART=Feb 5, DTEND=Feb 8 | ✅ Feb 5-7, checkout Feb 8 |
| Craig Stevens (Expedia) | DTSTART=Feb 8, DTEND=Feb 10 | ✅ Feb 8-9, checkout Feb 10 |
| Manoj Katwal (Airbnb) | DTSTART=Feb 14, DTEND=Mar 17 | ✅ Feb 14 - Mar 16, checkout Mar 17 |

**No date shifting needed. No duration bugs. Perfect accuracy.**

---

## New Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     SIMPLIFIED PMS FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ TOKEET API  │     │ iCAL FEEDS  │     │ OUR SYSTEM  │       │
│  │             │     │             │     │             │       │
│  │ Properties  │────▶│ Per-property│────▶│ Availability│       │
│  │   ONLY      │     │ Calendar    │     │   table     │       │
│  └─────────────┘     │ URLs        │     └─────────────┘       │
│                      └─────────────┘                           │
│                                                                 │
│  ┌─────────────┐                        ┌─────────────┐        │
│  │ OUR BOOKING │                        │ TOKEET API  │        │
│  │   ENGINE    │───────────────────────▶│ Create      │        │
│  │             │     (PUSH ONLY)        │ Inquiry     │        │
│  └─────────────┘                        └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. **Import Properties**: Use Tokeet API to fetch property list (KEEP)
2. **Sync Availability**: Parse iCal feeds to get blocked dates (NEW)
3. **Push Bookings**: Use Tokeet API to create bookings from our website (KEEP)
4. **REMOVED**: No more booking import from Tokeet API

---

## Technical Changes

### 1. Database: Add iCal URL to Property Mapping

```sql
ALTER TABLE pms_property_map 
ADD COLUMN ical_url TEXT;
```

Each imported property will store its unique iCal feed URL.

### 2. New Edge Function: `ical-sync`

Create a lightweight edge function that:
- Fetches the iCal feed for a property
- Parses VEVENT blocks to extract blocked dates
- Upserts to availability table

```text
iCal Logic (simple):
- DTSTART = check-in date (block this day)
- DTEND = checkout date (DON'T block - guest leaves)
- Block all dates from DTSTART to DTEND-1
```

### 3. Update `pms-sync-cron`

Replace the Tokeet Availability API calls with iCal parsing:
- Loop through properties with iCal URLs
- Fetch and parse each feed
- Update availability table

### 4. Delete Booking Import Logic

Remove from `pms-sync-cron`:
- `syncBookingsFromInquiryAPI()` function
- All Inquiry API calls
- Booking creation/update logic from PMS

---

## What We Keep

| Feature | Status |
|---------|--------|
| **Property Import** | KEEP - via Tokeet `/rental` API |
| **Property Details** | KEEP - via Tokeet `/rental/{id}` API |
| **Push Bookings to PMS** | KEEP - via Tokeet `/inquiry` POST |
| **Cancel Bookings in PMS** | KEEP - via Tokeet inquiry update |
| **Connection Test** | KEEP - validates API credentials |

## What We Remove

| Feature | Status |
|---------|--------|
| **Import Bookings from PMS** | DELETE - causes data pollution |
| **Availability API Sync** | DELETE - replaced by iCal |
| **Date Shift Corrections** | DELETE - no longer needed |
| **Inquiry API Fetch** | DELETE - not needed for calendar |

---

## Admin UI Changes

### Property Mapping Panel

Add an "iCal URL" field for each mapped property:

```text
┌─────────────────────────────────────────────────────────────┐
│ Centro House                                                │
├─────────────────────────────────────────────────────────────┤
│ External ID: 1646873878.6746                               │
│ iCal URL: https://calendars.tokeet.com/calendar/rental/...  │
│           [Test iCal] [Sync Now]                            │
│ Last Sync: 5 minutes ago ✅                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Migration
- Add `ical_url` column to `pms_property_map`
- Set Centro House URL as test case

### Step 2: Create iCal Parser
- Build simple regex-based VEVENT parser (no library needed)
- Handle `DTSTART;VALUE=DATE:YYYYMMDD` format
- Handle multi-line `DESCRIPTION` fields

### Step 3: Update Sync Cron
- Replace Availability API logic with iCal fetch
- Remove all booking import code
- Simplify error handling

### Step 4: Admin UI
- Add iCal URL field to property mapping form
- Add "Test iCal" button
- Add manual sync trigger

### Step 5: Cleanup
- Remove unused Inquiry API code
- Remove date shift correction logic
- Delete orphaned booking import functions

---

## iCal Parsing Logic (Simple)

```typescript
function parseICalToBlockedDates(icalText: string): Set<string> {
  const blockedDates = new Set<string>();
  
  // Match VEVENT blocks
  const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
  const events = icalText.match(eventRegex) || [];
  
  for (const event of events) {
    // Extract DTSTART (check-in)
    const startMatch = event.match(/DTSTART;VALUE=DATE:(\d{8})/);
    // Extract DTEND (checkout - day guest leaves)
    const endMatch = event.match(/DTEND;VALUE=DATE:(\d{8})/);
    
    if (startMatch && endMatch) {
      const startDate = parseICalDate(startMatch[1]); // 20260204 -> 2026-02-04
      const endDate = parseICalDate(endMatch[1]);     // 20260206 -> 2026-02-06
      
      // Block from start to end-1 (checkout day is available)
      for (let d = new Date(startDate); d < new Date(endDate); d.setDate(d.getDate() + 1)) {
        blockedDates.add(d.toISOString().split('T')[0]);
      }
    }
  }
  
  return blockedDates;
}
```

---

## Benefits of This Approach

| Before (API) | After (iCal) |
|--------------|--------------|
| Date shift bugs | No bugs - standard format |
| Missing bookings (Craig Stevens) | All events included |
| Wrong durations | Accurate durations |
| Complex cross-referencing | Simple parsing |
| 500+ lines of sync code | ~100 lines |
| API quirk workarounds | None needed |

---

## Risk Mitigation

1. **iCal URL per property**: Each Tokeet property has a unique iCal URL - need admin to paste it
2. **Feed reliability**: iCal is a standard - if Tokeet breaks it, all their customers complain
3. **Sync frequency**: Same 5-minute cron, just different data source
4. **Fallback**: Keep API code disabled (not deleted) for 2 weeks as safety net

---

## Questions Resolved

1. ✅ **Should we use iCal for blocked dates?** Yes - it has perfect data
2. ✅ **Should we remove booking import?** Yes - we don't need OTA booking details
3. ✅ **Should we keep property import?** Yes - still useful for onboarding
4. ✅ **Should we keep booking push?** Yes - critical for our direct bookings

---

## Files to Modify

1. `supabase/functions/pms-sync-cron/index.ts` - Replace Availability API with iCal parsing
2. `src/components/admin/PMSPropertyImportDialog.tsx` - Add iCal URL input
3. `src/pages/admin/AdminPMSHealth.tsx` - Show iCal URLs, add test button
4. Database migration - Add `ical_url` column

## Files to Create

1. `supabase/functions/ical-sync/index.ts` (optional - could be part of pms-sync-cron)

## Code to Delete

1. `syncBookingsFromInquiryAPI()` function
2. All Inquiry API fetch logic
3. Date shift correction code
4. Booking creation from PMS sync

