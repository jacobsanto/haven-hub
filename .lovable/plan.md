

# QuickBookCard as the Primary Booking Entry Point

## Goal

Make the QuickBookCard's "Instant Book" / "Book Now" button the **foundational booking interaction** across the entire site. When clicked on any property card (homepage, listings, destinations), a lightweight property-specific booking popup appears -- no multi-step wizard, no page navigation.

The FloatingBookButton remains visible on all pages.

## What Changes

### 1. New Component: `PropertyBookingPopup`

A focused dialog/sheet that handles one property's booking flow in a single screen.

**Contents (single view, no steps):**
- Property thumbnail + name (compact header)
- Availability calendar (using existing `AvailabilityCalendar`)
- Guest selector (reuses same +/- pattern)
- Price breakdown (line items + total with 0.25s fade animation)
- Full-width CTA button ("Book & Pay Now" for instant, "Request Booking" for non-instant)

**Rendering:**
- Desktop: `Dialog` (Radix) centered, ~480px wide
- Mobile: `Drawer` (vaul) sliding from bottom, 90vh

**State:** Uses `usePropertyBookingState` hook internally -- the same hook already powering the property detail page. No new state management needed.

**Styling:** Matches existing design system -- white background, `border-[rgba(30,60,120,0.08)]`, blue gradient CTA, 8px spacing scale.

**File:** `src/components/booking/PropertyBookingPopup.tsx`

### 2. Update `QuickBookCard`

Change `handleBookNow` from `navigate('/properties/...')` to opening the new `PropertyBookingPopup`.

- Add local state: `const [bookingOpen, setBookingOpen] = useState(false)`
- `handleBookNow` sets `bookingOpen = true` instead of navigating
- Render `<PropertyBookingPopup>` inside the card component, controlled by `bookingOpen`

**File:** `src/components/booking/QuickBookCard.tsx`

### 3. FloatingBookButton stays as-is

Already re-enabled on all pages. No changes needed. It continues to open the discovery flow (`UnifiedBookingDialog`) for users who don't have a property in mind.

### 4. BookingContext `direct` mode cleanup

The `direct` mode in BookingContext is now unused (nothing calls `openBooking({ mode: 'direct' })`). The new popup manages its own state via the hook. No context changes needed -- `direct` mode can stay as dead code for now or be removed as optional cleanup.

## What Does NOT Change

- No database, backend, or booking logic changes
- `BookingWidget` (desktop property page) unchanged
- `MobileBookingCTA` (mobile property page) unchanged
- `UnifiedBookingDialog` (discovery flow) unchanged
- `usePropertyBookingState` hook unchanged (reused as-is)
- `useBookingEngine`, `useCompleteBooking`, `useCheckoutFlow` untouched
- All existing checkout and payment flows remain identical

## Component Responsibility Summary After Changes

| Component | Where | Purpose |
|---|---|---|
| **PropertyBookingPopup** (NEW) | Anywhere a property card exists | Quick single-screen booking for a known property |
| QuickBookCard | Homepage, listings, destinations | Property card -- "Instant Book" opens PropertyBookingPopup |
| FloatingBookButton | All pages | Opens discovery flow (UnifiedBookingDialog) |
| HeaderSearchToggle | Header (non-property pages) | Opens discovery flow |
| UnifiedBookingDialog | Global overlay | Discovery: search destinations, browse properties |
| BookingWidget | Property detail (desktop) | Full booking widget with calendar + price |
| MobileBookingCTA | Property detail (mobile) | Sticky bar with expandable booking sections |

## Technical Details

### PropertyBookingPopup Props

```text
interface PropertyBookingPopupProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Internal Structure

```text
PropertyBookingPopup
  -- usePropertyBookingState(property, specialOffer)  // reuse existing hook
  -- useActiveSpecialOffer(property.id)               // reuse existing hook
  -- useIsMobile()                                    // for Dialog vs Drawer
  -- AvailabilityCalendar (compact variant)
  -- Guest +/- controls
  -- Price breakdown (same math as BookingWidget)
  -- CTA button -> handleInstantBook or handleRequestBooking
```

### Files Touched

1. `src/components/booking/PropertyBookingPopup.tsx` -- NEW
2. `src/components/booking/QuickBookCard.tsx` -- wire up popup instead of navigate

