

## Automated Bidirectional Availability Sync

This plan implements automated synchronization of availability between the booking engine and PMS (Tokeet/AdvanceCM), including scheduled syncs and event-driven triggers for booking changes on both sides.

---

### Current State

**What exists:**
- Manual "Sync" button per property in Admin PMS Health
- Manual "Sync All Availability" button
- `sync-availability` action in edge function (pulls from PMS to local DB)
- `create-booking` and `cancel-booking` actions (pushes to PMS)
- `pms_sync_status` field on bookings to track sync state

**What's missing:**
- Scheduled automatic sync (every 5 minutes)
- Automatic sync when local booking is created/modified/cancelled
- Webhook handler for when bookings change in PMS
- Retry mechanism for failed syncs

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        BIDIRECTIONAL SYNC                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SCHEDULED SYNC (every 5 min)                                         │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     │
│   │  pg_cron     │────▶│  pms-sync-cron   │────▶│ availability   │     │
│   │  job         │     │  edge function   │     │ table          │     │
│   └──────────────┘     └──────────────────┘     └────────────────┘     │
│                                                                         │
│   LOCAL BOOKING CHANGES                                                 │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     │
│   │  DB trigger  │────▶│  pms-booking-sync│────▶│ Tokeet PMS     │     │
│   │  on bookings │     │  edge function   │     │ (create/cancel)│     │
│   └──────────────┘     └──────────────────┘     └────────────────┘     │
│                                                                         │
│   PMS BOOKING CHANGES (incoming webhooks)                              │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐     │
│   │  Tokeet      │────▶│  pms-webhook     │────▶│ availability   │     │
│   │  webhook     │     │  edge function   │     │ + bookings DB  │     │
│   └──────────────┘     └──────────────────┘     └────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Steps

#### Step 1: Create Scheduled Sync Edge Function

Create a new edge function `pms-sync-cron` that:
1. Fetches all active property mappings
2. Syncs availability for each property from PMS
3. Logs sync run results to `pms_sync_runs` table
4. Can be called by pg_cron or manually

**File:** `supabase/functions/pms-sync-cron/index.ts`

This function will use the service role key (no user auth required for cron jobs).

#### Step 2: Enable pg_cron and Schedule Sync

Create a database migration to:
1. Enable `pg_cron` and `pg_net` extensions
2. Schedule the sync function to run every 5 minutes
3. Store the cron job configuration

**SQL needed:**
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule availability sync every 5 minutes
SELECT cron.schedule(
  'pms-availability-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-sync-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{"action": "sync-all-availability"}'::jsonb
  );
  $$
);
```

#### Step 3: Create Database Trigger for Booking Changes

Create a trigger on the `bookings` table that fires on INSERT, UPDATE, DELETE to:
1. Detect booking status changes (confirmed, cancelled)
2. Call the edge function to sync with PMS
3. Handle the async nature (use pg_net for non-blocking calls)

**Trigger logic:**
- On INSERT with status = 'confirmed' → Push booking to PMS
- On UPDATE where status changes to 'cancelled' → Cancel in PMS
- On DELETE → Cancel in PMS if external_booking_id exists

#### Step 4: Create Webhook Handler Edge Function

Create `pms-webhook` edge function to receive callbacks from Tokeet when:
1. A new booking is made via OTA (Airbnb, Booking.com)
2. A booking is modified in PMS
3. A booking is cancelled in PMS

**File:** `supabase/functions/pms-webhook/index.ts`

This function will:
1. Verify webhook signature (if Tokeet provides one)
2. Parse the booking/availability event
3. Update local `availability` table
4. Optionally create/update local booking record for OTA bookings

#### Step 5: Add Sync Settings to Admin Dashboard

Update Admin PMS Health page with:
1. "Auto Sync" toggle (enable/disable scheduled sync)
2. Sync interval selector (5, 10, 15, 30 minutes)
3. Last scheduled sync timestamp
4. Webhook URL display for configuring in Tokeet

#### Step 6: Add Retry Mechanism for Failed Syncs

Create a retry system for failed PMS syncs:
1. Add `retry_count` and `last_error` columns to track failures
2. Scheduled job to retry failed syncs (max 3 retries)
3. Admin notification for repeated failures

---

### Technical Details

#### New Edge Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `pms-sync-cron` | Scheduled availability pull from PMS | pg_cron every 5 min |
| `pms-webhook` | Handle incoming PMS events | HTTP POST from Tokeet |

#### Database Changes

| Table | Change |
|-------|--------|
| `pms_connections` | Add `auto_sync_enabled` (boolean), `sync_interval_minutes` (integer) |
| `pms_sync_runs` | Add `trigger_type` ('manual', 'scheduled', 'webhook', 'booking') |
| `bookings` | Add `pms_retry_count` (integer), `pms_last_error` (text) |

#### Config.toml Updates

Add new functions to the Supabase config:
```toml
[functions.pms-sync-cron]
verify_jwt = false  # Called by pg_cron, no user token

