
# Redesign Checkout Page to Match Reference Layout

## Current State
The checkout page has 4 steps: **Dates > Addons > Guest > Payment**, each shown separately. The stepper is a simple text-based row. The payment step is a simple button that redirects to Stripe Checkout.

## Target State (from screenshots)
Restructure into a cleaner 4-step flow with a visual numbered stepper, combining add-ons and guest info into one "Details" step, and creating a polished "Review and Pay" final step with a two-column layout.

## New Step Structure

| Step | Label | Content |
|------|-------|---------|
| 1 | Dates | Calendar + guest count selector (unchanged) |
| 2 | Guests | Guest count breakdown (adults/children) -- merged into step 1 already, so this becomes optional or kept as-is |
| 3 | Details | Add-ons selection + Guest Information form combined on one screen |
| 4 | Payment | Two-column layout: Left = property card + booking summary + price breakdown + cancellation policy. Right = Preferences and Terms + "Confirm and Pay" button (Stripe redirect) |

Looking at the screenshots more carefully, steps 1 and 2 are already completed (checkmarks), so the flow is:
- **Step 1: Dates** (calendar + guest count)
- **Step 2: Guests** (keep current adult/children breakdown from GuestForm, or merge into step 1)
- **Step 3: Details** ("Enhance Your Stay" -- add-ons + guest info form combined)
- **Step 4: Payment** ("Review and Pay" -- summary sidebar left, payment action right)

## Changes

### 1. `src/pages/Checkout.tsx` -- Major restructure

**Stepper redesign:**
- Replace the text-based step pills with numbered circles connected by lines
- Completed steps show a checkmark icon inside the circle
- Current step is highlighted (filled navy circle with number)
- Future steps are outlined circles with number

**Step 3 "Details" (combined):**
- Show "Enhance Your Stay" heading with subtitle "Customize your experience and let us know a bit about you."
- Render `AddonsSelection` component
- Below it, render the guest information fields from `GuestForm` (name, email, phone, country)
- Move special requests into this step
- "Continue to Payment" button at the bottom

**Step 4 "Payment" (two-column Review and Pay):**
- Left column (sidebar): Property card with image, location, star rating. Below: dates, nights, guests, extras summary. Below: itemized price breakdown (accommodation x nights, cleaning fee, service fee, discounts, add-on totals). Below: total in EUR. Below: cancellation policy card.
- Right column (main): "Review and Pay" heading. Preferences and Terms section (marketing consent checkbox, terms acceptance checkbox). "Confirm and Pay [total]" button with lock icon that redirects to Stripe Checkout. Security note below.
- Note: We keep the Stripe Checkout redirect approach (not inline card fields) since that is our established payment architecture for PCI compliance.

### 2. `src/components/booking/GuestForm.tsx` -- Minor adjustment

- Extract guest info fields so they can be used standalone (the form already works with `id="guest-form"`)
- Move "Preferences and Terms" (marketing consent + terms checkboxes) out of GuestForm and into the Payment step, since the reference shows them on the payment screen
- Add a prop like `hidePreferences` to optionally hide the Preferences and Terms section when rendered in the Details step

### 3. `src/components/booking/PaymentStep.tsx` -- Redesign

- Remove the standalone payment method cards (credit card, Apple Pay, etc.) display since Stripe handles that
- Show "Confirm and Pay [total]" as the primary CTA with a lock icon
- Add security note: "Your payment information is encrypted and secure."
- Accept the preferences/terms state from parent (marketing consent, terms accepted)

## Technical Notes

- No database changes required
- No new edge functions needed
- The Stripe Checkout redirect flow remains unchanged
- `GuestForm` continues to handle Zod validation for guest fields
- The combined Details step will use the same `guest-form` form ID for submission
- Price breakdown calculation logic stays the same
- Real-time availability subscription stays the same

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | Redesign stepper, combine steps 3 (Details), restructure step 4 (Review and Pay) two-column layout |
| `src/components/booking/GuestForm.tsx` | Add `hidePreferences` prop to hide terms/marketing when used in Details step |
| `src/components/booking/PaymentStep.tsx` | Simplify to show "Confirm and Pay" CTA with terms/preferences inline |
