
# Complete Stripe Payment System Removal

## Overview

You want to completely remove all Stripe-related code and infrastructure to start fresh. This plan identifies and removes every Stripe component, file, hook, edge function, and reference.

---

## What Will Be Deleted

### Frontend Files (Complete Deletion)

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe SDK loader with `getStripe()` function |
| `src/hooks/useStripeHealth.ts` | Pre-flight health check for Stripe connectivity |
| `src/components/booking/StripePaymentForm.tsx` | Stripe PaymentElement form component |

### Edge Functions (Complete Deletion)

| Function | Purpose |
|----------|---------|
| `supabase/functions/create-payment-intent/index.ts` | Creates Stripe PaymentIntent for checkout |
| `supabase/functions/confirm-payment/index.ts` | Verifies payment success and creates booking |
| `supabase/functions/stripe-webhook/index.ts` | Handles Stripe webhook events |
| `supabase/functions/process-refund/index.ts` | Processes refunds through Stripe |

### Files Requiring Stripe Code Removal

| File | Changes |
|------|---------|
| `src/pages/Checkout.tsx` | Remove Stripe imports, Elements wrapper, payment intent logic, StripePaymentForm usage |
| `src/components/booking/BookingWidget.tsx` | Remove "Secure payment via Stripe" text |
| `src/components/admin/ProcessRefundButton.tsx` | Update refund description text |

### Config Entries to Remove

From `supabase/config.toml`:
- `[functions.create-payment-intent]`
- `[functions.confirm-payment]`
- `[functions.process-refund]`
- `[functions.stripe-webhook]`

### Environment Variables (Remain in place for re-implementation)

These secrets exist but will no longer be used until you re-implement:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## Implementation Steps

### Step 1: Delete Frontend Stripe Files

Delete these files completely:
1. `src/lib/stripe.ts`
2. `src/hooks/useStripeHealth.ts`
3. `src/components/booking/StripePaymentForm.tsx`

### Step 2: Delete Edge Functions

Delete these directories:
1. `supabase/functions/create-payment-intent/`
2. `supabase/functions/confirm-payment/`
3. `supabase/functions/stripe-webhook/`
4. `supabase/functions/process-refund/`

Remove deployed functions from backend.

### Step 3: Simplify Checkout Page

Replace `src/pages/Checkout.tsx` with a placeholder that:
- Removes all Stripe imports
- Removes Elements provider
- Removes payment intent creation logic
- Removes StripePaymentForm usage
- Shows a "Payment gateway coming soon" message at payment step
- Keeps the date selection, addons, and guest form steps working

### Step 4: Update BookingWidget

Remove the "Secure payment via Stripe" text from the booking widget.

### Step 5: Update ProcessRefundButton

Update the refund description to remove Stripe-specific text.

### Step 6: Clean Config File

Update `supabase/config.toml` to remove the four Stripe-related function entries.

---

## Post-Cleanup State

After this cleanup:

- **Checkout flow**: Date selection, addons, and guest form will still work
- **Payment step**: Will show a placeholder message instead of Stripe form
- **Refunds**: Will show a disabled state until re-implemented
- **Booking creation**: Will not create bookings until new payment gateway is implemented

---

## Files Summary

| Action | Count | Files |
|--------|-------|-------|
| **Delete** | 7 | 3 frontend files + 4 edge function directories |
| **Modify** | 4 | Checkout.tsx, BookingWidget.tsx, ProcessRefundButton.tsx, config.toml |

---

## Database Note

The database tables (`booking_payments` with `stripe_payment_intent_id`, `stripe_charge_id` columns) will remain. These columns are nullable and won't cause issues. When you re-implement payments, you can reuse these columns or add new ones for your chosen gateway.
