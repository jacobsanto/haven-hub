

## Combined Implementation: Real-Time Availability from First Search + Complete Booking Flow

This implementation combines two critical features:
1. **Real-time availability display from the first search** - so guests see blocked dates immediately, not just at checkout
2. **Complete booking submission flow** - connecting Checkout.tsx to the database and PMS with instant vs request booking logic

---

### Part 1: Real-Time Availability from First Search

#### Current Problem
The `UnifiedBookingDialog` uses the standard `Calendar` component which only disables past dates. Guests can select dates that are actually blocked by existing bookings or PMS sync, leading to frustration at checkout.

#### Solution
Replace the `Calendar` component with `AvailabilityCalendar` (which already exists and works in Checkout.tsx) and add real-time subscriptions.

#### Files to Modify

**1. `src/components/booking/AvailabilityCalendar.tsx`**
- Add `variant` prop: `"full"` (default, used in checkout) or `"compact"` (used in dialog)
- Compact variant hides the legend row and per-day prices for cleaner dialog UI
- Add `showPrices` optional prop to control price display independently

**2. `src/components/booking/UnifiedBookingDialog.tsx`**
- Import `AvailabilityCalendar` component
- Import `useRealtimeAvailability` hook for live updates
- Replace the basic `Calendar` at lines 218-225 (search step) - keep basic calendar here since no property selected
- Replace the basic `Calendar` at lines 366-373 (dates step) with `AvailabilityCalendar`
- Add `useRealtimeAvailability(selectedProperty?.id)` to subscribe to live changes
- Adapt date selection callback to work with AvailabilityCalendar's API

---

### Part 2: Complete Booking Submission Flow

#### Current Problem
- `handleProceedToPayment` in Checkout.tsx is a placeholder (shows "Stripe integration pending")
- `useCreateBooking` hook inserts booking but never pushes to PMS
- `pms_sync_status` stays "pending" forever
- Admin can confirm bookings but this doesn't trigger PMS sync

#### Solution
Create a `useCompleteBooking` hook that orchestrates the full booking submission, and update the admin flow to trigger PMS sync on confirmation.

#### New Files to Create

**1. `src/hooks/useCompleteBooking.ts`**
New hook that orchestrates the complete booking submission:

| Step | Action |
|------|--------|
| 1 | Final availability validation (double-check dates still available) |
| 2 | Create booking record with appropriate status based on `instant_booking` flag |
| 3 | Insert price breakdown line items to `booking_price_breakdown` |
| 4 | Insert selected addons to `booking_addons` |
| 5 | If instant booking: Call `advancecm-sync` with `create-booking` action |
| 6 | Update booking with `external_booking_id` and `pms_sync_status` |
| 7 | Release checkout hold |
| 8 | Return booking reference for confirmation page |

```text
Flow for Instant Booking Property:
  Checkout Submit
       ↓
  useCompleteBooking
       ↓
  Insert booking (status: 'confirmed')
       ↓
  Insert price breakdown + addons
       ↓
  Call advancecm-sync (create-booking)
       ↓
  Update pms_sync_status = 'synced'
       ↓
  Navigate to /booking/confirm?ref=BK-XXXXXX

Flow for Non-Instant Property:
  Checkout Submit
       ↓
  useCompleteBooking
       ↓
  Insert booking (status: 'pending')
       ↓
  Insert price breakdown + addons
       ↓
  (No PMS sync yet)
       ↓
  Navigate to /booking/confirm?ref=BK-XXXXXX
       ↓
  Admin confirms in dashboard
       ↓
  Call advancecm-sync (create-booking)
       ↓
  Update pms_sync_status = 'synced'
```

#### Files to Modify

**2. `src/pages/Checkout.tsx`**
- Import and use `useCompleteBooking` hook
- Replace placeholder `handleProceedToPayment` with actual booking submission
- Pass all collected data (guestInfo, addons, priceBreakdown, coupon, paymentType)
- On success: Navigate to `/booking/confirm` with booking reference as URL param
- On error: Show toast and keep user on checkout page

**3. `src/pages/BookingConfirm.tsx`**
- Accept booking reference from URL params (not just location state)
- Fetch booking details from database using reference
- Display confirmation number prominently
- Show different messaging for instant (confirmed) vs request (pending) bookings
- Add "What happens next?" section appropriate to booking status

**4. `src/hooks/useBookings.ts`**
- Add `useConfirmBookingWithPMS` mutation hook
- When admin confirms a pending booking, this hook:
  1. Updates booking status to 'confirmed'
  2. Fetches the property mapping to get `external_property_id`
  3. Calls `advancecm-sync` with `create-booking` action
  4. Updates `pms_sync_status` and `external_booking_id`

