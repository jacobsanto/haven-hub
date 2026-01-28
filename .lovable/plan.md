
## Customizable Cancellation Policies with Admin Management

This plan transforms the current hardcoded preset cancellation policies into a fully customizable system. Admins will be able to create, edit, and delete custom policies with specific cutoff days and refund percentages through a dedicated management dialog.

---

### Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| Policy Storage | Hardcoded in `src/lib/cancellation-policies.ts` | Database table `cancellation_policies` |
| Policy Count | 4 fixed presets | Unlimited custom policies |
| Cutoff Days | Fixed (7, 14, 30 days) | Admin-configurable per rule |
| Refund Percentages | Fixed (100%, 50%, 0%) | Admin-configurable per rule |
| Management UI | None | Dedicated dialog with rule builder |
| Rate Plan Link | Stores policy key (`flexible`, etc.) | Stores policy UUID |

---

### Database Design

**New Table: `cancellation_policies`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Display name (e.g., "Flexible", "Holiday Special") |
| `description` | text | Optional longer description |
| `color` | text | Badge color (green, yellow, orange, red) |
| `is_default` | boolean | One of the system presets (cannot delete) |
| `is_active` | boolean | Available for selection |
| `rules` | jsonb | Array of `{daysBeforeCheckIn, refundPercentage}` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last modification |

**Rules JSONB Structure:**
```json
[
  {"daysBeforeCheckIn": 14, "refundPercentage": 100},
  {"daysBeforeCheckIn": 7, "refundPercentage": 50},
  {"daysBeforeCheckIn": 0, "refundPercentage": 0}
]
```

**Migration includes:**
1. Create `cancellation_policies` table
2. Insert 4 default policies (Flexible, Moderate, Strict, Non-Refundable)
3. Update `rate_plans.cancellation_policy` to reference policy ID
4. Update `bookings.cancellation_policy` to store policy ID

---

### Implementation Steps

#### Step 1: Database Migration

Create `cancellation_policies` table with:
- RLS policies for admin management
- Public read access for active policies
- Seed data with 4 default presets (marked `is_default: true`)

Update foreign key references:
- `rate_plans.cancellation_policy` becomes UUID reference
- `bookings.cancellation_policy` becomes UUID reference

#### Step 2: Create Policy Management Hook

**File:** `src/hooks/useCancellationPolicies.ts` (New)

```typescript
interface CancellationPolicyDB {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  is_active: boolean;
  rules: { daysBeforeCheckIn: number; refundPercentage: number }[];
  created_at: string;
  updated_at: string;
}

export function useCancellationPolicies()
export function useCreateCancellationPolicy()
export function useUpdateCancellationPolicy()
export function useDeleteCancellationPolicy()
```

#### Step 3: Create Cancellation Policy Form Dialog

**File:** `src/components/admin/CancellationPolicyFormDialog.tsx` (New)

Features:
- Policy name and description inputs
- Color selector (green, yellow, orange, red badges)
- **Dynamic Rules Builder:**
  - Add/remove refund tiers
  - For each tier: days before check-in + refund percentage
  - Drag to reorder (or auto-sort by days descending)
  - Visual preview of policy terms
- Validation: rules must be in descending day order, percentages 0-100

UI Layout:
```text
┌────────────────────────────────────────────────────────────┐
│  Create Cancellation Policy                                │
├────────────────────────────────────────────────────────────┤
│  Name: [Holiday Flexible                              ]    │
│  Description: [Great for holiday bookings             ]    │
│  Badge Color: [🟢 Green ▼]                                 │
│                                                            │
│  ─── Refund Rules ──────────────────────────────────────   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🗑️  [21] days before check-in → [100]% refund       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🗑️  [10] days before check-in → [50]% refund        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🗑️  [0] days before check-in → [0]% refund (final)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [+ Add Refund Tier]                                       │
│                                                            │
│  ─── Preview ───────────────────────────────────────────   │
│  • Full refund if cancelled 21+ days before check-in      │
│  • 50% refund if cancelled 10-21 days before check-in     │
│  • No refund within 10 days of check-in                   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                               [Cancel]  [Save Policy]      │
└────────────────────────────────────────────────────────────┘
```

#### Step 4: Add Policy Management Tab to Rate Plans Page

**File:** `src/pages/admin/AdminRatePlans.tsx`

Add a new tab "Cancellation Policies" alongside Rate Plans, Seasonal Rates, and Heatmap:

