

# Complete Booking Engine & Two-Way PMS Sync Plan

## Overview

This plan establishes your system as the **Pricing Brain** (managing all rates, fees, loyalty, add-ons locally) while the PMS serves as the **Availability Brain**. When bookings are made through your system, they are pushed to Tokeet to block dates and sync across all channels.

---

## Architecture Decision

| Data | Direction | Source of Truth |
|------|-----------|-----------------|
| Properties | PMS → You | Import basic info only (beds, baths, location) |
| Availability | PMS → You | Real-time sync from Tokeet |
| **Rates/Pricing** | **You manage** | Local only - NOT imported from PMS |
| **Add-ons, Fees, Loyalty** | **You manage** | Local only |
| **Bookings** | **You → PMS** | Created locally, pushed to Tokeet |

---

## Part 1: Database Schema Enhancements

### 1.1 Expand `bookings` Table

Match AdvanceCM structure with new columns:

| Column | Type | Purpose |
|--------|------|---------|
| `booking_reference` | text | Auto-generated (BK-202601-A7X3) |
| `adults` | integer | Adult guest count |
| `children` | integer | Child guest count |
| `check_in_time` | time | Default from property |
| `check_out_time` | time | Default from property |
| `source` | text | 'direct', 'booking_com', 'airbnb', etc. |
| `payment_status` | text | 'unpaid', 'partial', 'paid', 'refunded' |
| `guest_country` | text | Guest's country |
| `external_booking_id` | text | PMS booking reference |
| `pms_sync_status` | text | 'pending', 'synced', 'failed' |
| `pms_synced_at` | timestamptz | Last sync timestamp |

### 1.2 Create `booking_price_breakdown` Table

Store itemized pricing for each booking (matching AdvanceCM detail view):

```sql
CREATE TABLE booking_price_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  line_type text NOT NULL, -- 'accommodation', 'addon', 'fee', 'tax', 'discount'
  label text NOT NULL,
  amount numeric NOT NULL,
  quantity integer DEFAULT 1,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
```

### 1.3 Create `security_deposits` Table

```sql
CREATE TABLE security_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'pending', -- 'pending', 'held', 'released', 'claimed'
  held_at timestamptz,
  released_at timestamptz,
  stripe_charge_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

### 1.4 Add Property Settings

```sql
ALTER TABLE properties ADD COLUMN timezone text DEFAULT 'Europe/Athens';
ALTER TABLE properties ADD COLUMN check_in_time time DEFAULT '14:00';
ALTER TABLE properties ADD COLUMN check_out_time time DEFAULT '11:00';
```

---

## Part 2: Real-Time Availability Sync

### 2.1 Enable Supabase Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE availability;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE checkout_holds;
```

### 2.2 Create `useRealtimeAvailability` Hook

**File:** `src/hooks/useRealtimeAvailability.ts`