**5. `src/pages/admin/AdminBookings.tsx`**
- Update confirm button to use new `useConfirmBookingWithPMS` hook
- Show loading state while PMS sync is in progress
- Toast feedback on success/failure

**6. `src/components/admin/BookingDetailDialog.tsx`**
- Implement `handleRetrySync` function (currently placeholder)
- Call `advancecm-sync` with `create-booking` action for retry

---

### Technical Implementation Details

#### AvailabilityCalendar Compact Variant

```tsx
// New props interface
interface AvailabilityCalendarProps {
  propertyId: string;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
  onDateSelect: (date: Date, type: 'checkIn' | 'checkOut') => void;
  minStay?: number;
  className?: string;
  variant?: 'full' | 'compact';  // NEW
  showPrices?: boolean;           // NEW
}
```

Changes for compact variant:
- Hide legend row (Selected/In Range/Unavailable indicators)
- Hide per-day price displays below dates
- Reduce padding/margins for dialog fit
- Single month on mobile, dual on desktop (existing behavior)

#### useCompleteBooking Hook Interface

```tsx
interface CompleteBookingParams {
  propertyId: string;
  property: {
    id: string;
    name: string;
    slug: string;
    instant_booking: boolean;
  };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  guestInfo: BookingGuestWithCounts;
  selectedAddons: SelectedAddon[];
  priceBreakdown: PriceBreakdown;
  appliedCoupon?: CouponPromo;
  paymentType: PaymentType;
  holdId?: string;
  sessionId: string;
}

interface CompleteBookingResult {
  bookingId: string;
  bookingReference: string;
  status: 'confirmed' | 'pending';
  pmsSyncStatus: 'synced' | 'pending' | 'failed';
  externalBookingId?: string;
}
```

#### PMS Sync Integration

The existing `advancecm-sync` edge function already has a `create-booking` action. The hook will call it with:

```typescript
await supabase.functions.invoke('advancecm-sync', {
  body: {
    action: 'create-booking',
    externalPropertyId: propertyMapping.external_property_id,
    bookingReference: booking.booking_reference,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    guests: booking.guests,
    adults: booking.adults,
    children: booking.children,
    guestInfo: {
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      email: guestInfo.email,
      phone: guestInfo.phone,
      country: guestInfo.country,
    },
    totalPrice: priceBreakdown.total,
    currency: 'EUR',
    priceBreakdownNotes: formatBreakdownForPMS(priceBreakdown),
  },
});
```

---

### Database Interaction Flow

```text
1. INSERT booking → bookings table
   - booking_reference: auto-generated BK-YYYYMM-XXXX
   - status: 'confirmed' (instant) or 'pending' (request)
   - pms_sync_status: 'pending'

2. INSERT price breakdown → booking_price_breakdown table
   - One row per line item (accommodation, fees, taxes, addons, discount)

3. INSERT addons → booking_addons table
   - One row per selected addon with quantity

4. IF instant_booking:
   - Call advancecm-sync create-booking
   - UPDATE bookings SET external_booking_id, pms_sync_status='synced'

5. UPDATE checkout_holds SET released=true
```

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/booking/AvailabilityCalendar.tsx` | Modify | Add compact variant |
| `src/components/booking/UnifiedBookingDialog.tsx` | Modify | Use AvailabilityCalendar + realtime |
| `src/hooks/useCompleteBooking.ts` | Create | Orchestrate full booking submission |
| `src/pages/Checkout.tsx` | Modify | Connect to useCompleteBooking |
| `src/pages/BookingConfirm.tsx` | Modify | Fetch by reference, show status |
| `src/hooks/useBookings.ts` | Modify | Add useConfirmBookingWithPMS |
| `src/pages/admin/AdminBookings.tsx` | Modify | Use new confirm hook |
| `src/components/admin/BookingDetailDialog.tsx` | Modify | Implement retry sync |

---

### Benefits

1. **Early visibility**: Guests see blocked dates from the first search step
2. **Real-time updates**: If another user books while browsing, calendar updates instantly
3. **Complete flow**: Booking data actually saved to database with full breakdown
4. **PMS integration**: Instant bookings pushed to Tokeet immediately
5. **Admin control**: Non-instant properties require approval before PMS sync
6. **Audit trail**: Price breakdown and addons stored for records
7. **Resilience**: Failed syncs can be retried from admin dashboard

