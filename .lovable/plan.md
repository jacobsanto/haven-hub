
# Fix Booking Flow Routing for Instant Bookings

Make instant booking with Stripe payment the default flow, and only allow request-based bookings when explicitly chosen or when instant booking is disabled for a property.

---

## Current Problem

The **BookingWidget** on property detail pages bypasses the `/checkout` page entirely:
- It creates a booking directly in the database
- Navigates to `/booking/confirm` (request-based confirmation)  
- Stripe payment form is never shown

This conflicts with the Stripe integration you've implemented in `/checkout`.

---

## Solution Overview

1. **Update BookingWidget** - Route to `/checkout` for instant booking properties
2. **Keep request-based flow** - Only for non-instant booking properties
3. **Update messaging** - Clarify which flow the user is entering

---

## Changes Required

### 1. Update BookingWidget Component

**File:** `src/components/booking/BookingWidget.tsx`

Replace the current form-based flow with:
- For **instant booking** properties: Collect dates/guests, then route to `/checkout`
- For **request-based** properties: Keep current flow (form submission, then `/booking/confirm`)

```text
Logic Changes:
- If property.instant_booking === true:
  - Show simplified date/guest picker
  - "Book Now" button routes to /checkout?property=slug&checkIn=...&checkOut=...&guests=...
  - Remove guest info form (collected in /checkout instead)
  
- If property.instant_booking === false:
  - Keep current multi-step form (dates → details → confirm)
  - "Request Booking" button creates booking and goes to /booking/confirm
```

### 2. Update Button Labels and Messaging

- Instant booking: "Book & Pay Now" with Zap icon
- Request-based: "Request Booking" with Clock icon
- Footer text:
  - Instant: "Secure payment via Stripe"
  - Request: "We'll confirm availability first"

### 3. Update MobileBookingCTA (Already Correct)

The MobileBookingCTA already routes instant bookings to `/checkout` via `handleQuickBook()`. 

For non-instant bookings, it shows the BookingWidget in a sheet. This will now correctly show the request-based flow.

---

## Visual Flow Comparison

```text
INSTANT BOOKING (property.instant_booking = true)
┌──────────────────┐    ┌───────────────┐    ┌────────────────┐
│  Property Page   │ → │   /checkout   │ → │ /booking/confirm│
│  (BookingWidget) │    │ (Stripe Form) │    │   (Confirmed)  │
│  Select dates    │    │ Payment       │    │                │
│  Select guests   │    │ Add-ons       │    │                │
│  [Book & Pay]    │    │ Guest info    │    │                │
└──────────────────┘    └───────────────┘    └────────────────┘

REQUEST-BASED BOOKING (property.instant_booking = false)
┌──────────────────┐    ┌────────────────┐
│  Property Page   │ → │ /booking/confirm│
│  (BookingWidget) │    │   (Pending)    │
│  Select dates    │    │                │
│  Guest info form │    │                │
│  [Request Book]  │    │                │
└──────────────────┘    └────────────────┘
```

---

## Technical Details

### BookingWidget.tsx Changes

```typescript
// New state for instant booking flow
const [step, setStep] = useState<'dates' | 'details' | 'confirm'>(
  property.instant_booking ? 'dates' : 'dates'
);

// Handle instant book - route to checkout
const handleInstantBook = () => {
  if (!checkIn || !checkOut) {
    toast({ title: 'Please select dates', variant: 'destructive' });
    return;
  }
  
  const params = new URLSearchParams({ 
    property: property.slug,
    guests: String(guests),
    checkIn: format(checkIn, 'yyyy-MM-dd'),
    checkOut: format(checkOut, 'yyyy-MM-dd'),
  });
  
  navigate(`/checkout?${params.toString()}`);
};

// Keep existing handleBooking for request-based flow
const handleBooking = async () => { /* existing code */ };

// Render different UI based on instant_booking
{property.instant_booking ? (
  // Simplified: dates + guests only
  <Button onClick={handleInstantBook}>
    <Zap className="h-4 w-4" />
    Book & Pay Now
  </Button>
) : (
  // Full form: dates → details → confirm
  <Button onClick={handleContinue}>Continue</Button>
)}
```

### Files to Modify

1. `src/components/booking/BookingWidget.tsx` - Main logic change
2. No changes needed to:
   - `UnifiedBookingDialog.tsx` (already routes to /checkout)
   - `MobileBookingCTA.tsx` (already handles both flows correctly)
   - `Checkout.tsx` (Stripe integration ready)
   - `PropertyCard.tsx` and `QuickBookCard.tsx` (use UnifiedBookingDialog)

---

## Expected Outcomes

After implementation:

1. **Property with instant_booking = true**
   - Desktop: BookingWidget shows "Book & Pay Now" → `/checkout` with Stripe
   - Mobile: MobileBookingCTA "Book Now" → `/checkout` with Stripe

2. **Property with instant_booking = false**
   - Desktop: BookingWidget full form → "Request Booking" → `/booking/confirm`
   - Mobile: MobileBookingCTA opens sheet with BookingWidget → request flow

3. **All entry points converge**:
   - PropertyCard buttons → UnifiedBookingDialog → `/checkout`
   - QuickBookCard → UnifiedBookingDialog → `/checkout`  
   - Header search → UnifiedBookingDialog → `/checkout`
   - Floating button → UnifiedBookingDialog → `/checkout`
