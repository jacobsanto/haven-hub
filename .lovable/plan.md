# Haven Hub - Implementation Plan

## Current Status: ✅ Availability Calendar Fixes Complete

Last updated: 2026-02-04

---

## Completed: Availability Calendar Audit & Fixes

### Fixed Issues

**Bug 1: Real-time Query Invalidation (FIXED ✅)**
- Added `availability-calendar` query key invalidation to `useRealtimeAvailability` hook
- All real-time changes now properly refresh visible calendars

**Bug 2: Unified Calendars (FIXED ✅)**
- All guest-facing calendars now use `AvailabilityCalendar` component:
  - `BookingWidget.tsx` - Property detail page popovers
  - `PropertySelectorDialog.tsx` - Booking dialog modal
  - `MobileBookingCTA.tsx` - Mobile date picker panel
  - `UnifiedBookingDialog.tsx` - Already had correct implementation

**Bug 3: Property Timezone Support (FIXED ✅)**
- Added `usePropertyTimezone` hook to fetch property timezone
- Calendar now uses property timezone for "today" calculation
- Prevents off-by-one errors for international users

### Files Modified

| File | Changes |
|------|---------|
| `src/hooks/useRealtimeAvailability.ts` | Added `availability-calendar` invalidation |
| `src/hooks/useCheckoutFlow.ts` | Added `usePropertyTimezone` hook and `date-fns-tz` import |
| `src/components/booking/AvailabilityCalendar.tsx` | Added timezone-aware date handling |
| `src/components/booking/BookingWidget.tsx` | Replaced Calendar with AvailabilityCalendar + real-time hook |
| `src/components/booking/PropertySelectorDialog.tsx` | Replaced Calendar with AvailabilityCalendar + real-time hook |
| `src/components/booking/MobileBookingCTA.tsx` | Replaced Calendar with AvailabilityCalendar + real-time hook |

### Dependencies Added

- `date-fns-tz` - Timezone support for date calculations

---

## Expected Outcome

All calendars will now show the same blocked dates for the same property:
- Feb 1-2: Available
- Feb 3: Blocked (STELLA)
- Feb 4-9: Available
- Feb 10: Blocked (James)
- Feb 11-13: Available
- Feb 14+: Blocked (Manoj Katwal through Mar 17)

This matches across:
- Property page booking widget
- "Find Your Perfect Stay" modal
- Checkout page
- Mobile booking CTA

---

## Architecture Summary

```
Guest-Facing Calendar Flow:
┌──────────────────────────────────────────────────────────────┐
│ AvailabilityCalendar Component                                │
│   └── useAvailabilityCalendar hook                            │
│         └── Fetches from 3 sources:                           │
│             1. availability table (PMS-synced blocks)         │
│             2. bookings table (local confirmed/pending)       │
│             3. checkout_holds table (temporary 10-min locks)  │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ Real-time Updates via useRealtimeAvailability                 │
│   └── Subscribes to postgres_changes on:                      │
│       • availability table                                    │
│       • bookings table                                        │
│       • checkout_holds table                                  │
│   └── Instantly invalidates availability-calendar queries    │
└──────────────────────────────────────────────────────────────┘
```

### Source of Truth Hierarchy

1. **Tokeet/AdvanceCM** - External PMS (availability, rates, external bookings)
2. **Local bookings table** - Haven Hub direct bookings
3. **checkout_holds table** - Temporary 10-minute locks during checkout

---

## Previous: Admin Availability Section Removed

The Admin Availability section was removed as Tokeet/AdvanceCM is the single source of truth for availability. Manual overrides created operational risk by being overwritten by the 5-minute sync.
