

# Plan: Daily Booking Reconciliation Sync

## Overview

Build a system that fetches all active bookings from Tokeet daily (via AdvanceCM's Time-based Event trigger) and reconciles them with Haven Hub's local booking records, detecting and applying date modifications.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     DAILY RECONCILIATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AdvanceCM                       Haven Hub Backend              │
│  ┌──────────────┐               ┌──────────────────┐           │
│  │ Time-based   │   HTTP POST   │  pms-reconcile   │           │
│  │ Event        │──────────────>│  Edge Function   │           │
│  │ (Daily 2AM)  │  with payload │                  │           │
│  └──────────────┘               └────────┬─────────┘           │
│                                          │                      │
│                                          ▼                      │
│                                 ┌──────────────────┐           │
│                                 │ Fetch Tokeet     │           │
│                                 │ /v1/inquiry      │           │
│                                 │ (active/booked)  │           │
│                                 └────────┬─────────┘           │
│                                          │                      │
│                                          ▼                      │
│                                 ┌──────────────────┐           │
│                                 │ Compare with     │           │
│                                 │ local bookings   │           │
│                                 │ by external_id   │           │
│                                 └────────┬─────────┘           │
│                                          │                      │
│                    ┌─────────────────────┼─────────────────────┐
│                    │                     │                     │
│              ┌─────▼─────┐        ┌──────▼─────┐       ┌──────▼──────┐
│              │ New       │        │ Modified   │       │ Cancelled   │
│              │ Bookings  │        │ Dates      │       │ (missing)   │
│              │ → INSERT  │        │ → UPDATE   │       │ → UPDATE    │
│              └───────────┘        └────────────┘       └─────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Part 1: New Edge Function (`pms-reconcile`)

Create a new edge function specifically for daily booking reconciliation.

**Location:** `supabase/functions/pms-reconcile/index.ts`

**Authentication:** URL token-based (same pattern as `pms-webhook`) since this is called from AdvanceCM automation.

**Core Logic:**

1. **Validate Request**
   - Verify webhook token from URL query param
   - Parse optional rental filter from payload

2. **Fetch Active Bookings from Tokeet**
   - Call `GET /v1/inquiry?status=booked&status=confirmed` (Tokeet API)
   - Filter to only include bookings with check-out >= today (active/upcoming)
   - Group by rental_id for efficient processing

3. **Load Local Bookings for Comparison**
   - Query bookings with `status = 'confirmed'` and `external_booking_id IS NOT NULL`
   - Filter to check_out >= today
   - Build lookup map by external_booking_id

4. **Detect Changes**
   - **Modifications**: Same external_id but different check_in or check_out
   - **New Bookings**: External_id exists in Tokeet but not locally (create)
   - **Cancellations**: External_id exists locally but missing from Tokeet active list

5. **Apply Updates**
   - Update booking records with new dates
   - Recalculate nights
   - Re-sync availability for affected properties (release old dates, block new dates)
   - Log all changes to `pms_raw_events` for audit trail

6. **Return Summary**
   - Count of checked, modified, created, cancelled bookings
   - Any errors encountered

**Key Considerations:**

| Concern | Solution |
|---------|----------|
| Rate limiting | Process in batches of 50 bookings |
| Tokeet API pagination | Handle `offset` and `limit` params |
| Partial failures | Continue processing, collect errors |
| Idempotency | Use external_booking_id as primary key |
| Audit trail | Log all changes to pms_raw_events |

---

### Part 2: Tokeet API Endpoints Used

**Fetching Inquiries (Bookings):**
```text
GET https://capi.tokeet.com/v1/inquiry?account={account_id}
  &status=booked
  &status=confirmed
  &from={today}
  &to={12_months_future}
```

**Response Structure:**
```json
{
  "data": [
    {
      "pkey": "inquiry-id-123",
      "rental_id": "property-id-abc",
      "check_in": "2026-03-15",
      "check_out": "2026-03-22",
      "status": "booked",
      "guest": { "name": "...", "email": "..." },
      "source": "Airbnb"
    }
  ]
}
```

---

### Part 3: Config.toml Update

Add the new function with JWT verification disabled (token-based auth):

```toml
[functions.pms-reconcile]
verify_jwt = false
```

---

### Part 4: AdvanceCM Configuration

**Payload Template ("Haven Hub - Daily Reconciliation Trigger"):**
```json
{
  "event": "reconciliation.daily",
  "triggered_at": "*|NOW|*"
}
```

**Automation Configuration:**

| Setting | Value |
|---------|-------|
| **Event** | Time-based Event |
| **Schedule** | Daily at 02:00 (low traffic period) |
| **Action** | Send HTTP Request |
| **Recipient URL** | `https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-reconcile?token=hh_wh_K7mR2pN9sT4vX6wY8zA3bC5dE` |
| **Template** | Haven Hub - Daily Reconciliation Trigger |

---

### Part 5: Changes Applied

**Bookings Table Updates:**
When date modifications are detected, the function will:
- Update `check_in` and `check_out` columns
- Recalculate `nights` based on new dates
- Set `pms_synced_at` to current timestamp
- Add note to `special_requests` documenting the modification

**Availability Table Updates:**
- Delete old blocked dates for the original date range
- Insert new blocked dates for the modified date range
- This ensures calendar accuracy after modifications

---

### Part 6: Admin UI Enhancement (Optional)

Add a "Run Reconciliation" button to the PMS Health page that manually triggers the reconciliation process. This would:
- Call the `pms-reconcile` function directly
- Show progress and results
- Be useful for debugging or after resolving issues

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/pms-reconcile/index.ts` | Create | New edge function for reconciliation |
| `supabase/config.toml` | Modify | Add pms-reconcile function config |
| `src/hooks/useAdminPMSHealth.ts` | Modify | Add hook for manual reconciliation trigger |
| `src/pages/admin/AdminPMSHealth.tsx` | Modify | Add UI button for manual reconciliation |

---

## Technical Notes

1. **Same Token**: Reuses the existing `PMS_WEBHOOK_TOKEN` secret for authentication consistency.

2. **Performance**: The reconciliation runs against all active bookings across all properties. For large portfolios, this may take 30-60 seconds.

3. **Failure Handling**: If the daily automation fails, the 5-minute availability sync still runs, preventing double-bookings. Reconciliation is for metadata accuracy (dates on booking records).

4. **No Retry from AdvanceCM**: If the endpoint is down, the reconciliation is skipped for that day. The next day's run will catch up.

5. **Logging**: All detected changes are logged to `pms_raw_events` with event_type `reconciliation.modification`, `reconciliation.creation`, or `reconciliation.cancellation`.

