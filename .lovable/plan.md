
# Implement Multi-Currency Display for Booking Engine

## Overview

Add the ability for guests to view prices in their preferred currency while maintaining EUR as the base currency for all pricing, payments, and admin operations. This is a **display-only conversion** - all actual payments remain in EUR.

## Architecture Approach

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         CURRENCY FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DATABASE (Source of Truth)          FRONTEND (Display Layer)      │
│  ┌─────────────────────┐             ┌─────────────────────────┐   │
│  │ All prices in EUR   │────────────▶│ Convert to guest's      │   │
│  │ • Properties        │   Exchange  │ preferred currency      │   │
│  │ • Addons            │   Rates     │                         │   │
│  │ • Fees              │             │ Show: "≈ $540 USD"      │   │
│  │ • Bookings          │             │ with original EUR below │   │
│  └─────────────────────┘             └─────────────────────────┘   │
│                                                                     │
│  STRIPE PAYMENT                                                     │
│  ┌─────────────────────┐                                           │
│  │ Always charges EUR  │  ◀── Guest pays in EUR regardless of      │
│  │ (base currency)     │      display currency preference          │
│  └─────────────────────┘                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Supported Currencies

| Currency | Symbol | Locale |
|----------|--------|--------|
| EUR (Base) | € | en-EU |
| USD | $ | en-US |
| GBP | £ | en-GB |
| CHF | Fr. | de-CH |
| AUD | A$ | en-AU |
| CAD | C$ | en-CA |

## Technical Implementation

### 1. Currency Context & State Management

Create a new `CurrencyContext` to manage the guest's preferred display currency:

**New File: `src/contexts/CurrencyContext.tsx`**

- Stores selected currency in localStorage for persistence
- Fetches live exchange rates from a free API (exchangerate-api or similar)
- Provides `formatPrice(amount, options)` helper that returns both converted and original EUR values
- Auto-detects initial currency from browser locale

```text
CurrencyContext provides:
├── selectedCurrency: string (e.g., "USD")
├── exchangeRates: Record<string, number>
├── setSelectedCurrency: (currency) => void
├── formatPrice: (eurAmount) => { display: string, original: string }
└── isLoading: boolean
```

### 2. Exchange Rate Edge Function

**New File: `supabase/functions/exchange-rates/index.ts`**

Fetches and caches exchange rates to avoid excessive API calls:

- Fetches rates from free API (e.g., frankfurter.app or exchangerate.host)
- Caches in Supabase for 1 hour (rates don't need real-time updates)
- Returns rates relative to EUR base
- Falls back to stale rates if API is unavailable

### 3. Currency Selector Component

**New File: `src/components/ui/CurrencySwitcher.tsx`**

A dropdown component for guests to select their preferred display currency:

```text
┌──────────────────────────────────┐
│ 🌐 Currency                      │
│ ┌──────────────────────────────┐ │
│ │ EUR € (Euro)            ✓   │ │
│ │ USD $ (US Dollar)           │ │
│ │ GBP £ (British Pound)       │ │
│ │ CHF Fr. (Swiss Franc)       │ │
│ │ AUD A$ (Australian Dollar)  │ │
│ │ CAD C$ (Canadian Dollar)    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Placement:
- Header (next to navigation)
- Footer
- Booking widget (optional secondary selector)

### 4. Update Price Display Components

Modify all price-displaying components to use the new `useCurrency()` hook:

| Component | Current | After |
|-----------|---------|-------|
| PropertyCard | `$500/night` | `≈ $540/night` + small `(€500)` |
| PropertyDetail | `$500/night` | `≈ $540/night` + `(€500)` |
| BookingWidget | `$500/night` | `≈ $540/night` + EUR subtotal |
| PriceBreakdown | `€500` | Shows both currencies clearly |
| QuickBookCard | `$500/night` | `≈ $540/night` |
| AddonsSelection | `€50` | `≈ $54` + `(€50)` |
| ExperienceCard | `From €50` | `From ≈ $54` |

### 5. Price Display Pattern

To ensure guests understand the payment currency, use this consistent pattern:

```text
┌────────────────────────────────┐
│ ≈ $540 USD                     │  ◀── Converted (prominent)
│ €500 EUR · You pay in EUR      │  ◀── Original + clarification
└────────────────────────────────┘
```

For checkout/payment step, prominently show:

```text
┌────────────────────────────────────────────────┐
│ 💳 Payment Amount                              │
│                                                │
│   €2,450.00 EUR                                │
│   ───────────────────                          │
│   Approximately $2,646.00 USD                  │
│                                                │
│ ℹ️ All payments are processed in EUR.          │
│    Your bank will convert at their rate.      │
└────────────────────────────────────────────────┘
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/CurrencyContext.tsx` | Currency state, exchange rates, format helper |
| `src/hooks/useCurrency.ts` | Hook to access currency context |
| `src/hooks/useExchangeRates.ts` | Fetch and cache exchange rates |
| `src/components/ui/CurrencySwitcher.tsx` | Dropdown to select currency |
| `supabase/functions/exchange-rates/index.ts` | Edge function to fetch rates |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with `CurrencyProvider` |
| `src/components/layout/Header.tsx` | Add CurrencySwitcher |
| `src/components/layout/Footer.tsx` | Add CurrencySwitcher |
| `src/components/properties/PropertyCard.tsx` | Use `useCurrency().formatPrice()` |
| `src/components/properties/AtAGlanceCards.tsx` | Use `useCurrency().formatPrice()` |
| `src/components/booking/BookingWidget.tsx` | Use `useCurrency().formatPrice()` |
| `src/components/booking/PriceBreakdown.tsx` | Show both currencies |
| `src/components/booking/QuickBookCard.tsx` | Use `useCurrency().formatPrice()` |
| `src/components/booking/AddonsSelection.tsx` | Use `useCurrency().formatPrice()` |
| `src/components/experiences/ExperienceCard.tsx` | Use `useCurrency().formatPrice()` |
| `src/pages/PropertyDetail.tsx` | Use `useCurrency().formatPrice()` |
| `src/pages/Checkout.tsx` | Show payment currency notice |

## Database Changes

**New Table: `exchange_rates_cache`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| base_currency | text | Always "EUR" |
| rates | jsonb | `{"USD": 1.08, "GBP": 0.86, ...}` |
| fetched_at | timestamptz | When rates were fetched |
| created_at | timestamptz | Record creation |

This table is optional (can use in-memory caching in the edge function), but provides resilience if the external API is down.

## No Changes Required

- **Stripe checkout**: Continues to charge in EUR
- **Database pricing**: All prices remain stored in EUR
- **Admin dashboard**: No changes, always shows EUR
- **Booking records**: Store totals in EUR
- **PMS sync**: No currency changes needed

## Implementation Order

1. Create exchange rates edge function + cache table
2. Create CurrencyContext and useCurrency hook
3. Create CurrencySwitcher component
4. Add CurrencyProvider to App.tsx
5. Add CurrencySwitcher to Header
6. Update PropertyCard and QuickBookCard
7. Update BookingWidget and PriceBreakdown
8. Update remaining price display components
9. Add payment currency notice on checkout
10. Test end-to-end with different currencies

## User Experience Notes

- Default currency is detected from browser locale
- Selection is persisted in localStorage
- Rates are refreshed hourly (stale rates are better than no rates)
- Clear messaging that payment is always in EUR
- Approximate symbol (`≈`) used to indicate conversion estimates
