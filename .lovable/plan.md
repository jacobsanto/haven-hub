
# Unify Currency Display: EUR Base Currency with Consistent Styling

## Problem Summary

The codebase has **inconsistent currency formatting** across admin dashboard and frontend:

| Location | Current Currency | Should Be |
|----------|------------------|-----------|
| AdminDashboard.tsx | EUR ✓ | EUR |
| AdminProperties.tsx | **USD** ✗ | EUR |
| AdminBookings.tsx | **USD** ✗ | EUR |
| AdminAnalytics.tsx | EUR ✓ | EUR |
| AdminRatePlans.tsx | EUR ✓ | EUR |
| AdminFees.tsx | EUR ✓ | EUR |
| AdminAddonsManagement.tsx | EUR ✓ | EUR |
| PropertyDetail.tsx | **USD** ✗ | Use CurrencyContext |
| AtAGlanceCards.tsx | **USD** ✗ | Use CurrencyContext |
| MobileBookingCTA.tsx | **USD** ✗ | Use CurrencyContext |
| SeasonalRatesHeatmap.tsx | EUR ✓ | EUR |

Additionally, while the `CurrencyContext` exists for frontend guest-facing multi-currency display, there's no centralized admin currency formatter that ensures all admin pages use EUR consistently.

## Solution Overview

Create a **unified currency utility system** that provides:

1. **`formatEuro()`** - A centralized admin-only formatter that always outputs EUR
2. **Update all admin pages** - Replace local `formatPrice` functions with the shared utility
3. **Update remaining frontend components** - Use the existing `useCurrency()` hook for guest-facing prices
4. **Consistent styling** - All currency displays will use the same formatting pattern

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    UNIFIED CURRENCY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ADMIN DASHBOARD                    FRONTEND (Guest-Facing)         │
│  ┌─────────────────────┐            ┌─────────────────────────┐    │
│  │ formatEuro()        │            │ useCurrency() hook      │    │
│  │ Always EUR          │            │ Converts from EUR base  │    │
│  │ No conversion       │            │ Shows ≈ converted price │    │
│  │ €1,234              │            │ + original EUR          │    │
│  └─────────────────────┘            └─────────────────────────┘    │
│         ↓                                    ↓                      │
│  ┌─────────────────────┐            ┌─────────────────────────┐    │
│  │ AdminDashboard      │            │ PropertyCard            │    │
│  │ AdminProperties     │            │ PropertyDetail          │    │
│  │ AdminBookings       │            │ BookingWidget           │    │
│  │ AdminRatePlans      │            │ MobileBookingCTA        │    │
│  │ AdminAnalytics      │            │ PriceBreakdown          │    │
│  └─────────────────────┘            └─────────────────────────┘    │
│                                                                     │
│  DATABASE: All prices stored in EUR (unchanged)                     │
│  STRIPE: All payments in EUR (unchanged)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Step 1: Create Centralized Admin Currency Formatter

**New File: `src/lib/format-currency.ts`**

```typescript
/**
 * Format a price in EUR for admin display.
 * Admin always sees EUR - no conversion needed.
 */
export function formatEuro(amount: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

/**
 * Format a number as compact currency (e.g., €1.2K)
 * Useful for dashboard stats
 */
export function formatEuroCompact(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(1)}K`;
  }
  return formatEuro(amount);
}
```

### Step 2: Update Admin Pages to Use Centralized Formatter

Files to update with `import { formatEuro } from '@/lib/format-currency'`:

| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Replace local `formatPrice` with `formatEuro` |
| `src/pages/admin/AdminProperties.tsx` | Replace local `formatPrice` (USD→EUR) with `formatEuro` |
| `src/pages/admin/AdminBookings.tsx` | Replace local `formatPrice` (USD→EUR) with `formatEuro` |
| `src/pages/admin/AdminAnalytics.tsx` | Replace local `formatCurrency` with `formatEuro` |
| `src/pages/admin/AdminRatePlans.tsx` | Replace local `formatCurrency` with `formatEuro` |
| `src/pages/admin/AdminFees.tsx` | Use `formatEuro` for inline formatting |
| `src/pages/admin/AdminAddonsManagement.tsx` | Replace local `formatPrice` with `formatEuro` |
| `src/components/admin/SeasonalRatesHeatmap.tsx` | Replace local `formatCurrency` with `formatEuro` |

### Step 3: Update Remaining Frontend Components

These components still have hardcoded USD and should use the existing `useCurrency()` hook:

| File | Current | Update |
|------|---------|--------|
| `src/pages/PropertyDetail.tsx` | Hardcoded USD | Use `useCurrency().formatPrice()` |
| `src/components/properties/AtAGlanceCards.tsx` | Hardcoded USD | Use `useCurrency().formatPrice()` |
| `src/components/booking/MobileBookingCTA.tsx` | Hardcoded USD | Use `useCurrency().formatPrice()` |

### Step 4: Ensure Visual Consistency

All price displays will follow these patterns:

**Admin (always EUR):**
```
€2,450        - Standard price
€1.2K         - Compact (dashboard stats, optional)
€500/night    - Rate display
```

**Frontend (guest-facing):**
```
When EUR selected:     €2,450
When USD selected:     ≈ $2,646
                       €2,450 EUR · You pay in EUR
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/format-currency.ts` | Centralized EUR formatting utility for admin |

## Files to Modify

### Admin Pages (Change to EUR)
| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Remove local formatPrice, import formatEuro |
| `src/pages/admin/AdminProperties.tsx` | Change USD → EUR via formatEuro |
| `src/pages/admin/AdminBookings.tsx` | Change USD → EUR via formatEuro |
| `src/pages/admin/AdminAnalytics.tsx` | Use formatEuro |
| `src/pages/admin/AdminRatePlans.tsx` | Use formatEuro |
| `src/pages/admin/AdminFees.tsx` | Use formatEuro |
| `src/pages/admin/AdminAddonsManagement.tsx` | Use formatEuro |
| `src/components/admin/SeasonalRatesHeatmap.tsx` | Use formatEuro |

### Frontend Components (Use CurrencyContext)
| File | Change |
|------|--------|
| `src/pages/PropertyDetail.tsx` | Replace hardcoded USD with useCurrency() |
| `src/components/properties/AtAGlanceCards.tsx` | Replace hardcoded USD with useCurrency() |
| `src/components/booking/MobileBookingCTA.tsx` | Replace hardcoded USD with useCurrency() |

## Implementation Order

1. Create `src/lib/format-currency.ts` with `formatEuro()` utility
2. Update all admin pages to use `formatEuro()` (8 files)
3. Update remaining frontend components to use `useCurrency()` (3 files)
4. Test admin dashboard shows EUR throughout
5. Test frontend currency switcher works across all components

## Benefits

- **Single source of truth**: Admin always sees EUR from one utility
- **No code duplication**: No more local `formatPrice` functions scattered everywhere
- **Type safety**: Centralized utility can be properly typed
- **Easy maintenance**: Future currency changes only need one update
- **Consistent styling**: All prices formatted the same way (locale, decimals, symbol position)

## What Stays Unchanged

- Database: All prices remain stored in EUR
- Stripe payments: Continue charging in EUR
- CurrencyContext: Continues to handle guest-facing multi-currency display
- Exchange rates: Edge function and caching logic unchanged
