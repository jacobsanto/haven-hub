# Stripe Payment Integration Plan

## Overview

This document outlines the complete implementation plan for integrating Stripe payments into the Haven Hub booking engine. The integration follows a **Payment-First Orchestration** pattern where booking records are only created after successful payment verification.

---

## 1. Architecture

### Payment Flow Sequence

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Checkout  │     │   Edge Functions     │     │   Stripe    │
│   Frontend  │     │   (Lovable Cloud)    │     │   API       │
└──────┬──────┘     └──────────┬───────────┘     └──────┬──────┘
       │                       │                        │
       │  1. Request Payment   │                        │
       │  Intent (booking data)│                        │
       │──────────────────────>│                        │
       │                       │  2. Create Payment     │
       │                       │  Intent                │
       │                       │───────────────────────>│
       │                       │                        │
       │                       │  3. Return client_secret
       │                       │<───────────────────────│
       │  4. client_secret     │                        │
       │<──────────────────────│                        │
       │                       │                        │
       │  5. User enters card via Stripe Elements       │
       │  6. stripe.confirmPayment()                    │
       │─────────────────────────────────────────────────>│
       │                       │                        │
       │  7. Payment Result    │                        │
       │<─────────────────────────────────────────────────│
       │                       │                        │
       │  8. If succeeded:     │                        │
       │  Confirm Payment      │                        │
       │──────────────────────>│                        │
       │                       │  9. Verify payment     │
       │                       │───────────────────────>│
       │                       │                        │
       │                       │  10. Create booking    │
       │                       │  records atomically    │
       │                       │                        │
       │  11. Booking confirmed│                        │
       │<──────────────────────│                        │
       │                       │                        │
       │  12. Redirect to      │                        │
       │  /booking/confirm     │                        │
       │                       │                        │
```

### Key Principles

1. **Payment-First**: Database records created ONLY after Stripe confirms payment succeeded
2. **Atomic Writes**: Booking, price breakdown, add-ons, and payment records created in single transaction
3. **Idempotent**: Payment intent ID used as idempotency key to prevent duplicate bookings
4. **Defensive**: Server-side validation of all amounts before processing

---

## 2. Edge Functions

### 2.1 create-payment-intent

**Purpose**: Create a Stripe PaymentIntent with the full booking amount and rich metadata.

**Location**: `supabase/functions/create-payment-intent/index.ts`

**Input Payload**:
```typescript
{
  propertyId: string;           // UUID
  checkIn: string;              // YYYY-MM-DD
  checkOut: string;             // YYYY-MM-DD
  nights: number;
  guests: number;
  adults: number;
  children: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    specialRequests?: string;
  };
  selectedAddons: Array<{
    addonId: string;
    quantity: number;
    calculatedPrice: number;
  }>;
  couponCode?: string;
  priceBreakdown: {
    accommodationTotal: number;
    addonsTotal: number;
    feesTotal: number;
    taxesTotal: number;
    discountAmount: number;
    total: number;
    currency: string;
    lineItems: Array<{
      label: string;
      amount: number;
      type: string;
    }>;
  };
  paymentType: 'full' | 'deposit';
  holdId?: string;              // Checkout hold ID
}
```

**Output**:
```typescript
{
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}
```

**Implementation Steps**:
1. Validate input with Zod schema
2. Verify property exists and is active
3. Re-validate availability for the dates
4. Re-calculate price server-side (don't trust client)
5. Validate coupon if provided
6. Create Stripe PaymentIntent with metadata
7. Return client_secret for Stripe Elements

**Stripe Metadata** (for dashboard visibility):
```typescript
{
  booking_reference: 'BK-202602-XXXX',
  property_id: 'uuid',
  property_name: 'Villa Amalfi',
  property_city: 'Positano',
  property_country: 'Italy',
  check_in: '2026-03-15',
  check_out: '2026-03-22',
  nights: '7',
  adults: '2',
  children: '1',
  guest_email: 'guest@example.com',
  guest_name: 'John Doe',
  accommodation_total: '2100.00',
  addons_total: '80.00',
  fees_total: '150.00',
  taxes_total: '234.00',
  discount_amount: '0.00',
  payment_type: 'full',
  cancellation_policy: 'moderate',
  hold_id: 'uuid'
}
```

### 2.2 confirm-payment

**Purpose**: Verify payment succeeded and create all booking records atomically.

**Location**: `supabase/functions/confirm-payment/index.ts`

**Input Payload**:
```typescript
{
  paymentIntentId: string;
  holdId?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  bookingId: string;
  bookingReference: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalPaid: number;
}
```

**Implementation Steps**:
1. Retrieve PaymentIntent from Stripe
2. Verify status === 'succeeded'
3. Check for existing booking with this payment_intent_id (idempotency)
4. If exists, return existing booking details
5. Parse metadata from PaymentIntent
6. Begin database transaction:
   - Create booking record
   - Create booking_price_breakdown records
   - Create booking_addons records
   - Create booking_payments record
   - Release checkout_hold
7. Commit transaction
8. Trigger PMS sync (async, non-blocking)
9. Return booking confirmation

**Error Handling**:
- Payment not succeeded → Return error with status
- Property no longer available → Refund and return error
- Database error → Log, but payment is safe (can retry confirmation)

---

## 3. Frontend Components

### 3.1 Payment Step Component

**Location**: `src/components/booking/PaymentStep.tsx`

**Features**:
- Stripe Elements card input
- Payment summary display
- Loading states with clear messaging
- Error handling with retry capability
- Apple Pay / Google Pay support (future)

**Component Structure**:
```tsx
<PaymentStep>
  <PaymentSummary />        {/* Final price breakdown */}
  <CardElement />           {/* Stripe card input */}
  <PaymentButton />         {/* Submit with loading state */}
  <SecurityBadges />        {/* Trust indicators */}
