
## Preset Cancellation Policies for Vacation Rentals

This plan implements Option B: simple preset cancellation policies stored in code and linked to rate plans. This is the standard approach for vacation rentals (unlike hotels that have complex per-night policies).

---

### Policy Definitions

Four standard policies aligned with vacation rental industry norms:

| Policy Key | Label | Rules | Use Case |
|------------|-------|-------|----------|
| `flexible` | Flexible | Full refund up to 7 days before check-in; 50% refund 3-7 days; No refund within 3 days | Standard bookings, encourages last-minute bookings |
| `moderate` | Moderate | Full refund up to 14 days before check-in; 50% refund 7-14 days; No refund within 7 days | Default for most rate plans |
| `strict` | Strict | Full refund up to 30 days before check-in; 50% refund 14-30 days; No refund within 14 days | Peak season, special events |
| `non_refundable` | Non-Refundable | No refund at any time | Promotional rates, lowest price |

---

### Implementation Steps

#### Step 1: Create Cancellation Policy Utility

**File:** `src/lib/cancellation-policies.ts` (New)

Define policy types and refund calculation logic:

```typescript
export type CancellationPolicyKey = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export interface CancellationPolicy {
  key: CancellationPolicyKey;
  label: string;
  description: string;
  shortDescription: string;
  rules: CancellationRule[];
}

export interface CancellationRule {
  daysBeforeCheckIn: number;  // Cutoff days (e.g., 7 means "7+ days before")
  refundPercentage: number;   // 100 = full, 50 = half, 0 = none
  label: string;              // Human-readable description
}

// Calculate refund amount based on policy, check-in date, and cancellation time
export function calculateRefund(
  policyKey: CancellationPolicyKey,
  checkInDate: Date,
  cancellationDate: Date,
  totalAmount: number
): { refundAmount: number; refundPercentage: number; message: string }
```

#### Step 2: Add Cancellation Policy to Rate Plans

**Database Migration:**

Add `cancellation_policy` column to `rate_plans` table:

```sql
ALTER TABLE rate_plans 
ADD COLUMN cancellation_policy text NOT NULL DEFAULT 'moderate';

-- Add constraint for valid values
ALTER TABLE rate_plans 
ADD CONSTRAINT valid_cancellation_policy 
CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict', 'non_refundable'));
```

#### Step 3: Update Rate Plan Types and Hooks

**File:** `src/hooks/useAdminRatePlans.ts`

Add `cancellation_policy` to the RatePlan interface:

```typescript
export interface RatePlan {
  // ... existing fields
  cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';
}
```

#### Step 4: Update Admin Rate Plans UI

**File:** `src/pages/admin/AdminRatePlans.tsx`

Add cancellation policy selector to the rate plan form:

- Add dropdown with 4 policy options
- Show policy description when selected
- Display policy badge in rate plans table
- Include in form data for create/update

Changes:
- Add `CANCELLATION_POLICIES` constant with labels/descriptions
- Add policy selector in the dialog form (between rate type and min stay)
- Add policy column to the rate plans table
- Show colored badge based on policy (green=flexible, yellow=moderate, orange=strict, red=non-refundable)

#### Step 5: Display Policy at Checkout

**File:** `src/pages/Checkout.tsx`

Add cancellation policy display in the payment step:

- Fetch the applicable rate plan for the booking dates
- Display policy summary before payment button
- Link to full terms for legal compliance

**File:** `src/components/booking/CancellationPolicyDisplay.tsx` (New)

Create component to show policy terms:

```tsx
interface CancellationPolicyDisplayProps {
  policyKey: CancellationPolicyKey;
  checkInDate: Date;
  compact?: boolean;
}
```

Features:
- Shows policy name and description
- Highlights current refund eligibility based on today's date
- Compact mode for booking widget, full mode for checkout

#### Step 6: Store Policy with Booking

**File:** `src/hooks/useCompleteBooking.ts`

Update to capture the cancellation policy at time of booking:

- Accept `cancellationPolicy` parameter
- Store in booking record (for historical reference)

**Database Migration:**

Add `cancellation_policy` to `bookings` table:

```sql
ALTER TABLE bookings 
ADD COLUMN cancellation_policy text DEFAULT 'moderate';
```

This captures the policy at time of booking so it can't be changed retroactively.

#### Step 7: Create Refund Calculation Hook

**File:** `src/hooks/useCancellationRefund.ts` (New)

Hook for admin to calculate refunds when processing cancellations:

```typescript
export function useCancellationRefund(booking: Booking) {
  // Returns current refund amount based on stored policy
  // Used in admin booking detail when processing cancellation
}
```

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/cancellation-policies.ts` | Create | Policy definitions + refund calculator |
| `src/hooks/useAdminRatePlans.ts` | Modify | Add cancellation_policy to types |
| `src/pages/admin/AdminRatePlans.tsx` | Modify | Add policy selector to form + display |
| `src/components/booking/CancellationPolicyDisplay.tsx` | Create | Display policy at checkout |
| `src/pages/Checkout.tsx` | Modify | Show policy before payment |
| `src/hooks/useCompleteBooking.ts` | Modify | Store policy with booking |
| `src/hooks/useCancellationRefund.ts` | Create | Calculate refunds for admin |
| Database migration | Create | Add cancellation_policy to rate_plans and bookings |

---

### Policy Display Examples

**At Checkout (before payment):**

```text
┌─────────────────────────────────────────────────────────────┐
│  Cancellation Policy: Moderate                              │
│                                                             │
│  • Free cancellation until Jan 15 (14 days before)         │
│  • 50% refund if cancelled Jan 15-22                       │
│  • No refund after Jan 22                                  │
│                                                             │
│  Your check-in: January 29, 2026                           │
└─────────────────────────────────────────────────────────────┘
```

**In Admin Rate Plan Table:**

| Rate Plan | Type | Base Rate | Min Stay | Policy | Status |
|-----------|------|-----------|----------|--------|--------|
| Standard Rate | Standard | €450/night | 2 nights | 🟡 Moderate | Active |
| Early Bird | Early Bird | €380/night | 3 nights | 🟢 Flexible | Active |
| Peak Season | Standard | €650/night | 5 nights | 🟠 Strict | Active |
| Flash Sale | Promotional | €299/night | 2 nights | 🔴 Non-Refundable | Active |

---

### Stripe Integration Consideration

When we implement Stripe, the refund logic will work as follows:

1. Guest requests cancellation (via email/phone for now)
2. Admin opens booking in dashboard
3. System calculates refund based on stored `cancellation_policy` + check-in date
4. Admin clicks "Process Refund" 
5. `confirm-booking-payment` edge function calls Stripe Refund API with calculated amount
6. Booking status updated to `cancelled`, payment status to `refunded`

The cancellation policy does NOT get sent to Stripe - we simply calculate the refund amount locally and tell Stripe "refund X amount".

---

### Benefits

1. **Simplicity**: 4 preset policies cover 99% of vacation rental scenarios
2. **No database overhead**: Policies defined in code, only key stored in DB
3. **Legal compliance**: Policy shown at checkout before payment
4. **Audit trail**: Policy captured at booking time, can't be changed retroactively
5. **Admin visibility**: Easy to see which policy applies to each rate plan
6. **Stripe-ready**: Refund calculation logic ready for payment integration
