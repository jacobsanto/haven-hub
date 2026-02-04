

# Clean Up PMS Booking Import System

## Overview

You want to reset the system to work purely with iCal-based availability sync, removing all remnants of the old API-based booking import system. This involves:

1. **Deleting all PMS-synced bookings** from the database (1,159 bookings across 19 properties)
2. **Removing UI components** related to booking import/reconciliation from the admin dashboard
3. **Cleaning up the availability table** to reset blocked dates (9,377 blocked dates)
4. **Removing reconciliation features** that compare Tokeet API bookings with local records

---

## What Will Be Removed

### Database Data Cleanup
| Table | Action | Count |
|-------|--------|-------|
| `bookings` | Delete all records with `external_booking_id IS NOT NULL` | ~1,159 bookings |
| `availability` | Delete all blocked dates (will be re-synced via iCal) | ~9,377 records |
| `booking_price_breakdown` | Delete orphaned records for deleted bookings | Related records |
| `booking_payments` | Delete orphaned records for deleted bookings | Related records |
| `booking_addons` | Delete orphaned records for deleted bookings | Related records |

### Admin UI Removals

**From `AdminPMSHealth.tsx`:**
- Daily Booking Reconciliation Card (entire component)
- Webhook Tester Card (tests booking.created, booking.cancelled, reconciliation)
- `useTriggerReconciliation` hook usage

**From hooks:**
- `useTriggerReconciliation` function from `useAdminPMSHealth.ts`

**Edge Functions to Update:**
- `pms-reconcile/index.ts` - Can be deleted entirely (only used for booking import)
- `test-pms-webhook/index.ts` - Remove reconciliation test option

### Components to Simplify
- `WebhookTesterCard.tsx` - Remove booking and reconciliation test buttons, keep only for debugging iCal sync

---

## What Will Be Kept

| Component | Purpose |
|-----------|---------|
| Property Import | Import properties from Tokeet API |
| iCal URL Management | Configure and sync availability via iCal feeds |
| Push Bookings to PMS | Send direct bookings to Tokeet after payment |
| Connection Health | Test PMS API connection |
| Sync History | View past sync runs |
| Property Mappings | Map local properties to Tokeet IDs with iCal URLs |

---

## Implementation Steps

### Step 1: Database Cleanup (SQL)
Execute SQL to delete all PMS-imported bookings and reset availability:

```sql
-- Delete related records first (foreign key dependencies)
DELETE FROM booking_price_breakdown 
WHERE booking_id IN (SELECT id FROM bookings WHERE external_booking_id IS NOT NULL);

DELETE FROM booking_payments 
WHERE booking_id IN (SELECT id FROM bookings WHERE external_booking_id IS NOT NULL);

DELETE FROM booking_addons 
WHERE booking_id IN (SELECT id FROM bookings WHERE external_booking_id IS NOT NULL);

DELETE FROM security_deposits 
WHERE booking_id IN (SELECT id FROM bookings WHERE external_booking_id IS NOT NULL);

-- Delete PMS-synced bookings
DELETE FROM bookings WHERE external_booking_id IS NOT NULL;

-- Clear all availability records (will be re-synced via iCal)
DELETE FROM availability;
```

### Step 2: Update AdminPMSHealth.tsx
- Remove the Daily Reconciliation Card section (lines ~300-335)
- Remove the Webhook Tester Card section (lines ~337-349)
- Remove import and usage of `useTriggerReconciliation`
- Update sync description text to reflect iCal-only approach

### Step 3: Update useAdminPMSHealth.ts
- Remove `useTriggerReconciliation` hook function
- Simplify remaining hooks to focus on iCal sync

### Step 4: Update/Remove WebhookTesterCard.tsx
- Remove the component entirely OR simplify to only test iCal sync
- The old webhook tests (booking.created, booking.cancelled, reconciliation) are no longer relevant

### Step 5: Delete Edge Function
- Delete `supabase/functions/pms-reconcile/index.ts` entirely
- Update `supabase/functions/test-pms-webhook/index.ts` to remove reconciliation option

### Step 6: Update PMSSyncStatusPanel.tsx
- Remove references to "Bookings Pull" in the sync status panel
- Keep only "Availability Pull (iCal)" and "Bookings Push"

---

## Post-Cleanup: Fresh Start Workflow

After this cleanup, the admin workflow will be:

1. **Import Properties** from Tokeet (API)
2. **Add iCal URL** for each property in Admin > PMS Health > Property Mappings
3. **Sync Availability** via iCal feeds (automatic every 5 minutes + manual trigger)
4. **Push Bookings** to Tokeet when guests book directly on your website

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/AdminPMSHealth.tsx` | Remove reconciliation card, webhook tester |
| `src/hooks/useAdminPMSHealth.ts` | Remove `useTriggerReconciliation` |
| `src/components/admin/WebhookTesterCard.tsx` | Delete or simplify |
| `src/components/admin/PMSSyncStatusPanel.tsx` | Update to show iCal-only sync |
| `supabase/functions/pms-reconcile/index.ts` | Delete entire function |
| `supabase/functions/test-pms-webhook/index.ts` | Remove reconciliation test |

---

## Risk Mitigation

- **Backup Note**: The deleted bookings are all imports from Tokeet; your direct bookings have `external_booking_id = NULL` and will NOT be affected
- **Availability Recovery**: iCal sync will immediately repopulate blocked dates after cleanup
- **No Data Loss**: All original booking data remains in Tokeet; this cleanup only removes local copies

