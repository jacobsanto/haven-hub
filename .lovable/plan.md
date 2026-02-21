

# Booking Component Consolidation

## The Problem

There are currently 5 booking-related UI components with 3 separate state management systems and 2 competing buttons visible simultaneously on mobile property pages. This creates a confusing, inconsistent experience.

## Strategy: Two Flows, Not Four

Every booking interaction falls into one of two categories:

1. **Discovery flow** -- User does NOT have a property yet. They need to search/browse.
2. **Property flow** -- User IS on a property page. They need dates, guests, and a CTA.

All five components should map cleanly to one of these two flows.

## Changes

### 1. Remove FloatingBookButton from Property Pages

The `FloatingBookButton` currently appears on property detail pages on mobile, directly competing with `MobileBookingCTA`. It should be hidden there, just like `HeaderSearchToggle` already is.

**File:** `src/components/booking/FloatingBookButton.tsx`
- Add route detection (same pattern as `HeaderSearchToggle`)
- Return `null` when on `/properties/:slug` pages
- Keep it on homepage, listings, destinations, blog, etc.

### 2. QuickBookCard: Navigate to Property Page Instead of Opening Dialog

Currently, hovering a property card and clicking "Instant Book" opens the `UnifiedBookingDialog` (multi-step flow with destination selection). This makes no sense when the property is already known.

**File:** `src/components/booking/QuickBookCard.tsx`
- Change `handleBookNow` to navigate to `/properties/{slug}` instead of calling `openBooking({ mode: 'direct', property })`
- The property detail page already has the proper booking widget
- The card already links to the property page on regular click -- so the hover CTA becomes a more prominent version of the same action

### 3. UnifiedBookingDialog: Remove "Direct" Mode

With QuickBookCard no longer opening the dialog in direct mode, `UnifiedBookingDialog` becomes a pure discovery/search tool.

**File:** `src/components/booking/UnifiedBookingDialog.tsx`
- Remove the `direct` mode branch and related step-skipping logic
- Simplify to always start at `search` step
- This makes the dialog's purpose unambiguous: find a property, then go to its page

**File:** `src/contexts/BookingContext.tsx`
- Remove `BookingMode` type and `mode` state (optional cleanup -- can also just leave it unused)

### 4. MobileBookingCTA: Share State with BookingWidget

Currently `BookingWidget` (desktop) and `MobileBookingCTA` (mobile) each maintain their own `checkIn`, `checkOut`, `guests`, and price calculations. This means if a user somehow switches between desktop and mobile views, or if any shared logic is needed, the two are completely disconnected.

**Approach:** Extract shared property-booking state into a small hook.

**New file:** `src/hooks/usePropertyBookingState.ts`
- Manages: `checkIn`, `checkOut`, `guests`, derived `nights`, derived price calculations
- Accepts: `property`, `specialOffer` as inputs
- Returns: all state + setters + computed values (nights, total, formatted prices)
- Both `BookingWidget` and `MobileBookingCTA` consume this hook instead of managing their own state

**Files modified:**
- `src/components/booking/BookingWidget.tsx` -- replace local state with hook
- `src/components/booking/MobileBookingCTA.tsx` -- replace local state with hook

To share state between the two components (since both render on the property page simultaneously), the hook should use React context scoped to the property detail page, or be lifted into `PropertyDetail.tsx` and passed down as props.

**Recommended approach:** Lift state into `PropertyDetail.tsx`, pass down via props. This is the simplest pattern and avoids creating another context.

### 5. Summary of Final Component Responsibilities

| Component | Scope | Flow |
|---|---|---|
| `HeaderSearchToggle` | Header (non-property pages) | Opens discovery dialog |
| `FloatingBookButton` | Non-property pages only | Opens discovery dialog |
| `UnifiedBookingDialog` | Global overlay | Discovery: search, browse, then navigate to property page |
| `BookingWidget` | Property page, desktop only | Property booking (dates, guests, price, CTA) |
| `MobileBookingCTA` | Property page, mobile only | Same property booking, mobile-optimized layout |

## Technical Details

### usePropertyBookingState hook

```text
Input: property, specialOffer
State: checkIn, checkOut, guests
Derived: nights, baseTotal, discountAmount, totalPrice, formatted prices
Methods: handleDateSelect, setGuests, handleInstantBook, handleRequestBooking
```

### PropertyDetail.tsx changes

```text
const bookingState = usePropertyBookingState(property, activeOffer);

// Desktop
<BookingWidget {...bookingState} property={property} />

// Mobile
<MobileBookingCTA {...bookingState} property={property} />
```

### Files touched (6 files)

1. `src/hooks/usePropertyBookingState.ts` -- NEW: shared booking state hook
2. `src/components/booking/FloatingBookButton.tsx` -- hide on property pages
3. `src/components/booking/QuickBookCard.tsx` -- navigate instead of opening dialog
4. `src/components/booking/UnifiedBookingDialog.tsx` -- remove direct mode
5. `src/components/booking/BookingWidget.tsx` -- consume shared state
6. `src/components/booking/MobileBookingCTA.tsx` -- consume shared state
7. `src/pages/PropertyDetail.tsx` -- lift booking state, pass to both components

### What does NOT change

- No database, Supabase, or backend changes
- No booking calculation logic changes (same math, just moved into hook)
- No checkout or payment flow changes
- No changes to `useBookingEngine`, `useCompleteBooking`, or `useCheckoutFlow`
- Desktop BookingWidget visual design unchanged
- Mobile MobileBookingCTA visual design unchanged