```typescript
export function useRealtimeAvailability(propertyId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`availability-${propertyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `property_id=eq.${propertyId}`,
      }, () => {
        // Instant invalidation - zero perceived latency
        queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['check-availability'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `property_id=eq.${propertyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkout_holds',
        filter: `property_id=eq.${propertyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [propertyId, queryClient]);
}
```

### 2.3 PMS Availability Pull Sync

Add `sync-availability` action to edge function:
- Fetch availability calendar from Tokeet
- Compare with local `availability` table
- Update blocked dates
- Can be scheduled (cron) or manual trigger

---

## Part 3: CSV Import for Seasonal Rates

### 3.1 CSV Format Specification

```csv
property_slug,season_name,start_date,end_date,nightly_rate,price_multiplier
villa-amersa,High Season,2026-07-01,2026-08-31,450,
villa-amersa,Low Season,2026-11-01,2026-12-20,,0.75
santorini-retreat,Peak Season,2026-06-15,2026-09-15,600,
```

- Either `nightly_rate` OR `price_multiplier` (not both)
- Property matched by slug
- Dates in YYYY-MM-DD format

### 3.2 Implementation

**New Admin Page:** `src/pages/admin/AdminSeasonalRatesImport.tsx`

Features:
- Drag-and-drop CSV upload
- Preview table with validation status
- Property slug validation
- Date overlap warnings
- Import all / selective import
- Download template CSV
- Error report for failed rows

**New Edge Function:** `supabase/functions/seasonal-rates-import/index.ts`

- Parse CSV
- Validate property slugs exist
- Check for date overlaps
- Upsert seasonal rates
- Return detailed report

---

## Part 4: Push Bookings to PMS (Two-Way Sync)

### 4.1 Data Pushed to Tokeet

When booking is confirmed:

```typescript
{
  rental_id: "tokeet-property-pkey",
  check_in: "2026-03-15",
  check_out: "2026-03-20",
  num_guests: 4,
  price: 2850.00,           // Your calculated final price
  currency: "EUR",
  source: "Direct Website",
  status: "booked",
  
  guest: {
    name: "John Smith",
    email: "john@example.com",
    phone: "+1234567890"
  },
  
  // Rich notes with your pricing details
  notes: `
    Booking Ref: BK-202603-A7X3
    Adults: 2, Children: 2
    
    === Price Breakdown ===
    Accommodation (5 nights): €2,500
    Airport Transfer: €120
    Chef Service: €300
    Cleaning Fee: €150
    Tourism Tax: €50
    Coupon SUMMER10: -€270
    
    Total: €2,850
    
    === Loyalty ===
    Points Earned: 285
    
    === Special Requests ===
    Late check-out requested
  `
}
```

### 4.2 Edge Function: `create-booking` Action

**Add to:** `supabase/functions/advancecm-sync/index.ts`

```typescript
case "create-booking": {
  const { 
    externalPropertyId,
    bookingReference,
    checkIn,
    checkOut,
    guests,
    adults,
    children,
    guestInfo,
    totalPrice,
    currency,
    priceBreakdownNotes,
    specialRequests
  } = body;

  // Create guest in Tokeet
  const guestResponse = await fetch(
    `https://capi.tokeet.com/v1/guest?account=${accountId}`,
    {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        email: guestInfo.email,
        phone: guestInfo.phone,
        country: guestInfo.country
      })
    }
  );

  // Create booking/inquiry in Tokeet
  const bookingResponse = await fetch(
    `https://capi.tokeet.com/v1/inquiry?account=${accountId}`,
    {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rental_id: externalPropertyId,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: guests,
        num_adults: adults,
        num_child: children,
        price: totalPrice,
        currency: currency || 'EUR',
        source: 'Direct Website',
        status: 'booked',
        confirmation_code: bookingReference,
        notes: priceBreakdownNotes
      })
    }
  );

  const bookingData = await bookingResponse.json();
  
  return { 
    success: true, 
    externalBookingId: bookingData.pkey 
  };
}
```

### 4.3 Cancel Booking Action

```typescript
case "cancel-booking": {
  const { externalBookingId, cancellationReason } = body;
  
  // Update inquiry status to cancelled in Tokeet
  await fetch(
    `https://capi.tokeet.com/v1/inquiry/${externalBookingId}?account=${accountId}`,
    {
      method: 'PUT',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'cancelled',
        notes: `Cancelled: ${cancellationReason}`
      })
    }
  );
  
  return { success: true };
}
```

### 4.4 Push Booking Hook

**Add to:** `src/hooks/useAdvanceCMSync.ts`

```typescript
export function usePushBookingToPMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: {
      bookingId: string;
      propertyId: string;
      bookingReference: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      adults: number;
      children: number;
      guestInfo: BookingGuest;
      totalPrice: number;
      currency: string;
      priceBreakdown: PriceLineItem[];
      specialRequests?: string;
    }) => {
      // Get external property ID from mapping
      const { data: mapping } = await supabase
        .from('pms_property_map')
        .select('external_property_id')
        .eq('property_id', booking.propertyId)
        .maybeSingle();

      if (!mapping) {
        // Property not linked to PMS - skip push
        return { success: true, skipped: true };
      }

      // Format price breakdown for notes
      const notesLines = [
        `Booking Ref: ${booking.bookingReference}`,
        `Adults: ${booking.adults}, Children: ${booking.children}`,
        '',
        '=== Price Breakdown ===',
        ...booking.priceBreakdown.map(item => 
          `${item.label}: €${item.amount.toFixed(2)}`
        ),
        '',
        booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : ''
      ].filter(Boolean).join('\n');

      // Push to PMS
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { /* auth */ },
        body: JSON.stringify({
          action: 'create-booking',
          externalPropertyId: mapping.external_property_id,
          ...booking,
          priceBreakdownNotes: notesLines
        })
      });

      const result = await response.json();
      
      // Update local booking with external ID
      await supabase
        .from('bookings')
        .update({
          external_booking_id: result.externalBookingId,
          pms_sync_status: 'synced',
          pms_synced_at: new Date().toISOString()
        })
        .eq('id', booking.bookingId);

      return result;
    },
    onError: async (error, variables) => {
      // Mark as failed for retry
      await supabase
        .from('bookings')
        .update({ 
          pms_sync_status: 'failed' 
        })
        .eq('id', variables.bookingId);
    }
  });
}
```

---

## Part 5: Booking Engine UI Enhancements

### 5.1 Update GuestForm

**File:** `src/components/booking/GuestForm.tsx`

Add:
- Adults/Children breakdown (instead of single "guests")
- Country dropdown with common countries

### 5.2 Update Checkout Flow

**File:** `src/pages/Checkout.tsx`

- Store adults/children separately
- Generate booking reference on creation
- Save complete price breakdown to `booking_price_breakdown`
- Call `usePushBookingToPMS` after successful payment
- Set `source: 'direct'` and `payment_status`

### 5.3 Booking Reference Generation

```typescript
function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${year}${month}-${random}`;
}
// Example: BK-202601-A7X3
```

