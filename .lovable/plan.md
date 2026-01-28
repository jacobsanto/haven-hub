
# BookingDetailDialog Component Implementation Plan

## Overview

Create an AdvanceCM-style booking detail dialog that provides a comprehensive view of booking information including guest details, financial summary, payment status, and PMS sync status with tabbed sections for breakdown, payments, add-ons, and notes.

---

## Component Architecture

### Data Flow

```text
AdminBookings Table Row → Click → BookingDetailDialog
    ↓
useBookingDetails(bookingId) fetches:
    - booking with property
    - booking_price_breakdown
    - booking_payments
    - booking_addons with addon details
    - security_deposits
    ↓
Renders multi-tab detail view
```

---

## Part 1: New Hook - `useBookingDetails`

**Add to:** `src/hooks/useBookings.ts`

Create a new hook to fetch complete booking data with all related entities:

```typescript
export function useBookingDetails(bookingId: string | null) {
  return useQuery({
    queryKey: ['admin', 'booking-detail', bookingId],
    queryFn: async () => {
      // Fetch booking with property
      const { data: booking } = await supabase
        .from('bookings')
        .select(`*, property:properties(...)`)
        .eq('id', bookingId)
        .single();

      // Fetch price breakdown
      const { data: priceBreakdown } = await supabase
        .from('booking_price_breakdown')
        .select('*')
        .eq('booking_id', bookingId);

      // Fetch payments
      const { data: payments } = await supabase
        .from('booking_payments')
        .select('*')
        .eq('booking_id', bookingId);

      // Fetch addons with catalog info
      const { data: addons } = await supabase
        .from('booking_addons')
        .select(`*, addon:addons_catalog(name, category)`)
        .eq('booking_id', bookingId);

      // Fetch security deposits
      const { data: deposits } = await supabase
        .from('security_deposits')
        .select('*')
        .eq('booking_id', bookingId);

      return { booking, priceBreakdown, payments, addons, deposits };
    },
    enabled: !!bookingId,
  });
}
```

---

## Part 2: BookingDetailDialog Component

**New File:** `src/components/admin/BookingDetailDialog.tsx`

### Component Structure

| Section | Content |
|---------|---------|
| Header | Booking reference, status badge, property name |
| Guest Card | Name, email, phone, country |
| Financial Summary | Base charge, fees, taxes, discounts, total |
| Booking Details | Check-in/out dates, times, nights, source |
| Guest Breakdown | Adults, children, total guests |
| Status Badges | Payment status, PMS sync status |
| Tabs | Breakdown, Payments, Add-ons, Notes |
| Actions | Confirm, Cancel, Retry PMS Sync |

### Layout Design

```text
+------------------------------------------+
| [X] Booking Detail         BK-202601-A7X3|
+------------------------------------------+
| +----------------+  +-------------------+ |
| | GUEST CARD     |  | BOOKING DETAILS   | |
| | John Smith     |  | Jan 30 → Feb 3    | |
| | john@email.com |  | 4 nights          | |
| | +1234567890    |  | Check-in: 14:00   | |
| | United States  |  | Check-out: 11:00  | |
| +----------------+  | Source: Direct    | |
|                     +-------------------+ |
| +--------------------------------------+ |
| | FINANCIAL SUMMARY                    | |
| | Accommodation (4 nights)    €2,000   | |
| | Airport Transfer            €120     | |
| | Cleaning Fee                €150     | |
| | Tourism Tax                 €50      | |
| | Discount (SUMMER10)        -€232     | |
| +--------------------------------------+ |
| | TOTAL                       €2,088   | |
| +--------------------------------------+ |
|                                          |
| [Breakdown] [Payments] [Add-ons] [Notes] |
| +--------------------------------------+ |
| | Tab content area                     | |
| +--------------------------------------+ |
|                                          |
| Status: [Confirmed] Payment: [Paid]      |
| PMS: [Synced ✓] [Retry]                  |
|                                          |
| [Cancel Booking]              [Close]    |
+------------------------------------------+
```

### Tab Contents

**Breakdown Tab:**
- Table showing all price breakdown lines
- Columns: Type, Label, Quantity, Amount
- Subtotals by category (accommodation, fees, taxes, discounts)

**Payments Tab:**
- List of booking_payments records
- Status badge for each (pending, paid, failed)
- Payment method, Stripe reference
- Due date for deposits

**Add-ons Tab:**
- List of booking_addons with addon details
- Quantity, unit price, total
- Scheduled date if applicable

**Notes Tab:**
- Special requests from booking
- Text area for admin notes (future enhancement)

---

## Part 3: Integration with AdminBookings

**Modify:** `src/pages/admin/AdminBookings.tsx`

Add:
1. State for selected booking: `const [selectedBooking, setSelectedBooking] = useState<string | null>(null)`
2. Import and render BookingDetailDialog
3. Make table rows clickable to open detail dialog
4. Add "View Details" button in actions column

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useBookings.ts` | Modify | Add `useBookingDetails` hook |
| `src/components/admin/BookingDetailDialog.tsx` | Create | New dialog component |
| `src/pages/admin/AdminBookings.tsx` | Modify | Integrate dialog, add row click handler |

---

## UI Components Used

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` - Main container
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tabbed sections
- `Card`, `CardContent` - Info cards
- `Table` - Price breakdown and payments lists
- `Badge` - Status indicators
- `Separator` - Visual dividers
- `Button` - Actions (Confirm, Cancel, Retry Sync)

---

## Status Badges

| Status | Badge Style |
|--------|-------------|
| `pending` | Amber/Warning |
| `confirmed` | Green/Success |
| `cancelled` | Red/Destructive |
| `paid` | Green/Success |
| `unpaid` | Amber/Warning |
| `partial` | Blue/Info |
| `synced` | Green/Success |
| `failed` | Red/Destructive |

---

## Implementation Steps

1. **Add `useBookingDetails` hook** to `src/hooks/useBookings.ts`
   - Query booking with property join
   - Query related tables (price_breakdown, payments, addons, deposits)
   - Return combined data object

2. **Create `BookingDetailDialog.tsx`**
   - Build layout with guest card and booking details
   - Add financial summary section
   - Implement tabbed content areas
   - Add status badges and action buttons
   - Integrate PMS retry functionality

3. **Update `AdminBookings.tsx`**
   - Add selectedBooking state
   - Make rows clickable or add "View" button
   - Render BookingDetailDialog with selected booking

---

## Types to Add

**Add to:** `src/types/database.ts`

```typescript
export interface BookingPayment {
  id: string;
  booking_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  guest_count: number | null;
  scheduled_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  addon?: {
    name: string;
    category: string;
  };
}
```

---

## Technical Notes

### PMS Retry Logic

When clicking "Retry Sync" button:
1. Call `usePushBookingToPMS` mutation with booking data
2. Show loading state during sync
3. Update UI based on success/failure
4. Invalidate booking detail query to refresh

### Price Calculation Display

Group price breakdown by `line_type`:
- **Accommodation**: Base nightly rates
- **Add-ons**: Selected extras
- **Fees**: Cleaning fee, service fees
- **Taxes**: Tourism tax, VAT
- **Discounts**: Coupon codes, special offers

Show subtotals and grand total with proper formatting (currency symbol, thousand separators).