```tsx
<TabsList className="grid w-full max-w-2xl grid-cols-4">
  <TabsTrigger value="rate-plans">Rate Plans</TabsTrigger>
  <TabsTrigger value="seasonal-rates">Seasonal Rates</TabsTrigger>
  <TabsTrigger value="cancellation-policies">Policies</TabsTrigger>  // NEW
  <TabsTrigger value="heatmap">Price Heatmap</TabsTrigger>
</TabsList>
```

Tab content shows:
- Summary cards (Total Policies, Active, Custom)
- Table listing all policies with columns:
  - Name (with color badge)
  - Rules summary (e.g., "21d → 100%, 10d → 50%, No refund")
  - Default badge (for system presets)
  - Active toggle
  - Actions (Edit, Duplicate, Delete - delete disabled for defaults)

#### Step 5: Update Rate Plan Form Dialog

**File:** `src/pages/admin/AdminRatePlans.tsx`

Change the cancellation policy selector from hardcoded presets to database-driven dropdown:

```tsx
// Before: Uses CANCELLATION_POLICIES constant
// After: Uses useCancellationPolicies() hook data

<Select value={formData.cancellation_policy_id}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {policies?.map((policy) => (
      <SelectItem key={policy.id} value={policy.id}>
        <div className="flex items-center gap-2">
          <Badge className={getBadgeClass(policy.color)}>{policy.name}</Badge>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Step 6: Update Utility Functions

**File:** `src/lib/cancellation-policies.ts`

Keep the utility functions but modify to work with database policies:

```typescript
// New: Calculate refund from database policy object
export function calculateRefundFromPolicy(
  policy: { rules: CancellationRule[] },
  checkInDate: Date,
  cancellationDate: Date,
  totalAmount: number
): RefundCalculation

// New: Generate summary from database policy
export function getPolicySummaryFromRules(
  rules: CancellationRule[],
  checkInDate: Date
): string[]

// Keep: Badge color utilities
export function getPolicyBadgeClassByColor(color: string): string
```

#### Step 7: Update Display Components

**File:** `src/components/booking/CancellationPolicyDisplay.tsx`

Accept policy object from database instead of just key:

```tsx
interface CancellationPolicyDisplayProps {
  policy: {
    id: string;
    name: string;
    color: string;
    rules: { daysBeforeCheckIn: number; refundPercentage: number }[];
  };
  checkInDate: Date;
  compact?: boolean;
}
```

#### Step 8: Update Checkout Flow

**File:** `src/pages/Checkout.tsx`

- Fetch the policy by ID from the selected rate plan
- Display policy details from database record
- Store policy ID with booking

#### Step 9: Update Refund Calculation Hook

**File:** `src/hooks/useCancellationRefund.ts`

Modify to fetch policy by ID and calculate refund:

```typescript
export function useCancellationRefund(booking: {
  cancellationPolicyId: string | null;
  checkIn: string | Date;
  totalPrice: number;
}): RefundCalculation | null
```

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Create `cancellation_policies` table, seed defaults, update FKs |
| `src/hooks/useCancellationPolicies.ts` | Create | CRUD hooks for policies |
| `src/components/admin/CancellationPolicyFormDialog.tsx` | Create | Policy editor with rule builder |
| `src/pages/admin/AdminRatePlans.tsx` | Modify | Add Policies tab, update rate plan form |
| `src/lib/cancellation-policies.ts` | Modify | Add database-aware calculation functions |
| `src/components/booking/CancellationPolicyDisplay.tsx` | Modify | Accept policy object |
| `src/pages/Checkout.tsx` | Modify | Fetch and display policy from DB |
| `src/hooks/useCancellationRefund.ts` | Modify | Fetch policy by ID for refund calc |
| `src/hooks/useAdminRatePlans.ts` | Modify | Update types for policy ID reference |

---

### Key Features

1. **Dynamic Rule Builder**: Add/remove refund tiers with any cutoff days and percentages
2. **Visual Preview**: See exactly how the policy will be displayed to guests
3. **Color-Coded Badges**: Choose badge color for visual distinction in tables
4. **Protected Defaults**: System presets (Flexible, Moderate, Strict, Non-Refundable) cannot be deleted
5. **Audit Trail**: Policies stored with bookings for historical accuracy
6. **Validation**: Ensures rules are logically ordered (highest days first)

---

### Benefits

1. **Flexibility**: Create policies for any scenario (holiday specials, peak periods)
2. **Granular Control**: Set exact cutoff days (not just 7/14/30)
3. **Custom Percentages**: Any refund percentage (75%, 25%, etc.)
4. **Multiple Tiers**: Add as many refund tiers as needed
5. **Centralized Management**: One place to manage all policies
6. **Consistency**: Same policy can apply to multiple rate plans
