

# Add Property Location to Stripe Payment Metadata

Enhance the Stripe payment integration to include property location (city, country) for better transaction identification in the Stripe Dashboard.

---

## Current State

The `create-payment-intent` edge function receives property details but **missing location data**:
- ✅ `propertyId`, `propertyName`, `propertySlug`
- ❌ `propertyCity`, `propertyCountry` ← Not currently passed

---

## Changes Required

### 1. Update Checkout.tsx

**File:** `src/pages/Checkout.tsx`

Add `propertyCity` and `propertyCountry` to the payload sent to `create-payment-intent`:

```typescript
// Lines 223-253: Update supabase.functions.invoke call
const { data, error } = await supabase.functions.invoke('create-payment-intent', {
  body: {
    propertyId: property.id,
    propertyName: property.name,
    propertySlug: property.slug,
    propertyCity: property.city,      // ← ADD
    propertyCountry: property.country, // ← ADD
    // ... rest of fields
  },
});
```

### 2. Update create-payment-intent Edge Function

**File:** `supabase/functions/create-payment-intent/index.ts`

**A. Extend the request interface:**
```typescript
interface CreatePaymentIntentRequest {
  // Property details
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  propertyCity: string;     // ← ADD
  propertyCountry: string;  // ← ADD
  // ... rest of fields
}
```

**B. Add to metadata object:**
```typescript
const metadata: Record<string, string> = {
  // ... existing fields
  
  // Property location (NEW)
  property_city: body.propertyCity || "",
  property_country: body.propertyCountry || "",
  
  // ... rest of fields
};
```

**C. Update payment description to include location:**
```typescript
description: `Booking at ${body.propertyName}, ${body.propertyCity} - ${body.checkIn} to ${body.checkOut}`,
```

---

## Stripe Dashboard Visibility

After implementation, each payment will display:

| Metadata Key | Example Value |
|--------------|---------------|
| `property_name` | "Villa Amalfi" |
| `property_city` | "Positano" |
| `property_country` | "Italy" |
| `check_in` | "2025-06-15" |
| `check_out` | "2025-06-22" |
| `booking_reference` | "BK-202506-AB12" |

The payment description will show:
```
Booking at Villa Amalfi, Positano - 2025-06-15 to 2025-06-22
```

---

## Testing Plan

After implementation:
1. Navigate to a property with instant booking enabled
2. Select dates and proceed through checkout
3. Complete a test payment
4. Check Stripe Dashboard → Payments → View payment details
5. Verify `property_city` and `property_country` appear in metadata
6. Verify description includes the city name

