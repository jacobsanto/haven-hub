

## PMS Availability Sync Implementation Plan

This plan connects the PMS availability (Tokeet/AdvanceCM) to the booking engine so that the calendar reflects real availability from your source of truth.

---

### Current State

**What exists:**
- Edge function `advancecm-sync` with `fetch-availability` action that calls Tokeet API
- `AdvanceCMAdapter.fetchAvailability()` that calls the edge function
- Local `availability` table in the database
- `useAvailabilityCalendar` hook that reads availability data

**The gap:**
- No mechanism to sync PMS availability to the local database
- Booking calendar uses mock adapter, not the real AdvanceCM adapter
- No scheduled or manual sync for availability data

---

### Implementation Steps

#### Step 1: Add `sync-availability` Action to Edge Function

Extend `advancecm-sync/index.ts` to add a new action that:
1. Fetches availability from Tokeet for a specific property
2. Writes/upserts the data to the local `availability` table
3. Returns sync statistics

**New action logic:**
- Fetch availability from Tokeet API: `/rental/{pkey}/availability?from={start}&to={end}`
- For each date received, upsert to the `availability` table
- Mark dates as `available: false` where Tokeet says blocked/booked

#### Step 2: Create Availability Sync Hook

Add a new hook `useSyncPropertyAvailability` in `useAdvanceCMSync.ts` that:
1. Looks up the `external_property_id` from `pms_property_map`
2. Calls the edge function with `action: 'sync-availability'`
3. Returns success/failure status

#### Step 3: Update Calendar to Use Real Data

Modify `useAvailabilityCalendar` in `useCheckoutFlow.ts` to:
1. Get the `external_property_id` from `pms_property_map` automatically
2. Prioritize reading from the local `availability` table (which is now synced from PMS)
3. Remove dependency on mock adapter for production

#### Step 4: Add Sync Controls to Admin PMS Dashboard

Update the Admin PMS Health page to:
1. Add a "Sync Availability" button per mapped property
2. Add a "Sync All Availability" button for all mapped properties
3. Show last availability sync timestamp per property

#### Step 5: Update Property Map Table

Add `last_availability_sync_at` column to `pms_property_map` table to track when each property's availability was last synced.

---

### Technical Details

**File changes:**

| File | Change |
|------|--------|
| `supabase/functions/advancecm-sync/index.ts` | Add `sync-availability` action that upserts to `availability` table |
| `src/hooks/useAdvanceCMSync.ts` | Add `useSyncPropertyAvailability` hook |
| `src/hooks/useCheckoutFlow.ts` | Auto-lookup `external_property_id` from mapping |
| `src/pages/admin/AdminPMSHealth.tsx` | Add sync availability buttons |
| Database migration | Add `last_availability_sync_at` to `pms_property_map` |

**Edge function sync-availability logic:**

```text
1. Receive: { action: "sync-availability", propertyId, startDate, endDate }
2. Look up external_property_id from pms_property_map
3. Call Tokeet: GET /rental/{pkey}/availability?from={start}&to={end}
4. Parse response - Tokeet returns array of blocked date ranges
5. Generate full date range, mark blocked dates as available: false
6. Upsert to availability table
7. Update pms_property_map.last_availability_sync_at
8. Return { success: true, daysProcessed: N }
```

**Tokeet Availability Response Format:**

```text
The Tokeet API returns blocked/booked periods. The sync logic inverts this:
- All dates default to available: true
- Dates within blocked ranges become available: false
```

---

### Data Flow After Implementation

```text
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Tokeet PMS    │────▶│  sync-availability  │────▶│ availability DB  │
│ (Source of Truth)│     │    edge function    │     │    (synced)      │
└─────────────────┘     └─────────────────────┘     └──────────────────┘
                                                            │
                        ┌───────────────────────────────────┘
                        ▼
              ┌───────────────────┐     ┌──────────────────┐
              │ useAvailability   │────▶│ Booking Calendar │
              │  Calendar hook    │     │    Component     │
              └───────────────────┘     └──────────────────┘
```

---

### Benefits

1. **Single source of truth**: PMS availability is synced to local database
2. **Faster calendar loading**: Reads from local DB instead of calling PMS API per request
3. **Works with realtime**: Local `availability` table changes trigger realtime updates
4. **Admin visibility**: See when each property's availability was last synced
5. **Manual control**: Sync individual properties or all at once from admin dashboard

---

### Future Enhancements (Not in This Plan)

- Scheduled sync via Supabase pg_cron or external scheduler
- Webhook handler for real-time PMS updates
- Conflict detection when local bookings don't match PMS