</PaymentStep>
```

### 3.2 useStripePayment Hook

**Location**: `src/hooks/useStripePayment.ts`

**Responsibilities**:
- Initialize Stripe Elements
- Create payment intent via edge function
- Handle payment confirmation
- Manage loading/error states
- Implement retry logic with backoff

**State Management**:
```typescript
interface StripePaymentState {
  isInitializing: boolean;
  isProcessing: boolean;
  clientSecret: string | null;
  paymentIntentId: string | null;
  error: string | null;
  retryCount: number;
}
```

### 3.3 Stripe Provider Setup

**Location**: `src/components/booking/StripeProvider.tsx`

**Purpose**: Wrap checkout with Stripe Elements provider

```tsx
<Elements stripe={stripePromise} options={{ appearance, locale: 'en' }}>
  <CheckoutContent />
</Elements>
```

---

## 4. Checkout Flow Integration

### 4.1 Current Steps

1. **dates** - Date selection with availability calendar
2. **addons** - Add-on selection (transfers, dining, etc.)
3. **guest** - Guest information form
4. **payment** - NEW: Stripe payment step

### 4.2 Payment Step Flow

```
Guest Step Complete
        │
        ▼
┌───────────────────────────┐
│  Enter Payment Step       │
│  - Show "Preparing..."    │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│  Call create-payment-     │
│  intent edge function     │
└───────────┬───────────────┘
            │
    ┌───────┴───────┐
    │  Success?     │
    └───────┬───────┘
       Yes  │  No
            │   └──────────────┐
            ▼                  ▼
┌───────────────────────┐  ┌───────────────────────┐
│  Show Stripe Card     │  │  Show Error Message   │
│  Element              │  │  + Retry Button       │
└───────────┬───────────┘  └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│  User Enters Card     │
│  Clicks "Pay Now"     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  stripe.confirmPayment│
│  - Show processing    │
└───────────┬───────────┘
            │
    ┌───────┴───────┐
    │  Succeeded?   │
    └───────┬───────┘
       Yes  │  No
            │   └──────────────┐
            ▼                  ▼