### 5.4 Admin Booking Detail Dialog

**New:** `src/components/admin/BookingDetailDialog.tsx`

AdvanceCM-style booking detail showing:
- Guest card (name, email, phone, country)
- Financial summary (Base | Fees | Taxes | Discounts | Total)
- Booking details (dates, times, timezone, source)
- Guest breakdown (Adults/Children, Nights)
- Payment status badge
- PMS sync status with retry button
- Tabbed sections: Breakdown | Payments | Add-ons | Notes | Activity

---

## Part 6: Remove Rate Import Features

### 6.1 Files to Update

| File | Change |
|------|--------|
| `src/hooks/useAdvanceCMSync.ts` | Remove `useSyncPropertyRates`, `useSyncAllPropertyRates` |
| `src/pages/admin/AdminPMSHealth.tsx` | Remove "Sync All Rates" button |
| `supabase/functions/advancecm-sync/index.ts` | Remove `sync-rates` and `fetch-rates` actions |

### 6.2 Import Flow Update

When importing properties:
- Only import basic info (name, beds, baths, location, images)
- Set `base_price: 0` (admin sets manually)
- Do NOT create rate_plans or seasonal_rates
- Display message: "Set up pricing in Rate Plans section"

---

## Files to Create/Modify Summary

| File | Action | Purpose |
|------|--------|---------|
| Migration file | Create | Schema changes (bookings expansion, new tables) |
| `src/hooks/useRealtimeAvailability.ts` | Create | Real-time availability subscription |
| `src/pages/admin/AdminSeasonalRatesImport.tsx` | Create | CSV upload UI |
| `supabase/functions/seasonal-rates-import/index.ts` | Create | CSV processing edge function |
| `src/components/admin/BookingDetailDialog.tsx` | Create | AdvanceCM-style booking view |
| `supabase/functions/advancecm-sync/index.ts` | Modify | Add `create-booking`, `cancel-booking`, `sync-availability`; Remove rate sync actions |
| `src/hooks/useAdvanceCMSync.ts` | Modify | Add `usePushBookingToPMS`, `useCancelBookingInPMS`; Remove rate sync hooks |
| `src/components/booking/GuestForm.tsx` | Modify | Add adults/children, country dropdown |
| `src/pages/Checkout.tsx` | Modify | Integrate PMS push, price breakdown storage |
| `src/hooks/useBookings.ts` | Modify | Support new fields, booking reference |
| `src/types/database.ts` | Modify | Add new types |
| `src/pages/admin/AdminPMSHealth.tsx` | Modify | Remove rate sync UI |

---

## Implementation Priority

### Phase 1: Schema & Real-Time (Critical for double-booking prevention)
1. Database migrations for expanded bookings schema
2. Enable realtime publications
3. Implement `useRealtimeAvailability`

### Phase 2: Booking Engine Enhancements
1. Update GuestForm with adults/children
2. Generate booking references
3. Store price breakdowns
4. Create BookingDetailDialog

### Phase 3: PMS Push (Two-Way Sync)
1. Add `create-booking` action to edge function
2. Implement `usePushBookingToPMS` hook
3. Integrate into checkout completion flow
4. Add cancel-booking support

### Phase 4: CSV Import
1. Create seasonal-rates-import edge function
2. Build admin import UI page

### Phase 5: Cleanup
1. Remove rate import functionality
2. Update import flow messaging

---

## Booking Flow Summary

```
Guest selects dates → Hold created (10 min TTL)
    ↓
Guest adds add-ons → Price calculated locally
    ↓
Guest enters info → Adults/Children captured
    ↓
Payment processed → Stripe charges
    ↓
Booking created locally with reference → Price breakdown stored
    ↓
Push to Tokeet → Dates blocked across all channels
    ↓
Confirmation shown → External booking ID stored
```

