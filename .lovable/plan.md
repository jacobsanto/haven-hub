
# Universal Currency Settings Widget in Admin Dashboard

## Overview

Create a centralized **Currency Settings** tab in the Admin Settings page that allows administrators to configure the base currency for the entire platform. This setting will be stored in the database and synced across the admin dashboard, frontend display, and all pricing logic.

## Current Architecture

| Component | Current State |
|-----------|---------------|
| Database | Prices stored in EUR (hardcoded assumption) |
| Admin Dashboard | Uses `formatEuro()` from `lib/format-currency.ts` |
| Frontend | Uses `CurrencyContext` with EUR as hardcoded `BASE_CURRENCY` |
| Types | `src/types/currency.ts` exports `BASE_CURRENCY = 'EUR'` |
| Stripe | Charges in EUR |

## Solution: Database-Driven Base Currency

```text
┌─────────────────────────────────────────────────────────────────────┐
│                  UNIVERSAL CURRENCY SETTINGS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   DATABASE (brand_settings table)                                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ base_currency: 'EUR'  ←── Single source of truth            │  │
│   └─────────────────────────────────────────────────────────────┘  │
│               ↓                                                     │
│   ┌───────────────────────────────────────────────────────────────┐│
│   │                    BrandContext                               ││
│   │  • Fetches base_currency from brand_settings                  ││
│   │  • Provides baseCurrency to entire app                        ││
│   └───────────────────────────────────────────────────────────────┘│
│         ↓                               ↓                          │
│   ADMIN DASHBOARD                 FRONTEND (Guest Display)         │
│   ┌─────────────────────┐        ┌─────────────────────────┐       │
│   │ formatBaseCurrency()│        │ CurrencyContext         │       │
│   │ Uses baseCurrency   │        │ • Base: from BrandContext│      │
│   │ from BrandContext   │        │ • Guest can convert to  │       │
│   │                     │        │   other currencies      │       │
│   └─────────────────────┘        └─────────────────────────┘       │
│                                                                     │
│   ADMIN SETTINGS                                                    │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ NEW TAB: Currency                                           │  │
│   │ • Select base currency (EUR, USD, GBP, CHF, AUD, CAD)       │  │
│   │ • Preview formatting                                         │  │
│   │ • Currency symbol display options                            │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### 1. Database Schema Update

Add `base_currency` column to the existing `brand_settings` table:

```sql
ALTER TABLE brand_settings
ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'EUR';
```

### 2. Update BrandSettings Types & Hook

Extend `useBrandSettings.ts`:

```typescript
export interface BrandSettings {
  // ... existing fields ...
  base_currency: SupportedCurrency;  // NEW
}

export const defaultBrandSettings = {
  // ... existing defaults ...
  base_currency: 'EUR' as SupportedCurrency,  // NEW
};
```

### 3. Create Currency Settings Tab

Add a fourth tab to `AdminSettings.tsx`:

```text
┌────────────────────────────────────────────────────────────────┐
│ [Identity] [Colors] [Typography] [Currency]  ← NEW TAB         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Currency Settings                                             │
│  Configure the base currency for all pricing                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Base Currency                                           │ │
│  │  ┌──────────────────────────────────────────────┐       │ │
│  │  │ EUR € - Euro                              ▼  │       │ │
│  │  └──────────────────────────────────────────────┘       │ │
│  │                                                          │ │
│  │  This currency is used for:                              │ │
│  │  • All property pricing in the database                  │ │
│  │  • Payment processing via Stripe                         │ │
│  │  • Admin dashboard displays                              │ │
│  │                                                          │ │
│  │  Guests can still view prices in other currencies,       │ │
│  │  but payments will be charged in the base currency.      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Preview                                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  €1,234.00  |  €500/night  |  €10,500 total             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4. Update BrandContext

Extend `BrandContext.tsx` to expose `baseCurrency`:

```typescript
interface BrandContextValue {
  // ... existing fields ...
  baseCurrency: SupportedCurrency;  // NEW
}

const value: BrandContextValue = {
  // ... existing values ...
  baseCurrency: settings?.base_currency ?? 'EUR',
};
```

