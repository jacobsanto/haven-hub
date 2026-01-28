
## Stripe Payment Integration for Vacation Rental Bookings

This plan integrates Stripe payments into the existing checkout flow, ensuring all booking details (property, rates, policies, add-ons) are captured in Stripe for visibility in your Stripe Dashboard.

---

### Current State

| Component | Status |
|-----------|--------|
| Checkout Flow | Complete (dates, addons, guest info, payment options) |
| Payment Options UI | Complete (full/deposit selection) |
| Booking Creation | Creates records but payment_status = 'pending' |
| Stripe Integration | Not implemented |
| Cancellation Policies | Just implemented (database-driven) |

### Target State

Complete Stripe integration with:
- Payment Intent creation with full booking metadata
- Rich metadata visible in Stripe Dashboard (property name, booking reference, policy, rates)
- Support for full payment and deposit models
- Webhook handling for payment confirmation
- Balance payment collection for deposits

---

### Implementation Steps

#### Step 1: Enable Stripe Integration

Use the Stripe connector to add the secret key to the project. This will enable Stripe SDK access in edge functions.

#### Step 2: Create Payment Intent Edge Function

**File:** `supabase/functions/create-payment-intent/index.ts` (New)

Creates a Stripe PaymentIntent with comprehensive metadata:

```typescript
// Metadata passed to Stripe (visible in Dashboard)
metadata: {
  // Booking Identification
  booking_reference: "BK-202601-XYZ1",
  booking_id: "uuid-xxx",
  
  // Property Details
  property_id: "uuid-xxx",
  property_name: "Villa Amalfi",
  property_slug: "villa-amalfi",
  
  // Stay Details
  check_in: "2026-02-15",
  check_out: "2026-02-22",
  nights: "7",
  guests: "4",
  adults: "2",
  children: "2",
  
  // Pricing
  accommodation_total: "3150.00",
  addons_total: "450.00",
  fees_total: "150.00",
  taxes_total: "370.00",
  discount_amount: "0",
  discount_code: "",
  total_amount: "4120.00",
  
  // Payment Type
  payment_type: "deposit",  // or "full"
  deposit_percentage: "30",
  amount_due: "1236.00",
  balance_due: "2884.00",
  
  // Policy
  cancellation_policy_id: "uuid-xxx",
  cancellation_policy_name: "Moderate",
  
  // Guest
  guest_name: "John Smith",
  guest_email: "john@example.com",
  guest_country: "United States",
  
  // Source
  source: "direct_website",
  session_id: "session_xxx"
}
```

**Line Items for Stripe Checkout** (if using Stripe Checkout in future):
```typescript
line_items: [
  { name: "7 nights at Villa Amalfi", amount: 315000, quantity: 1 },
  { name: "Airport Transfer", amount: 15000, quantity: 1 },
  { name: "Cleaning Fee", amount: 15000, quantity: 1 },
  { name: "Tourism Tax", amount: 37000, quantity: 1 }
]
```

#### Step 3: Create Payment Confirmation Edge Function

**File:** `supabase/functions/confirm-payment/index.ts` (New)

After successful payment:
1. Update `booking_payments` with `stripe_payment_intent_id` and status
2. Update `bookings.payment_status` to 'paid' or 'partial'
3. If instant booking, push to PMS
4. Send confirmation email (future)

#### Step 4: Create Stripe Webhook Handler

**File:** `supabase/functions/stripe-webhook/index.ts` (New)

Handles Stripe webhooks for:
- `payment_intent.succeeded` - Mark payment as successful
- `payment_intent.payment_failed` - Handle failed payments
- `charge.refunded` - Handle refunds

Webhook validates signatures using `STRIPE_WEBHOOK_SECRET`.

#### Step 5: Create Balance Payment Edge Function

**File:** `supabase/functions/collect-balance-payment/index.ts` (New)

For deposit bookings, creates a new PaymentIntent for the balance amount due 14 days before check-in.

#### Step 6: Create Refund Processing Edge Function

**File:** `supabase/functions/process-refund/index.ts` (New)

Calculates refund based on cancellation policy and processes via Stripe Refund API.

---

### Client-Side Changes

#### Step 7: Update Checkout to Use Stripe Elements

**File:** `src/pages/Checkout.tsx`

Add Stripe Elements for card input:
1. Create PaymentIntent via edge function when proceeding to payment
2. Display Stripe Elements (CardElement or PaymentElement)
3. Confirm payment with Stripe.js
4. On success, call `confirm-payment` edge function
5. Navigate to confirmation page

**New Component:** `src/components/booking/StripePaymentForm.tsx`

