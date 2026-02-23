
# Booking Flow Redesign: Dialog Steps + Redesigned Confirmation

## Overview

Move Steps 1-3 (Dates, Guests, Details) into a modal dialog triggered by "Book Now" / "Instant Book" buttons. Step 4 (Review and Pay) stays on the full `/checkout` page. The confirmation page gets a visual redesign.

## Flow Summary

```text
User clicks "Book Now" on property page
  --> Dialog opens (Steps 1-3)
    Step 1: "Select Your Dates" - property card, calendar, check-in/check-out/duration bar
    Step 2: "Number of Guests" - property card with dates, guest counter, estimated total
    Step 3: "Enhance Your Stay" - add-ons + guest info form
  --> "Continue to Payment" navigates to /checkout page
    Step 4: "Review & Pay" - full page, two-column layout (existing)
  --> Stripe redirect
  --> Redesigned "Booking Confirmed!" page
```

## New Component: `BookingFlowDialog`

**File:** `src/components/booking/BookingFlowDialog.tsx`

A new Dialog component that encapsulates Steps 1-3 of the booking flow. It will:

- Accept `property` and `specialOffer` as props, plus optional initial dates/guests
- Contain the same numbered stepper (circles with lines, checkmarks for completed steps) -- but without labels (just numbers, matching the screenshots)
- Show a **property card** at the top of each step (image thumbnail + name + location, and on step 2+ also dates/nights)
- **Step 1 "Select Your Dates"**: Full 2-month `AvailabilityCalendar`, a summary bar showing CHECK-IN / CHECK-OUT / DURATION, Cancel + "Next: Guests" buttons
- **Step 2 "Number of Guests"**: Centered "How many guests?" with max display, +/- counter, estimated total (rate x nights), Back + "Continue to Book" buttons
- **Step 3 "Enhance Your Stay"**: `AddonsSelection` + `GuestForm` (with `hidePreferences`), Back + "Continue to Payment" buttons
- On completing Step 3, navigate to `/checkout?property=...&checkIn=...&checkOut=...&guests=...&adults=...&children=...` with addon and guest info stored in sessionStorage (to avoid huge URL params)

This dialog is rendered as a `Dialog` on desktop and a full-screen `Drawer` on mobile.

## Changes to Existing Files

### 1. `src/components/booking/BookingWidget.tsx`
- Update `handleInstantBook` to open `BookingFlowDialog` instead of navigating directly to `/checkout`
- Import and render `BookingFlowDialog`, passing current dates/guests as initial values

### 2. `src/components/booking/MobileBookingCTA.tsx`
- Update `handleQuickBook` to open `BookingFlowDialog` instead of navigating to `/checkout`
- Import and render `BookingFlowDialog`

### 3. `src/pages/Checkout.tsx`
- Remove Steps 1-3 UI (dates, guests, details)
- The page now only shows Step 4 (Review and Pay)
- Read guest info and addons from sessionStorage (set by the dialog)
- Read dates, guests, adults, children from URL params (as before)
- Stepper still shows all 4 steps but steps 1-3 are pre-completed (checkmarks)
- Clicking completed steps 1-3 in stepper navigates back to property page (or opens dialog -- we'll navigate back for simplicity)

### 4. `src/pages/PaymentSuccess.tsx`
- Redesign to match the "Booking Confirmed!" screenshot:
  - Large checkmark icon in a circle (orange/primary accent)
  - "Booking Confirmed!" heading
  - Subtitle: "Your stay at Haven Hub is locked in! We've sent a confirmation email to your inbox."
  - Property card with image, name, confirmation number (orange badge), location
  - Grid: CHECK-IN date, CHECK-OUT date, GUESTS count, ROOM TYPE
  - Total Price Paid bar
  - "View My Bookings" button (primary, full-width)
  - "Receipt" and "Share" buttons side by side
  - "Need help with your booking? Contact Support" link at bottom

## Data Flow Between Dialog and Checkout Page

The dialog stores transient booking state in **sessionStorage** before navigating:

```text
sessionStorage key: "haven-hub-checkout-state"
Value: JSON.stringify({
  guestInfo: { firstName, lastName, email, phone, country, specialRequests },
  selectedAddons: [...],
  adults: number,
  children: number,
})
```

The Checkout page reads this on mount, then clears it. URL params carry: `property`, `checkIn`, `checkOut`, `guests`.

## Technical Details

### BookingFlowDialog stepper
- No labels, just numbered circles connected by lines (matching screenshots)
- Completed steps show checkmark, current step is filled navy, future steps are outlined

### Dialog sizing
- Desktop: `max-w-2xl` Dialog with scroll
- Mobile: Full-screen Drawer (using vaul)

### State management
- Dialog manages its own local state for dates, guests, addons, guest info
- No changes to BookingContext needed
- Checkout hold creation moves into the dialog (Step 1, after date selection)

### Estimated total (Step 2)
- Shows `base_price x nights` as a simple estimate
- Full price breakdown with fees/taxes only appears on Checkout page

## Files Summary

| File | Change |
|------|--------|
| `src/components/booking/BookingFlowDialog.tsx` | **New** -- 3-step dialog for dates, guests, details |
| `src/components/booking/BookingWidget.tsx` | Open dialog instead of navigating to /checkout |
| `src/components/booking/MobileBookingCTA.tsx` | Open dialog instead of navigating to /checkout |
| `src/pages/Checkout.tsx` | Remove steps 1-3, only show step 4 (Review and Pay), read state from sessionStorage |
| `src/pages/PaymentSuccess.tsx` | Redesign to match "Booking Confirmed!" reference |
