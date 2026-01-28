

# Add "Sync All Rates" Button to PMS Health Page

## Overview

Add a bulk action button to sync rates from Tokeet for all linked properties at once, updating `base_price`, `seasonal_rates`, and `rate_plans` for every mapped property.

---

## Implementation Steps

### 1. Add Hook for Bulk Rate Sync

**File:** `src/hooks/useAdvanceCMSync.ts`

Add a new hook `useSyncAllPropertyRates` that:
- Fetches all property mappings from `pms_property_map`
- Iterates through each mapping and calls the `sync-rates` edge function action
- Tracks progress (success/failed counts)
- Returns aggregated results

### 2. Update PMS Health Page

**File:** `src/pages/admin/AdminPMSHealth.tsx`

- Import the new `useSyncAllPropertyRates` hook
- Add a "Sync All Rates" button in the Property Mappings tab header
- Show loading state with progress indicator during bulk sync
- Display toast notification with results (X properties updated, Y failed)

### 3. Update PMSConnectionHealthCard (Optional Enhancement)

**File:** `src/components/admin/PMSConnectionHealthCard.tsx`

- Add "Sync All Rates" as an additional action button alongside existing buttons

---

## UI Location

The button will appear in two locations:
1. **Primary:** In the Property Mappings card header, next to the card title
2. **Secondary:** In the PMSConnectionHealthCard action buttons row

---

## Technical Details

### New Hook: `useSyncAllPropertyRates`

```typescript
export function useSyncAllPropertyRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      // 1. Get all property mappings
      const { data: mappings } = await supabase
        .from("pms_property_map")
        .select("external_property_id, property_id")
        .eq("pms_connection_id", connectionId)
        .eq("sync_enabled", true);

      // 2. Sync rates for each property
      const results = { success: 0, failed: 0, errors: [] };
      
      for (const mapping of mappings) {
        // Call sync-rates edge function for each property
        // Track success/failure
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["seasonal-rates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "rate-plans"] });
    },
  });
}
```

### Button Placement in AdminPMSHealth.tsx

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <div>
      <CardTitle>Property Mappings</CardTitle>
      <CardDescription>...</CardDescription>
    </div>
    <Button
      onClick={handleSyncAllRates}
      disabled={syncAllRates.isPending || !propertyMappings?.length}
    >
      {syncAllRates.isPending ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <DollarSign className="h-4 w-4 mr-2" />
      )}
      Sync All Rates
    </Button>
  </div>
</CardHeader>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAdvanceCMSync.ts` | Add `useSyncAllPropertyRates` hook |
| `src/pages/admin/AdminPMSHealth.tsx` | Add button, handler, and import hook |

---

## Result

After implementation:
- Admin can click "Sync All Rates" to bulk update pricing for all linked properties
- Progress feedback during sync operation
- Toast notification with summary (e.g., "Updated rates for 5 properties, 1 failed")
- All `base_price`, `seasonal_rates`, and `rate_plans` data refreshed from Tokeet