```tsx
interface StripePaymentFormProps {
  clientSecret: string;
  booking: {
    reference: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    total: number;
    amountDue: number;
  };
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
}
```

Features:
- Card Element with Apple Pay / Google Pay
- Loading states
- Error handling with retry
- Success animation

#### Step 8: Update PaymentOptions Component

**File:** `src/components/booking/PaymentOptions.tsx`

Modify to:
1. Accept `clientSecret` from parent
2. Show Stripe Elements when proceeding to payment
3. Handle payment confirmation

#### Step 9: Update useCompleteBooking Hook

**File:** `src/hooks/useCompleteBooking.ts`

Modify to:
1. Accept `paymentIntentId` parameter
2. Update `booking_payments` with Stripe reference
3. Set correct `payment_status` based on actual payment

---

### Database Updates

#### Step 10: Add Stripe-related columns (if needed)

The database already has `stripe_payment_intent_id` and `stripe_charge_id` columns on `booking_payments`. No schema changes required.

---

### Admin Dashboard Updates

#### Step 11: Show Payment Details in Booking Detail

**File:** `src/components/admin/BookingDetailDialog.tsx`

Display:
- Payment status with Stripe payment ID
- Link to view in Stripe Dashboard
- Refund button (calls `process-refund` edge function)
- Balance collection for deposit bookings

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/create-payment-intent/index.ts` | Create | Create PaymentIntent with metadata |
| `supabase/functions/confirm-payment/index.ts` | Create | Confirm payment and update records |
| `supabase/functions/stripe-webhook/index.ts` | Create | Handle Stripe webhooks |
| `supabase/functions/collect-balance-payment/index.ts` | Create | Collect balance for deposit bookings |
| `supabase/functions/process-refund/index.ts` | Create | Process refunds via Stripe |
| `src/components/booking/StripePaymentForm.tsx` | Create | Stripe Elements payment form |
| `src/pages/Checkout.tsx` | Modify | Integrate Stripe payment flow |
| `src/components/booking/PaymentOptions.tsx` | Modify | Show Stripe Elements |
| `src/hooks/useCompleteBooking.ts` | Modify | Accept payment intent ID |
| `src/components/admin/BookingDetailDialog.tsx` | Modify | Show payment details, refund button |

---

### Stripe Dashboard Visibility

After implementation, in your Stripe Dashboard you will see:

**Payment Details Page:**
```text
Payment pi_xxx succeeded
Amount: €1,236.00

Metadata:
├── booking_reference: BK-202601-XYZ1
├── property_name: Villa Amalfi
├── check_in: 2026-02-15
├── check_out: 2026-02-22
├── nights: 7
├── guests: 4
├── payment_type: deposit
├── deposit_percentage: 30
├── total_amount: 4120.00
├── balance_due: 2884.00
├── cancellation_policy_name: Moderate
├── guest_name: John Smith
└── guest_email: john@example.com
```

---

### Payment Flow Diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          CHECKOUT FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Guest completes dates, addons, guest info                            │
│                     │                                                    │
│                     ▼                                                    │
│  2. Click "Proceed to Payment"                                           │
│                     │                                                    │
│                     ▼                                                    │
│  3. Frontend calls create-payment-intent edge function                   │
│     └─ Passes: property, dates, guests, breakdown, policy               │
│                     │                                                    │
│                     ▼                                                    │
│  4. Edge function creates PaymentIntent with full metadata               │
│     └─ Returns: clientSecret                                            │
│                     │                                                    │
│                     ▼                                                    │
│  5. Frontend shows Stripe Elements (card input)                          │
│                     │                                                    │
│                     ▼                                                    │
│  6. Guest enters card, clicks "Pay €X"                                   │
│                     │                                                    │
│                     ▼                                                    │
│  7. Stripe.js confirms payment                                           │
│                     │                                                    │
│                     ▼                                                    │
│  8. On success, frontend calls confirm-payment edge function             │
│     └─ Creates booking + payment records                                │
│     └─ Pushes to PMS if instant_booking                                 │
│                     │                                                    │
│                     ▼                                                    │
│  9. Navigate to confirmation page                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Secrets Required

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures |
| `STRIPE_PUBLISHABLE_KEY` | Client-side (already in .env as VITE_) |

---

### Benefits

1. **Full Visibility**: Every payment shows property, dates, policy, rates in Stripe Dashboard
2. **Audit Trail**: Complete payment history linked to booking references
3. **Deposit Support**: Separate balance collection for deposit bookings
4. **Refund Processing**: Automatic calculation based on cancellation policy
5. **PMS Sync**: Payment confirmation triggers PMS push
6. **Apple Pay / Google Pay**: Native support via Stripe Elements