[functions.pms-webhook]  
verify_jwt = false  # Called by external PMS webhook
```

---

### Sync Flow Details

**Scheduled Sync (Pull):**
```text
1. pg_cron triggers every 5 minutes
2. pms-sync-cron function starts
3. Fetch all property mappings where sync_enabled = true
4. For each property, call Tokeet availability API
5. Parse blocked date ranges
6. Upsert to local availability table
7. Update last_availability_sync_at
8. Log to pms_sync_runs
```

**Local Booking → PMS (Push):**
```text
1. User completes checkout, booking inserted with status='confirmed'
2. DB trigger fires on INSERT
3. Trigger calls pg_net.http_post to advancecm-sync
4. Edge function creates booking in Tokeet
5. Returns external_booking_id
6. Trigger updates booking with external_booking_id, pms_sync_status='synced'
```

**PMS Booking → Local (Webhook):**
```text
1. OTA booking made in Airbnb/Booking.com
2. Tokeet receives booking, sends webhook to our endpoint
3. pms-webhook function parses event
4. Creates local booking record with source='airbnb'/'booking_com'
5. Updates availability table to block those dates
6. Logs event to pms_raw_events
```

---

### Webhook Configuration (For Tokeet)

After implementation, you'll need to configure the webhook URL in Tokeet:
```
https://xavjbiuhcmupsoocrmhf.supabase.co/functions/v1/pms-webhook
```

Events to subscribe to:
- `booking.created`
- `booking.updated`
- `booking.cancelled`
- `availability.updated`

---

### Admin UI Additions

**New Settings Card in PMS Health:**
- Auto-Sync toggle (ON/OFF)
- Sync Interval dropdown (5/10/15/30 minutes)
- Webhook URL (copyable) for Tokeet configuration
- "Test Webhook" button to verify connectivity

**Enhanced Sync History:**
- Show trigger type (manual/scheduled/webhook/booking)
- Filter by trigger type
- Show pending retries count

---

### Error Handling & Monitoring

1. **Failed sync retries**: Auto-retry up to 3 times with exponential backoff
2. **Webhook validation**: Verify Tokeet signature if available
3. **Conflict detection**: Log when local and PMS availability disagree
4. **Admin alerts**: Toast notifications for sync failures in dashboard

---

### Benefits

1. **Always in sync**: Availability updated every 5 minutes automatically
2. **Instant updates**: Local bookings pushed to PMS immediately
3. **OTA coverage**: Bookings from Airbnb/Booking.com reflected in local system
4. **Visibility**: Clear logging of all sync operations and their sources
5. **Resilience**: Retry mechanism handles temporary failures

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/pms-sync-cron/index.ts` | Create |
| `supabase/functions/pms-webhook/index.ts` | Create |
| `supabase/config.toml` | Update (add functions) |
| Database migration | Create (pg_cron, triggers, columns) |
| `src/pages/admin/AdminPMSHealth.tsx` | Update (sync settings UI) |
| `src/hooks/useAdminPMSHealth.ts` | Update (sync settings hooks) |

