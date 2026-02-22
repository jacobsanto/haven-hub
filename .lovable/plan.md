
# Header Search Bar Visibility and Availability Calendar

## 1. Hide Header Search Bar on Homepage

The search bar should only appear on non-homepage routes.

### `src/components/layout/Header.tsx`
- Add a `showSearch` condition: `const showSearch = location.pathname !== '/';`
- Wrap the search bar container with this condition: `{showSearch && (...)}`
- On the homepage (`/`), the search bar will be hidden, giving the hero section full focus
- On all other pages (`/properties`, `/destinations`, etc.), the search bar remains visible in the header

### `src/components/search/HeaderSearchBar.tsx`
- No changes needed -- the component itself stays the same; visibility is controlled by the parent

## 2. Property Availability Calendar (Already Implemented)

The system already has a fully functional availability calendar synced with the local database:

- **`AvailabilityCalendar` component** (`src/components/booking/AvailabilityCalendar.tsx`) renders date grids with availability, pricing, and selection logic
- **`useAvailabilityCalendar` hook** (`src/hooks/useCheckoutFlow.ts`) reads from the local `availability` table (synced from PMS), merges with checkout holds and direct bookings
- **`useRealtimeAvailability` hook** (`src/hooks/useRealtimeAvailability.ts`) subscribes to Supabase Realtime on `availability`, `bookings`, and `checkout_holds` tables, instantly invalidating queries when data changes
- The calendar is used in `BookingWidget`, `MobileBookingCTA`, `UnifiedBookingDialog`, and the `Checkout` page

No code changes are needed for the availability calendar -- it is already synced with the local database and reflects real-time booking slots.

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Add `showSearch` condition to hide search bar on `/` |

This is a single-line logic change in the Header component.