┌───────────────────────┐  ┌───────────────────────┐
│  Call confirm-payment │  │  Show Stripe Error    │
│  edge function        │  │  (card declined, etc) │
└───────────┬───────────┘  └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│  Redirect to          │
│  /booking/confirm     │
│  ?ref=BK-XXXX         │
└───────────────────────┘
```

---

## 5. Security Considerations

### 5.1 Input Validation

All edge functions use Zod for strict validation:
```typescript
const CreatePaymentIntentSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // ... etc
}).refine(data => data.checkOut > data.checkIn, {
  message: "Check-out must be after check-in"
});
```

### 5.2 Server-Side Price Verification

**NEVER trust client-calculated prices**. The `create-payment-intent` function:
1. Fetches property base_price from database
2. Fetches seasonal rates for the date range
3. Fetches addon prices from addons_catalog
4. Fetches fees/taxes from fees_taxes
5. Validates coupon from coupons_promos
6. Recalculates total server-side
7. Compares with client-sent total (log discrepancy, use server value)

### 5.3 Idempotency

The `confirm-payment` function uses `paymentIntentId` as idempotency key:
- Before creating booking, check if one exists with this payment_intent_id
- If exists, return existing booking (no duplicate creation)
- This handles network retries and refresh scenarios

### 5.4 Authorization

- `create-payment-intent`: Public endpoint (guest checkout)
- `confirm-payment`: Public endpoint (validates via Stripe payment status)
- Both use service_role key for database writes (bypasses RLS safely)

---

## 6. Error Handling

### 6.1 Frontend Error States

| Scenario | User Message | Action |
|----------|--------------|--------|
| Network error creating intent | "Unable to connect to payment system" | Retry button |
| Stripe Elements load failure | "Payment form unavailable" | Retry button |
| Card declined | Stripe's error message | Re-enter card |
| 3D Secure failed | "Authentication failed" | Try again |
| Confirmation failed | "Payment received, finalizing booking..." | Auto-retry |

### 6.2 Edge Function Error Responses

```typescript
// Structured error responses
return new Response(JSON.stringify({
  error: true,
  code: 'PROPERTY_UNAVAILABLE',
  message: 'This property is no longer available for the selected dates',
  details: { conflictingDates: ['2026-03-16', '2026-03-17'] }
}), { status: 400 });
```

### 6.3 Recovery Scenarios

| Scenario | System Behavior |
|----------|-----------------|
| Payment succeeded but confirm fails | Payment is captured, booking pending. Admin can manually complete. Webhook backup. |
| User closes tab after payment | Webhook creates booking. User receives email confirmation. |
| Network timeout on confirm | Frontend retries with same paymentIntentId. Idempotency prevents duplicates. |

---

## 7. Stripe Webhook (Optional Enhancement)

**Purpose**: Backup mechanism to ensure bookings are created even if frontend confirmation fails.

**Location**: `supabase/functions/stripe-webhook/index.ts`

**Events to Handle**:
- `payment_intent.succeeded` - Create booking if not exists
- `payment_intent.payment_failed` - Log for monitoring
- `charge.refunded` - Update booking status

**Implementation**: Phase 2 (after core flow is working)

---

## 8. Testing Strategy

### 8.1 Stripe Test Cards

| Card Number | Behavior |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | 3D Secure required |
| 4000 0000 0000 9995 | Insufficient funds |

### 8.2 Test Scenarios

1. **Happy Path**: Select dates → Add addons → Enter guest info → Pay → Confirm
2. **Declined Card**: Verify error message, allow retry
3. **3D Secure**: Complete authentication flow
4. **Network Failure**: Simulate offline, verify retry works
5. **Duplicate Prevention**: Refresh after payment, verify no duplicate booking
6. **Price Tampering**: Modify client price, verify server uses correct amount

---

## 9. Implementation Order

### Phase 1: Core Payment Flow (Priority)
1. ✅ Audit complete - booking engine ready
2. ✅ Create `create-payment-intent` edge function
3. ✅ Create `confirm-payment` edge function
4. ✅ Create `PaymentStep.tsx` component
5. ✅ Create `useStripePayment.ts` hook
6. ✅ Integrate into Checkout.tsx
7. ⬜ Test with Stripe test cards

### Phase 2: Resilience & Polish
8. ✅ Add useStripeHealth preflight check
9. ✅ Add retry with exponential backoff
10. ✅ Create stripe-webhook edge function
11. ⬜ Add Apple Pay / Google Pay
12. ⬜ Add deposit payment option

### Phase 3: Admin & Monitoring
13. ⬜ Admin booking detail shows payment info
14. ⬜ Refund capability from admin
15. ⬜ Payment analytics dashboard

---

## 10. Files to Create/Modify

### New Files
- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/confirm-payment/index.ts`
- `src/components/booking/PaymentStep.tsx`
- `src/components/booking/StripeProvider.tsx`
- `src/hooks/useStripePayment.ts`
- `src/hooks/useStripeHealth.ts`

### Modified Files
- `src/pages/Checkout.tsx` - Add payment step
- `src/pages/BookingConfirm.tsx` - Show payment confirmation
- `supabase/config.toml` - Add new function configs

---

## 11. Environment & Secrets

### Already Configured ✅
- `STRIPE_SECRET_KEY` - For edge functions
- `STRIPE_PUBLISHABLE_KEY` - For frontend
- `VITE_STRIPE_PUBLISHABLE_KEY` - In .env

### May Need (Phase 2)
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

---

## 12. Success Criteria

The Stripe integration is complete when:

1. ✅ Guest can enter card details via Stripe Elements
2. ✅ Payment is processed through Stripe
3. ✅ Booking record created only after payment succeeds
4. ✅ Add-ons included in payment amount
5. ✅ Fees and taxes included in payment amount
6. ✅ Coupons correctly reduce payment amount
7. ✅ Rich metadata visible in Stripe Dashboard
8. ✅ Guest receives booking confirmation
9. ✅ PMS sync triggered after booking
10. ✅ Error states handled gracefully with retry option
