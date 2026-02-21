

# PropertyBookingPopup Refinement + FloatingBookButton Redesign

## Problem 1: PropertyBookingPopup Calendar Overflow

The `PropertyBookingPopup` renders the `AvailabilityCalendar` (which shows 2 months side-by-side on desktop) inside a `Dialog` capped at `max-w-[480px]`. Two calendar months at ~320px each overflow that container badly. On mobile the `Drawer` fares slightly better but still has no scroll containment for the calendar section specifically.

Additionally, there is a console warning about `AnimatePresence` receiving a ref on a function component inside the popup.

### Fix

**File: `src/components/booking/PropertyBookingPopup.tsx`**

- Widen the desktop `DialogContent` to `max-w-lg` (512px) -- enough for a single compact month with breathing room but not awkwardly wide.
- Force the `AvailabilityCalendar` to always render **1 month** inside the popup regardless of screen width, by passing a new `numberOfMonths={1}` prop. The popup is a quick-action context -- two months is unnecessary here.
- Wrap the calendar area in a container with `overflow-hidden` to prevent any bleed.
- Fix the `AnimatePresence` ref warning by ensuring the child `motion.div` is the direct child (no intermediate wrapper issues).

**File: `src/components/booking/AvailabilityCalendar.tsx`**

- Add an optional `numberOfMonths` prop that overrides the automatic `isMobile ? 1 : 2` logic. When the popup passes `numberOfMonths={1}`, the calendar renders a single month regardless of screen size.

## Problem 2: FloatingBookButton + UnifiedBookingDialog Redesign

The `FloatingBookButton` opens the `UnifiedBookingDialog` which has a poor discovery experience:
- Step 1 ("search") crams destination grid + full calendar + guest picker + date summary into one screen -- visually cluttered and functionally confusing.
- The destination grid tiles are small, text-only, and not visually inviting.
- The multi-step flow (search -> property -> dates -> guests) has too many steps for a discovery task.
- The button itself is a plain circle with a calendar icon -- not communicating its purpose well enough.

### Redesign Strategy

Collapse the 4-step flow into a **2-step** flow:

1. **Step 1 -- "Where & When"**: Destination cards (with images) + inline date picker + guest count -- all on one well-organized screen with clear visual hierarchy.
2. **Step 2 -- "Choose Property"**: Filtered property list with price, thumbnail, key stats. Selecting a property navigates directly to its detail page (where the booking widget takes over) or opens the `PropertyBookingPopup`.

This eliminates the "dates" and "guests" as separate steps since they are simple controls that fit naturally alongside the destination selection.

### Changes

**File: `src/components/booking/FloatingBookButton.tsx`**

- Redesign the button to be more visually distinct and purposeful:
  - Desktop: pill-shaped button with "Find a Stay" label always visible (not just on hover), subtle pulsing ring animation on mount, elevated shadow.
  - Mobile: rounded pill with "Search" text + search icon (not just a bare circle), positioned bottom-center instead of bottom-right so it does not compete with `MobileBookingCTA` on property pages.
- Hide on property detail pages (same as `HeaderSearchToggle` pattern) since `MobileBookingCTA` and `BookingWidget` own that context.

**File: `src/components/booking/UnifiedBookingDialog.tsx`**

Major refactor to a 2-step flow:

- **Step 1 -- "Where & When"** (replaces old "search" step):
  - Destination cards displayed as a horizontal scrollable row with destination images (from the `destinations` table `image_url`), name overlay, and selection highlight. Much more visual than the current text-only grid.
  - An "All Destinations" chip at the start of the row.
  - Below destinations: compact calendar (1 month on mobile, 2 on desktop) using the standard `Calendar` component.
  - Below calendar: guest counter row (same +/- pattern).
  - Single CTA: "Search Properties" -- navigates to `/properties?location=X&guests=N&checkIn=...&checkOut=...`.

- **Step 2 -- "Choose Property"** (replaces old "property" step):
  - Shows filtered property cards in a scroll area.
  - Each card shows image, name, location, beds, guests, price.
  - Clicking a card navigates to `/properties/{slug}` and closes the dialog. The property page's booking widget handles the rest.
  - Remove the old steps 3 ("dates") and 4 ("guests") entirely -- they are redundant since step 1 already collected that info and the property page provides a better date-picking experience with real availability data.

- Step indicator simplified to 2 dots/steps instead of 4.
- Remove `handleProceed` (which navigated to `/checkout`) -- the flow now always goes through the property page first, which is the correct architecture (property page validates availability, shows real pricing, and routes to checkout).

**File: `src/contexts/BookingContext.tsx`**

- Clean up `BookingMode` type: remove `'direct'` since nothing uses it after previous consolidation. Keep `'search'` as the only mode.

### Visual Design Notes

- Destination cards: aspect-ratio 3:2, rounded-xl, image with gradient overlay, name in white at bottom-left, selected state has a primary-colored ring.
- Dialog/Drawer sizing: desktop `sm:max-w-2xl` (unchanged), mobile `max-h-[90vh]` (unchanged).
- CTA button uses the blue gradient style consistent with the rest of the booking system.
- Step indicator: 2 simple dots with connecting line, not numbered circles.

## Files Touched

1. `src/components/booking/PropertyBookingPopup.tsx` -- fix overflow, force single-month calendar, fix AnimatePresence ref warning
2. `src/components/booking/AvailabilityCalendar.tsx` -- add `numberOfMonths` override prop
3. `src/components/booking/FloatingBookButton.tsx` -- redesign button, hide on property pages
4. `src/components/booking/UnifiedBookingDialog.tsx` -- collapse to 2-step flow, visual destination cards, remove redundant steps
5. `src/contexts/BookingContext.tsx` -- clean up unused `direct` mode

## What Does NOT Change

- No database or backend changes
- No changes to `BookingWidget`, `MobileBookingCTA`, `QuickBookCard`, or `PropertyBookingPopup` logic (only popup sizing/calendar fix)
- No changes to checkout, payment, or booking engine logic
- No changes to `usePropertyBookingState` hook

