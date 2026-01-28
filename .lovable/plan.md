
# Fix AbortError in Payment Flow

## Root Cause Analysis

The error `AbortError: signal is aborted without reason` occurs during the booking creation process in `handleProceedToPayment`. Based on the investigation:

### Flow Analysis

```text
User clicks "Proceed to Payment"
       |
       v
1. setIsProcessing(true)
       |
       v  
2. completeBooking.mutateAsync() ← BOOKING CREATED HERE
       |
       v
3. Supabase inserts booking record
       |
       v
4. Realtime subscription fires (useRealtimeAvailability)
       |
       v
5. queryClient.invalidateQueries(['bookings'])
       |
       v
6. Component re-renders with new query state
       |
       v
7. AbortError - fetch cancelled mid-operation
```

### Why It Happens

1. The `useRealtimeAvailability` hook subscribes to `bookings` table changes
2. When `completeBooking.mutateAsync()` inserts a new booking, the realtime listener fires
3. The listener calls `queryClient.invalidateQueries({ queryKey: ['bookings'] })`
4. This triggers background refetches and component re-renders
5. During this re-render, the ongoing fetch (from `supabase.from().insert()`) gets aborted

---

## Solution Strategy

### Option A: Deferred Booking Creation (Recommended)
Change the payment flow to create the booking AFTER payment succeeds, not before. This is also a safer pattern for production:

- Create Payment Intent first (no booking record yet)
- Only create booking after Stripe confirms payment
- Prevents orphaned unpaid booking records

### Option B: Debounce Button Clicks
Add double-click protection to prevent multiple submissions.

### Option C: Suspend Realtime During Checkout
Temporarily pause realtime subscriptions while the payment flow is processing.

### Option D: Isolate Mutation (Quick Fix)
Wrap the mutation call to prevent abort signals from propagating.

---

## Recommended Implementation: Option A + B Combined

### Changes Required

#### 1. Update Checkout.tsx - Move booking creation to after payment success

**Current flow:**
```text
Click → Create Booking → Create Payment Intent → Show Stripe Form → Payment → Confirm
```

**New flow:**
```text
Click → Create Payment Intent → Show Stripe Form → Payment → Create Booking → Confirm
```

Modify `handleProceedToPayment`:
- Remove `completeBooking.mutateAsync()` call
- Pass guest info and booking details directly to payment intent
- Store booking data in state for later use

Modify `handlePaymentSuccess`:
- Create booking record HERE after payment succeeds
- Link booking to the successful payment intent

#### 2. Update create-payment-intent Edge Function

Already receives all booking details in metadata - no changes needed.

#### 3. Update confirm-payment Edge Function

Modify to accept full booking payload and create booking atomically after payment verification.

#### 4. Add Button Debounce Protection

Add a ref to track if mutation is in-flight to prevent double-clicks:
```typescript
const isSubmittingRef = useRef(false);

const handleProceedToPayment = async () => {
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;
  // ... existing code
  // finally: isSubmittingRef.current = false;
};
```

---

## Technical Details

### File: src/pages/Checkout.tsx

**Remove from `handleProceedToPayment`:**
- Lines 197-218: The `completeBooking.mutateAsync()` call
- Lines 220: `setCreatedBookingId()` call

**Move to `handlePaymentSuccess`:**
- Create booking after payment is confirmed
- Use the booking details already passed to the function

**Add:**
- `isSubmittingRef` to prevent double-clicks
- Store booking payload in state before payment

### File: supabase/functions/confirm-payment/index.ts

**Update to:**
- Accept optional booking creation payload
- If booking data provided, create booking record atomically
- Return created booking ID in response

---

## Benefits

1. **No orphaned bookings**: Bookings only created after successful payment
2. **No race conditions**: Realtime subscription won't fire during payment setup
3. **Cleaner data**: Database only contains confirmed/paid bookings
4. **Better UX**: Simpler error recovery - failed payment = no cleanup needed

---

## Implementation Steps

1. Update `confirm-payment` edge function to accept and create booking
2. Modify `handleProceedToPayment` to skip booking creation
3. Pass full booking payload to payment flow state
4. Create booking in `handlePaymentSuccess` via confirm-payment
5. Add double-click protection with ref
6. Test end-to-end payment flow
