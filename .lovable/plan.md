
# Add Booking Summary Review Step

## What This Does

Adds a new "Review" step between Guest Details and Payment in the checkout flow. This gives guests a clear, comprehensive summary of their entire booking before they proceed to pay -- reducing errors, abandoned checkouts, and post-booking support requests.

## Current Flow vs. New Flow

```text
Current:  Dates -> Add-ons -> Guest Details -> Payment
New:      Dates -> Add-ons -> Guest Details -> Review -> Payment
```

## Review Page Content

The Review step shows everything in one clean, scannable layout:

- **Property card** -- hero image, name, location
- **Stay details** -- check-in/check-out dates, number of nights, guest breakdown (adults + children)
- **Selected add-ons** -- each add-on with quantity, unit price, and line total (or "No add-ons selected")
- **Guest information** -- name, email, phone, country, special requests
- **Price breakdown** -- full itemized breakdown (accommodation, add-ons, fees, taxes, discount) with bold total
- **Cancellation policy** -- the applicable policy displayed for reference
- **Edit buttons** -- each section has an "Edit" link that jumps back to the relevant step
- **Confirm and Pay** button to proceed to Payment
- **Back** button to return to Guest Details

## Technical Changes

### File: `src/pages/Checkout.tsx`

1. Add `'review'` to the `CheckoutStep` type:
   ```
   type CheckoutStep = 'dates' | 'addons' | 'guest' | 'review' | 'payment';
   ```

2. Update the step progression array and navigation:
   - Progress bar shows 5 steps: dates, addons, guest, review, payment
   - Guest form `onSubmit` now navigates to `'review'` instead of `'payment'`
   - "Continue to Payment" button text becomes "Review Booking"

3. Add the Review step section between the Guest and Payment blocks -- a new render block that displays all collected booking data in a read-only summary layout using existing Card components and the existing `PriceBreakdownDisplay` component.

4. The Review step renders:
   - Property summary card (image + name + location)
   - Dates and guests summary row
   - Add-ons list (reuses data from `selectedAddons` state)
   - Guest info card (from `guestInfo` state)
   - Full price breakdown (reuses existing `PriceBreakdownDisplay` component)
   - Cancellation policy (reuses existing `CancellationPolicyDisplay` component)
   - "Edit" buttons per section that call `setCurrentStep()` to jump back
   - "Confirm and Proceed to Payment" CTA button

### No New Files Needed

The review step is implemented inline within the existing Checkout page, following the same pattern as the other steps (dates, addons, guest, payment). No new components or hooks are required -- it purely reads from existing state and reuses existing display components.

### No Database or Backend Changes

This is a purely frontend UI addition. No new tables, RLS policies, or edge functions are needed.

## What Does NOT Change

- Booking confirmation logic and payment flow remain identical
- PriceBreakdown calculation is unchanged
- Hold management is unchanged
- Guest form validation is unchanged
- All existing steps continue to work as before
- The BookingConfirm page (post-payment) is unchanged
