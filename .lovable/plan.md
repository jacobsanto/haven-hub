
# Switch to Stripe Checkout (Hosted Payment Page)

## What This Changes

Currently, the checkout flow embeds Stripe's card input directly in your website using `CardElement`. This causes complexity with form mounting, element rendering, and requires handling all payment UI states manually.

The new approach opens **Stripe's hosted payment page** in a new tab when the user clicks "Pay". Stripe handles everything - card input, 3D Secure, Apple Pay/Google Pay - and redirects back to your site when done.

## Benefits

- Eliminates embedded card element issues
- Automatic support for Apple Pay, Google Pay, Link
- 3D Secure handled by Stripe
- Less PCI compliance burden
- Simpler, more reliable flow

## Implementation Overview

### Backend Changes

**1. Create new `create-checkout-session` edge function**

Replace the PaymentIntent approach with a Checkout Session:

```text
┌─────────────────────────────────────────────────────────────┐
│  create-checkout-session                                     │
│                                                              │
│  Input: property, dates, guest info, price breakdown         │
│                                                              │
│  1. Validate property and availability                       │
│  2. Create Stripe Checkout Session with:                     │
│     - mode: "payment"                                        │
│     - line_items (dynamic based on booking)                  │
│     - success_url with session_id                            │
│     - cancel_url back to checkout                            │
│     - metadata (all booking details)                         │
│  3. Return session URL                                       │
│                                                              │
│  Output: { url: "https://checkout.stripe.com/..." }          │
└─────────────────────────────────────────────────────────────┘
```

**2. Update `stripe-webhook` to handle `checkout.session.completed`**

When Stripe redirects back after payment, the webhook confirms the booking:

```text
┌─────────────────────────────────────────────────────────────┐
│  stripe-webhook (updated)                                    │
│                                                              │
│  Event: checkout.session.completed                           │
│                                                              │
│  1. Extract metadata from session                            │
│  2. Check for existing booking (idempotency)                 │
│  3. Create booking, price breakdown, payment records         │
│  4. Release checkout hold                                    │
│  5. Trigger PMS sync                                         │
└─────────────────────────────────────────────────────────────┘
```

**3. Keep `confirm-payment` as fallback** (minimal changes)

The webhook handles booking creation, but the success page can call this to verify.

### Frontend Changes

**1. Simplify `PaymentStep` component**

Remove `CardElement`, `StripeProvider`, and all embedded card logic. Replace with a simple "Pay Now" button that:
- Calls `create-checkout-session` edge function
- Opens returned URL in new tab (`window.open`)
- Shows "Waiting for payment..." state

```text
┌─────────────────────────────────────────────────────────────┐
│  Payment Step (simplified)                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Booking Reference: BK-202602-XXXX                      ││
│  │  Total to Pay: €1,500.00                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Back]                    [ Pay €1,500.00 → ]               │
│                                                              │
│  🔒 SSL Encrypted  🛡️ PCI Compliant                         │
└─────────────────────────────────────────────────────────────┘
```

**2. Create `/payment-success` page**

After Stripe redirects back:
- Extract `session_id` from URL
- Call verify endpoint to confirm booking was created
- Show confirmation with booking reference
- Redirect to `/booking/confirm` page

**3. Create `/payment-cancelled` page**

Simple page that lets user go back to checkout to try again.

**4. Remove unused components**
- `StripeProvider.tsx` (no longer needed)
- `useStripePayment.ts` (no longer needed)
- Simplify `useStripeHealth.ts`

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-checkout-session/index.ts` | Creates Stripe Checkout Session |
| `src/pages/PaymentSuccess.tsx` | Post-payment landing page |
| `src/pages/PaymentCancelled.tsx` | Cancelled payment page |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/booking/PaymentStep.tsx` | Replace embedded form with redirect button |
| `supabase/functions/stripe-webhook/index.ts` | Add `checkout.session.completed` handler |
| `src/App.tsx` | Add new routes |

### Files to Delete

| File | Reason |
|------|--------|
| `src/components/booking/StripeProvider.tsx` | No embedded Elements needed |
| `src/hooks/useStripePayment.ts` | Replaced by simple redirect |
| `supabase/functions/create-payment-intent/index.ts` | Replaced by checkout session |

## New User Flow

```text
1. User completes dates → addons → guest details
2. Clicks "Pay €X" button
3. New tab opens with Stripe Checkout (Stripe's hosted page)
4. User enters card / uses Apple Pay / Google Pay
5. Stripe redirects to /payment-success?session_id=xxx
6. Success page verifies booking and shows confirmation
7. User redirected to /booking/confirm
```

## Technical Details

### Checkout Session Configuration

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/checkout?property=${slug}&resume=true`,
  line_items: [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${property.name} - ${nights} nights`,
          description: `${checkIn} to ${checkOut}`,
        },
        unit_amount: Math.round(total * 100),
      },
      quantity: 1,
    },
  ],
  customer_email: guestEmail,
  metadata: {
    // All booking details for webhook processing
    booking_reference,
    property_id,
    check_in,
    check_out,
    // ... etc
  },
});
```

### Webhook Secret Requirement

A `STRIPE_WEBHOOK_SECRET` is required for production to verify webhook signatures. This ensures only genuine Stripe events create bookings.
