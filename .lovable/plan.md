

# Implement Tokeet Rate Sync

## Current Gap

Properties are imported with `base_price: 0` because rate syncing doesn't exist. The Tokeet API provides rate data that we need to pull and map to our `rate_plans` and `seasonal_rates` tables.

---

## Tokeet Rate API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/rate?account={accountId}` | List all rates |
| `GET /v1/rental/{pkey}/rate?account={accountId}` | Get rates for specific property |

---

## Implementation Steps

### 1. Add Rate Interface to Edge Function

```typescript
interface TokeetRate {
  pkey: string;
  rental_id: string;
  name: string;
  nightly: number;        // Base nightly rate
  weekly?: number;        // Weekly rate
  monthly?: number;       // Monthly rate
  min_stay?: number;      // Minimum stay requirement
  max_stay?: number;      // Maximum stay
  from?: string;          // Rate valid from (ISO date)
  to?: string;            // Rate valid to (ISO date)
  currency?: string;      // Currency code
}
```

### 2. Add `fetch-rates` Action

Add a new case to the edge function that:
1. Calls `/v1/rental/{externalId}/rate` 
2. Transforms Tokeet rate structure to our format
3. Returns rates for storage in `rate_plans` or `seasonal_rates`

### 3. Add `sync-rates` Action

Create an action that:
1. Fetches rates for a property
2. Updates the property's `base_price` with the default rate
3. Creates entries in `seasonal_rates` for date-specific pricing
4. Creates entries in `rate_plans` for rate variations (weekly, monthly)

### 4. Update Import Flow

Modify `import-property` to also:
1. Fetch rates from Tokeet
2. Set proper `base_price` from default rate
3. Create corresponding seasonal rate entries

---

## Database Mapping

| Tokeet Field | Our Table | Our Field |
|--------------|-----------|-----------|
| `nightly` | `properties` | `base_price` |
| `min_stay` | `rate_plans` | `min_stay` |
| `max_stay` | `rate_plans` | `max_stay` |
| `from` / `to` | `seasonal_rates` | `start_date` / `end_date` |
| `nightly` (seasonal) | `seasonal_rates` | `nightly_rate` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/advancecm-sync/index.ts` | Add `TokeetRate` interface, `fetch-rates` and `sync-rates` actions |
| `src/integrations/pms/advancecm-adapter.ts` | Implement `fetchRates()` method (currently returns empty array) |
| `src/hooks/useAdvanceCMSync.ts` | Add `useSyncPropertyRates` hook |

---

## Technical Details

### Edge Function: New `fetch-rates` Action

```typescript
case "fetch-rates": {
  const { externalId } = body;
  if (!externalId) {
    throw new Error("externalId is required");
  }
  
  const response = await callTokeetAPI(
    `/rental/${externalId}/rate`,
    apiKey,
    accountId
  );
  
  if (!response.ok) {
    throw new Error(`Tokeet API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const rates = Array.isArray(data) ? data : (data.data || []);
  
  return new Response(
    JSON.stringify({
      success: true,
      rates: rates.map(rate => ({
        externalId: rate.pkey,
        rentalId: rate.rental_id,
        name: rate.name,
        nightly: rate.nightly,
        weekly: rate.weekly,
        monthly: rate.monthly,
        minStay: rate.min_stay,
        maxStay: rate.max_stay,
        validFrom: rate.from,
        validTo: rate.to,
        currency: rate.currency || 'EUR',
      })),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Enhanced Import Property

Update the import to also set base_price from rates:

```typescript
case "import-property": {
  // ... existing code ...
  
  // After creating property, fetch and sync rates
  const ratesResponse = await callTokeetAPI(
    `/rental/${propertyData.pkey}/rate`,
    apiKey,
    accountId
  );
  
  if (ratesResponse.ok) {
    const ratesData = await ratesResponse.json();
    const rates = Array.isArray(ratesData) ? ratesData : (ratesData.data || []);
    
    // Find default/base rate
    const baseRate = rates.find(r => !r.from && !r.to) || rates[0];
    
    if (baseRate?.nightly) {
      // Update property with base price
      await supabase
        .from("properties")
        .update({ base_price: baseRate.nightly })
        .eq("id", newProperty.id);
      
      // Create seasonal rates for date-specific pricing
      for (const rate of rates.filter(r => r.from && r.to)) {
        await supabase.from("seasonal_rates").insert({
          property_id: newProperty.id,
          name: rate.name || "Seasonal Rate",
          start_date: rate.from,
          end_date: rate.to,
          nightly_rate: rate.nightly,
          price_multiplier: 1.0,
        });
      }
    }
  }
  
  // ... rest of existing code ...
}
```

---

## Result

After implementation:
- Imported properties will have correct `base_price` from Tokeet
- Seasonal pricing periods will be created automatically
- Rate plans with min/max stay requirements will be synced
- Manual rate sync will be available from Admin PMS Health page

