
# Add Customer-Facing Display Name for Properties

## Overview

Add a separate `display_name` field to properties that will be shown to customers on Stripe checkout pages and receipts. This keeps the internal `name` (e.g., "PROP-001-SANTORINI-OIA") separate from the customer-friendly name (e.g., "Sunset Villa with Caldera View").

## Database Change

Add a new nullable column `display_name` to the `properties` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `display_name` | text | NULL | Customer-facing name shown on Stripe checkout. Falls back to `name` if not set. |

## Admin Form Update

**Location:** `src/pages/admin/AdminPropertyForm.tsx`

Add a new field in the "Basic Information" section:

```text
┌─────────────────────────────────────────────────────────────┐
│  BASIC INFORMATION                                          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Property Name (Internal) *                             │  │
│  │ PROP-001-SANTORINI-OIA                                 │  │
│  │ Used for admin, PMS sync, and internal reference       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Display Name (Customer-Facing)                         │  │
│  │ Sunset Villa with Caldera View                         │  │
│  │ Shown on Stripe checkout, receipts, and confirmations  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │ URL Slug *              │ │ Status                  │    │
│  │ sunset-villa-oia        │ │ Active ▼                │    │
│  └─────────────────────────┘ └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Stripe Checkout Update

**Location:** `supabase/functions/create-checkout-session/index.ts`

Update the property query to include `display_name` and use it in the Stripe line item:

```typescript
// Query now includes display_name
const { data: property } = await supabase
  .from('properties')
  .select('id, name, display_name, slug, city, country, ...')

// Use display_name with fallback to name
const customerName = property.display_name || property.name;

lineItems.push({
  price_data: {
    currency: 'eur',
    product_data: {
      name: `${customerName} - ${nights} night${nights > 1 ? 's' : ''}`,
      description: `${checkIn} to ${checkOut} · ${guests} guest${guests > 1 ? 's' : ''}`,
    },
    unit_amount: totalCents,
  },
  quantity: 1,
});
```

## Files to Modify

| File | Changes |
|------|---------|
| **Database** | Add `display_name` column to `properties` table |
| `src/types/database.ts` | Add `display_name?: string \| null` to Property interface |
| `src/pages/admin/AdminPropertyForm.tsx` | Add display_name input field with helper text |
| `src/hooks/useProperties.ts` | Include display_name in transformProperty |
| `supabase/functions/create-checkout-session/index.ts` | Use display_name with fallback for Stripe line item |

## User Experience

- **Internal Name**: "PROP-OIA-SUNSET-001" (used in admin lists, PMS)
- **Display Name**: "Sunset Villa with Caldera View" (shown to customers)
- If display_name is empty, the system falls back to using `name`
- Existing properties work without changes until display_name is set
