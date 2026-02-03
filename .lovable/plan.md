

# Implementation Plan: Stripe Booking Completion & Real-Time Calendar Sync

## Summary

After analyzing the codebase and backend logs, I've identified two separate issues that need to be addressed:

1. **Stripe Booking Issue**: The edge functions are correctly deployed and working. Testing shows `create-payment-intent` is responding properly. The issue may be intermittent or related to the client-side flow.

2. **PMS Calendar Sync Issue**: The `pms-sync-cron` function is failing for 19 out of 20 properties due to a database constraint error: "duplicate key value violates unique constraint 'availability_property_id_date_key'". This means calendar availability is not being properly synchronized.

---

## Part 1: Stripe Payment Flow Improvements

### Current State
- Edge functions `create-payment-intent` and `confirm-payment` are deployed and responding
- Stripe secret key is configured
- The payment flow in `Checkout.tsx` is correctly implemented

### Proposed Changes

#### 1.1 Add Better Error Handling & Retry Logic
Add more robust error handling to the checkout page to catch and recover from transient network failures:

**File: `src/pages/Checkout.tsx`**
- Add retry logic for edge function calls
- Improve error messages to be more specific
- Add a "Try Again" button when payment setup fails
- Add loading state visibility improvements

#### 1.2 Add Connection Health Check
Create a pre-flight check that verifies Stripe connectivity before users reach the payment step:

**File: `src/hooks/useStripeHealth.ts`** (new file)
- Lightweight check to verify edge function availability
- Can be called when checkout page loads
- Provides early warning if backend is unreachable

---

## Part 2: PMS Calendar Sync Fix (Critical)

### Root Cause
The `pms-sync-cron` function uses `INSERT` after `DELETE`, but there's a race condition where some records may not be fully deleted before the insert happens, causing the unique constraint violation.

### Current Flow (Broken)
```text
1. DELETE availability records for date range
2. INSERT new blocked dates
   ↳ Fails if DELETE didn't complete or concurrent process exists
```

### Proposed Fix
Change the sync strategy to use proper `UPSERT` operations instead of DELETE + INSERT.

**File: `supabase/functions/pms-sync-cron/index.ts`**
```text
Current (line 120-137):
  - Delete all records then insert

Proposed:
  - Use UPSERT with ON CONFLICT clause
  - Set available=true for dates NOT in blocked list
  - Set available=false for blocked dates
  - Single atomic operation, no race conditions
```

#### 2.1 Updated Sync Strategy
```text
1. Fetch blocked date ranges from Tokeet
2. Build complete availability map for 12 months:
   - Blocked dates → available: false
   - Non-blocked dates → available: true (optional, can skip)
3. Use UPSERT with ON CONFLICT (property_id, date) DO UPDATE
4. No DELETE operations needed
```

---

## Part 3: Real-Time Availability Updates

### Current State
Real-time subscriptions are already implemented via:
- `useRealtimeAvailability` hook (subscribes to `availability`, `bookings`, `checkout_holds`)
- `useRealtimeBookings` hook (subscribes to admin booking changes)

### Proposed Enhancements

#### 3.1 Ensure Realtime is Enabled for Availability Table
The availability table needs to be added to the Supabase realtime publication.

**Database Migration:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
```

#### 3.2 Live Availability Preview Widget
Create a visual component that shows real-time calendar updates:

**File: `src/components/booking/LiveAvailabilityBadge.tsx`** (new file)
- Shows "Live" indicator with pulse animation
- Displays last sync timestamp
- Optional: Shows "Updating..." when sync is in progress

#### 3.3 Admin Dashboard Sync Status
Enhance admin visibility into PMS sync health:

**File: `src/pages/admin/AdminDashboard.tsx`**
- Add sync status card showing last successful sync
- Show error count if syncs are failing
- Quick action to trigger manual sync

---

## Implementation Steps

### Phase 1: Fix Critical PMS Sync (Highest Priority)
1. Update `pms-sync-cron` to use UPSERT instead of DELETE + INSERT
2. Deploy the updated edge function
3. Verify sync runs complete without errors

### Phase 2: Enable Real-Time for Availability
1. Add availability table to realtime publication
2. Verify existing `useRealtimeAvailability` hook works correctly
3. Test that calendar updates when PMS sync runs

### Phase 3: Stripe Flow Improvements
1. Add retry logic to checkout payment flow
2. Create health check hook
3. Improve error messaging

### Phase 4: Visual Enhancements
1. Add live availability indicator to calendar
2. Enhance admin sync monitoring
3. Add manual sync trigger in admin

---

## Technical Details

### Files to Modify:
1. `supabase/functions/pms-sync-cron/index.ts` - Fix upsert logic
2. `src/pages/Checkout.tsx` - Add retry logic and better errors
3. `src/pages/admin/AdminDashboard.tsx` - Add sync status visibility
4. Database migration - Enable realtime for availability table

### Files to Create:
1. `src/hooks/useStripeHealth.ts` - Pre-flight check for Stripe
2. `src/components/booking/LiveAvailabilityBadge.tsx` - Visual indicator

### Testing Strategy:
1. Trigger manual PMS sync and verify no errors in logs
2. Make a test booking through checkout to confirm Stripe flow
3. Verify calendar shows real-time blocked dates after sync

---

## Expected Outcomes

After implementation:
- PMS availability sync will complete successfully for all 20 properties (currently failing for 19)
- Calendar will reflect accurate blocked dates from Tokeet/AdvanceCM
- Stripe payment flow will have better error recovery
- Users will see visual confirmation that availability data is live
- Admin will have visibility into sync health

