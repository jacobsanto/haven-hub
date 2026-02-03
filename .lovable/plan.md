
# Plan: Add PMS Webhook Tester to Admin PMS Health Page

## Summary
Add a built-in "Webhook Tester" card to the Admin PMS Health page that allows you to test all three webhook flows (booking.created, booking.cancelled, and daily reconciliation) directly from the UI without needing external tools like curl.

---

## What Will Be Built

### New Component: WebhookTesterCard
A collapsible card with three test buttons and real-time result display:

1. **Test Booking Created** - Sends a mock `booking.created` payload to pms-webhook
2. **Test Booking Cancelled** - Sends a mock `booking.cancelled` payload to pms-webhook  
3. **Test Daily Reconciliation** - Triggers the pms-reconcile endpoint

Each button will:
- Show a loading spinner while running
- Display success/error result with response details
- Auto-refresh the Webhook Events tab to show the new event

### UI Layout

```text
+--------------------------------------------------+
| 🧪 Webhook Endpoint Tester                       |
|--------------------------------------------------|
| Test your PMS webhook endpoints to verify they   |
| are working correctly before going live.         |
|                                                  |
| Property: [Dropdown: Select a property]          |
|                                                  |
| +----------------+ +------------------+          |
| | Test Booking   | | Test Cancellation|          |
| |   Created ▶    | |      ▶          |          |
| +----------------+ +------------------+          |
|                                                  |
| +------------------+                             |
| | Test Reconcile ▶ |                             |
| +------------------+                             |
|                                                  |
| Last Test Result:                                |
| ✅ booking.created → Success (200)               |
| Response: { "success": true, "booking_id": "..." }|
+--------------------------------------------------+
```

---

## Implementation Details

### 1. New Hook: useWebhookTester (in useAdminPMSHealth.ts)

Add three new mutation hooks:
- `useTestWebhookBookingCreated` - POSTs test payload to pms-webhook with token
- `useTestWebhookBookingCancelled` - POSTs cancellation payload to pms-webhook
- `useTestReconciliation` - (Already exists as `useTriggerReconciliation`)

Both webhook tests will use the PMS_WEBHOOK_TOKEN from secrets via an edge function proxy.

### 2. New Edge Function: test-pms-webhook

Since the frontend cannot access `PMS_WEBHOOK_TOKEN` directly, create a small edge function that:
- Verifies admin auth
- Reads `PMS_WEBHOOK_TOKEN` from secrets
- Forwards the test payload to pms-webhook with the token
- Returns the response

### 3. New Component: WebhookTesterCard.tsx

Features:
- Property selector dropdown (from mapped properties)
- Three test buttons with loading states
- Result display area showing status code, success/failure, and response body
- Automatic query invalidation to refresh webhook events after test

### 4. Update AdminPMSHealth.tsx

Add the new WebhookTesterCard between the Daily Reconciliation card and the Tabs section.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/test-pms-webhook/index.ts` | Create | Admin-only proxy to test webhook endpoints with token |
| `src/components/admin/WebhookTesterCard.tsx` | Create | UI component for testing webhooks |
| `src/hooks/useAdminPMSHealth.ts` | Modify | Add `useTestWebhookEndpoint` mutation hook |
| `src/pages/admin/AdminPMSHealth.tsx` | Modify | Import and render WebhookTesterCard |
| `supabase/config.toml` | Modify | Add config for new edge function |

---

## Technical Notes

### Security
- The test-pms-webhook edge function requires admin authentication
- Token is never exposed to the frontend
- Test payloads use clearly marked test IDs (e.g., `test-booking-{timestamp}`)

### Test Payload Structure

**Booking Created:**
```json
{
  "event": "booking.created",
  "data": {
    "pkey": "test-{timestamp}",
    "rental_id": "{selected_external_property_id}",
    "check_in": "{tomorrow}",
    "check_out": "{tomorrow+3}",
    "guest": { "name": "Test Guest", "email": "test@example.com" },
    "num_adults": 2,
    "total": 500,
    "source": "Test"
  }
}
```

**Booking Cancelled:**
```json
{
  "event": "booking.cancelled",
  "data": {
    "pkey": "{external_booking_id_to_cancel}"
  }
}
```

### Cleanup Note
Test bookings will be created with `source: "test"` and can be identified/deleted from the bookings table if needed.

---

## Expected Outcome

After implementation, you will be able to:
1. Go to Admin > PMS Health
2. Select a property from the dropdown
3. Click "Test Booking Created" and see immediate success/failure feedback
4. Check the Webhook Events tab to see the logged event
5. Click "Test Booking Cancelled" to test cancellation flow
6. Click "Test Reconciliation" to verify the daily sync

This eliminates the need for external tools and provides immediate visual confirmation of whether your webhook endpoints are working.
