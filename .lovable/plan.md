

# Availability Calendar Audit & Fix Plan

## Executive Summary

I've identified the root cause of the calendar availability issues across all your guest-facing booking components.

---

## Problem Analysis

### Current Data State (Centro House)
```text
Property ID: 73c9e26e-9f09-4989-b3ab-00b0c7685848
PMS Status: Sync working (last: 2026-02-03 23:10)
PMS Data: 620 blocked dates, 28 bookings synced
```

### Availability Table Status
Feb 2026 blocked dates in database:
- Feb 3 (STELLA booking)
- Feb 10 (James booking)
- Feb 14-28+ (Manoj Katwal booking through Mar 17)
- Continuing into March...

### Real Issue: THREE CRITICAL BUGS

**Bug 1: Real-time hook NOT invalidating the calendar query**

The `useRealtimeAvailability` hook invalidates these query keys:
```typescript
queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
queryClient.invalidateQueries({ queryKey: ['check-availability'] });
```

But the calendar uses a DIFFERENT query key:
```typescript
queryKey: ['availability-calendar', propertyId, startDate, endDate]
```

So real-time changes NEVER refresh the actual calendar!

**Bug 2: Some calendars don't use AvailabilityCalendar at all**

Components using the wrong calendar:
| Component | Uses | Problem |
|-----------|------|---------|
| PropertyDetailPage BookingWidget | `<CalendarComponent>` (react-day-picker) | No availability data, no PMS sync |
| UnifiedBookingDialog (no property selected) | `<Calendar>` (shadcn) | No availability blocking |
| PropertySelectorDialog | `<Calendar>` | No property-specific blocking |
| MobileBookingCTA | `<Calendar>` | No availability blocking |

These show ALL dates as available because they don't fetch availability data.

**Bug 3: Property timezone not applied**

The `properties` table has a `timezone` column (default: `Europe/Athens`), but:
- Date comparisons use browser-local `new Date()`
- No timezone conversion for "today" cutoff
- Can cause off-by-one errors for users in different timezones

---

## Fix Strategy

### Phase 1: Fix Real-time Query Invalidation

**File:** `src/hooks/useRealtimeAvailability.ts`

Add invalidation for the calendar-specific query key:
```typescript
// Current (BROKEN)
queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });

// Fixed (ADD)
queryClient.invalidateQueries({ queryKey: ['availability-calendar'] }); // Invalidate ALL calendar queries
```

### Phase 2: Unify Calendars to Use AvailabilityCalendar

Replace standalone `<Calendar>` components with the property-aware `<AvailabilityCalendar>` component:

| File | Change |
|------|--------|
| `src/components/booking/BookingWidget.tsx` | Replace CalendarComponent with AvailabilityCalendar |
| `src/components/booking/UnifiedBookingDialog.tsx` | Always use AvailabilityCalendar (show "select property first" if none) |
| `src/components/booking/PropertySelectorDialog.tsx` | Use AvailabilityCalendar after property selection |
| `src/components/booking/MobileBookingCTA.tsx` | Use AvailabilityCalendar |

### Phase 3: Property Timezone Handling

**File:** `src/hooks/useCheckoutFlow.ts`

Add timezone-aware date handling:
```typescript
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Get "today" in property's timezone
const propertyTimezone = property?.timezone || 'Europe/Athens';
const todayInPropertyTz = startOfDay(toZonedTime(new Date(), propertyTimezone));
```

**Note:** This requires adding the `date-fns-tz` package.

### Phase 4: Ensure Real-time Subscription Everywhere

Currently `useRealtimeAvailability` is only used in:
- UnifiedBookingDialog (if property selected)
- Checkout page

Add to:
- BookingWidget (property detail page)
- MobileBookingCTA

---

## Technical Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useRealtimeAvailability.ts` | Add `availability-calendar` invalidation |
| `src/components/booking/BookingWidget.tsx` | Replace with AvailabilityCalendar, add realtime hook |
| `src/components/booking/UnifiedBookingDialog.tsx` | Always use AvailabilityCalendar |
| `src/components/booking/PropertySelectorDialog.tsx` | Add availability after property selection |
| `src/components/booking/MobileBookingCTA.tsx` | Use AvailabilityCalendar, add realtime |
| `src/hooks/useCheckoutFlow.ts` | Add timezone-aware date handling |

### New Dependency

```bash
npm install date-fns-tz
```

---

## Expected Outcome

After these fixes:
1. All calendars will show the same blocked dates for the same property
2. When PMS sync runs (every 5 minutes), all visible calendars will instantly update
3. When a checkout hold is created, all calendars will block those dates in real-time
4. Timezone handling will prevent off-by-one errors for international users
5. The Feb 14 - Mar 17 Manoj Katwal booking will correctly show as blocked everywhere

---

## Verification After Fix

```text
Centro House (Feb 2026):
- Feb 1-2: Available
- Feb 3: Blocked (STELLA)
- Feb 4-9: Available
- Feb 10: Blocked (James)
- Feb 11-13: Available
- Feb 14+: Blocked (Manoj Katwal through Mar 17)
```

This should match across:
- Property page booking widget
- "Find Your Perfect Stay" modal
- Checkout page
- Mobile booking CTA

