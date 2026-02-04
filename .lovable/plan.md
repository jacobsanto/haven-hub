

# Fix: PMS Sync "Sync Now" Button Error

## Problem
When clicking "Sync Now" on the admin dashboard, you get "Failed to send a request to the Edge Function". This is a **CORS configuration issue** in the `pms-sync-cron` edge function.

---

## Root Cause

The edge function's CORS headers don't include all headers that the Supabase JS client sends from the browser:

**Current (incomplete):**
```text
authorization, x-client-info, apikey, content-type
```

**What the browser sends:**
```text
x-supabase-client-platform: macOS
x-supabase-client-platform-version: ...
x-supabase-client-runtime: ...
x-supabase-client-runtime-version: ...
```

The browser's preflight (OPTIONS) request fails because these headers aren't allowed, blocking the actual POST request.

---

## Evidence

| Test | Result |
|------|--------|
| Server-side call (my test) | Success - synced 37 events, 101 blocked days |
| Browser call (your click) | Failed with "Failed to fetch" |
| Network log | Shows `Error: Failed to fetch` |
| Edge function logs | Shows successful cron runs but no record of browser calls |

---

## Solution

Update the CORS headers in `supabase/functions/pms-sync-cron/index.ts` to match the working `advancecm-sync` function.

### File to Modify

| File | Change |
|------|--------|
| `supabase/functions/pms-sync-cron/index.ts` | Update CORS headers (lines 7-11) |

### Code Change

```typescript
// FROM (broken)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// TO (fixed)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

## After the Fix

- The "Sync Now" button will work correctly
- Manual syncs from the dashboard will trigger immediately
- Scheduled 5-minute syncs will continue working (already works)
- iCal availability data will sync properly

---

## Files Changed

| Action | File |
|--------|------|
| Modify | `supabase/functions/pms-sync-cron/index.ts` (1 line change) |

---

## Technical Note: Why Keep This Feature?

The PMS Sync card is **core operational infrastructure** for Haven Hub:
- Pulls availability from Tokeet via iCal feeds
- Prevents double-bookings by blocking booked dates
- Runs automatically every 5 minutes
- "Sync Now" allows immediate manual sync when needed

Without it, your property calendars would not reflect external bookings (Airbnb, Booking.com, etc.), risking overbookings.