### 5. Update CurrencyContext

Modify `CurrencyContext.tsx` to read base currency from BrandContext:

```typescript
import { useBrand } from '@/contexts/BrandContext';

export function CurrencyProvider({ children }) {
  const { baseCurrency } = useBrand();  // Get from brand settings
  
  // Use baseCurrency instead of hardcoded 'EUR'
  const formatPrice = useCallback((amount: number): FormattedPrice => {
    // Format using baseCurrency as the "original" currency
    // Convert from baseCurrency to selectedCurrency
  }, [baseCurrency, selectedCurrency, exchangeRates]);
}
```

### 6. Update Admin Currency Formatter

Modify `lib/format-currency.ts` to support dynamic base currency:

```typescript
import { useBrand } from '@/contexts/BrandContext';

// For use in React components
export function useFormatCurrency() {
  const { baseCurrency } = useBrand();
  
  const format = useCallback((amount: number, options?) => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);
    return new Intl.NumberFormat(currencyInfo?.locale || 'en-US', {
      style: 'currency',
      currency: baseCurrency,
      // ...options
    }).format(amount);
  }, [baseCurrency]);
  
  return { format, formatCompact };
}

// Keep formatEuro for backward compatibility or legacy uses
export function formatEuro(amount: number, options?) { /* ... */ }
```

### 7. Update Exchange Rates Edge Function

Modify `exchange-rates/index.ts` to accept a dynamic base currency:

```typescript
// Fetch rates with dynamic base
const BASE = baseCurrency || 'EUR';
const response = await fetch(
  `https://api.frankfurter.app/latest?from=${BASE}`
);
```

## Files to Modify

### Database
| Action | Details |
|--------|---------|
| Migration | Add `base_currency` column to `brand_settings` |

### New Files
| File | Purpose |
|------|---------|
| `src/components/admin/CurrencySettingsCard.tsx` | Currency settings UI card for admin |
| `src/hooks/useFormatCurrency.ts` | React hook for dynamic currency formatting |

### Modified Files
| File | Changes |
|------|---------|
| `src/hooks/useBrandSettings.ts` | Add `base_currency` to interface and defaults |
| `src/contexts/BrandContext.tsx` | Expose `baseCurrency` from settings |
| `src/contexts/CurrencyContext.tsx` | Use `baseCurrency` from BrandContext instead of hardcoded EUR |
| `src/pages/admin/AdminSettings.tsx` | Add Currency tab with selector |
| `src/lib/format-currency.ts` | Add dynamic formatting option |
| `src/types/currency.ts` | Remove hardcoded `BASE_CURRENCY` constant |
| `supabase/functions/exchange-rates/index.ts` | Support dynamic base currency parameter |

## Implementation Order

1. **Database Migration**: Add `base_currency` column to `brand_settings`
2. **Update Types**: Extend `BrandSettings` interface and defaults
3. **Update BrandContext**: Expose `baseCurrency` value
4. **Create CurrencySettingsCard**: Build the admin UI component
5. **Add Currency Tab**: Integrate into AdminSettings page
6. **Update CurrencyContext**: Read base from BrandContext
7. **Create useFormatCurrency hook**: Dynamic admin formatting
8. **Update format-currency.ts**: Add dynamic formatting support
9. **Update Exchange Rates**: Support dynamic base parameter
10. **Test full sync**: Verify changes propagate everywhere

## User Experience

After implementation:
1. Admin goes to **Settings > Currency** tab
2. Selects base currency (e.g., USD)
3. Clicks **Save Changes**
4. Immediately:
   - Admin dashboard shows prices in USD
   - Frontend shows USD as base (guests can still convert)
   - Payment processing uses USD
   - Exchange rates recalculate relative to USD

## Notes

- This change is **display and configuration only** for the base currency
- Existing EUR prices in database would need manual conversion if base currency changes (out of scope for this implementation)
- Stripe must be configured to accept the selected currency
- Exchange rate API supports all listed currencies as base
