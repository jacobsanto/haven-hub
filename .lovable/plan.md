
# Stripe Checkout Audit and Fix Plan

## Summary of Findings

After a deep investigation of the Stripe checkout flow, I found that the core infrastructure is working correctly. The edge functions respond properly, and the Stripe SDK is configured. However, there are several issues that could prevent successful checkout:

---

## Issues Identified

### 1. Missing `STRIPE_WEBHOOK_SECRET` (Medium Priority)
- **Problem**: The `stripe-webhook/index.ts` function requires `STRIPE_WEBHOOK_SECRET` but this is not configured in the secrets
- **Impact**: Stripe webhooks will fail with "Stripe not configured" error, though this doesn't block initial payment since `confirm-payment` verifies payment status directly
- **Fix**: Add the webhook secret from Stripe Dashboard to Supabase secrets

### 2. Empty `fees_taxes` Table (Low Priority)
- **Problem**: The fees/taxes table has no data
- **Impact**: Price breakdowns won't include any fees or taxes, but checkout will still work
- **Fix**: Optional - add default fees/taxes if needed for your business model

### 3. Properties with "Unknown" Country (Low Priority)
- **Problem**: Most properties have `country: "Unknown"` instead of a proper country value
- **Impact**: Stripe metadata will show "Unknown" for property country
- **Fix**: Update property records with correct country values

---

## Testing the Checkout Flow

To identify the exact failure point, we need to test the complete flow:

### Step 1: Verify Stripe.js Loads
The frontend uses `getStripe()` which loads the Stripe SDK using the publishable key from `VITE_STRIPE_PUBLISHABLE_KEY`. This appears to be correctly configured.

### Step 2: Verify Payment Intent Creation
I tested the `create-payment-intent` edge function directly and it returned a valid `clientSecret`:

```text
Response: 200 OK
{
  "clientSecret": "pi_xxx_secret_xxx",
  "customerId": "cus_xxx",
  "paymentIntentId": "pi_xxx"
}
```

This confirms the backend payment creation is working.

### Step 3: Verify Stripe Elements Render
The `StripePaymentForm` component uses Stripe's `PaymentElement` which requires:
- A valid `clientSecret` from step 2
- The Stripe.js SDK loaded

### Step 4: Identify the Blocking Issue
Since no console logs or network errors were captured, the issue is likely:
- User hasn't reached the payment step (stuck on dates/guest form)
- Dates are unavailable (101 blocked dates from iCal sync)
- A silent JavaScript error preventing progression

---

## Implementation Plan

### Phase 1: Add Missing Webhook Secret
1. Get webhook signing secret from Stripe Dashboard (Developers > Webhooks > Signing secret)
2. Add `STRIPE_WEBHOOK_SECRET` to Supabase secrets

### Phase 2: Improve Error Visibility
Add better error logging to capture the exact failure point:

1. **Add console logging to `handleProceedToPayment`** in `Checkout.tsx`
   - Log when health check starts/completes
   - Log when payment intent request is made
   - Log the response or error received

2. **Add error boundary for Stripe Elements**
   - Catch and display any errors from the Stripe Elements component

### Phase 3: Test End-to-End
1. Navigate to a property with available dates (check availability table)
2. Complete the checkout flow step by step:
   - Select dates (must be 2+ nights, dates not blocked)
   - Continue through addons
   - Fill guest form and accept terms
   - Reach payment step
   - Enter test card and complete payment

---

## Files to Modify

| File | Changes |
|------|---------|
| (Supabase Secrets) | Add `STRIPE_WEBHOOK_SECRET` |
| `src/pages/Checkout.tsx` | Add verbose logging for debugging |
| `src/components/booking/StripePaymentForm.tsx` | Add error state visibility |

---

## Test Card Numbers (Stripe Test Mode)
When testing, use these Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3DS Required**: 4000 0025 0000 3155

---

## Next Steps
1. Add the `STRIPE_WEBHOOK_SECRET` to Supabase secrets
2. Add enhanced logging to the checkout page
3. Test the full booking flow end-to-end on a property with available dates
4. If issues persist, check browser console for JavaScript errors
