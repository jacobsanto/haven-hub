
# Fix: Import Properties Shows Wrong Provider's Properties

## Root Cause
The "Import Properties" dialog (`PMSPropertyImportDialog.tsx`) always calls `useFetchTokeetProperties()` from `useAdvanceCMSync.ts`, which is hardcoded to the AdvanceCM adapter. It completely ignores which connection you clicked "Import" on. So even when importing for Guesty, it fetches AdvanceCM properties.

## Solution
Make the import dialog provider-aware by replacing the hardcoded AdvanceCM fetch with a dynamic call that routes to the correct edge function based on the connection's provider.

## Changes

### 1. Add a generic `useFetchPMSProperties` hook
**File: `src/hooks/useAdminPMSHealth.ts`**

Add a new mutation that:
- Takes a `connectionId`
- Resolves the correct edge function (e.g. `guesty-sync` or `advancecm-sync`)
- Calls it with `action: 'fetch-properties'`
- Returns the property list in a normalized format

### 2. Update `PMSPropertyImportDialog` to use the generic hook
**File: `src/components/admin/PMSPropertyImportDialog.tsx`**

- Replace `useFetchTokeetProperties` with the new `useFetchPMSProperties`
- Pass `connectionId` when fetching so it routes to the correct provider
- Update the dialog title/description to show the actual provider name instead of hardcoded "AdvanceCM" / "Tokeet"
- Replace `useBatchImportProperties` with a generic version that calls the correct edge function's `import-property` action

### 3. Add generic batch import hook
**File: `src/hooks/useAdminPMSHealth.ts`**

Add a `useBatchImportPMSProperties` mutation that:
- Takes properties + connectionId
- Resolves the edge function for the connection
- Calls `import-property` for each selected property via the correct edge function
- Creates `pms_property_map` entries and `properties` records

## Technical Details

- The `guesty-sync` edge function already supports `fetch-properties` and `import-property` actions
- The `advancecm-sync` edge function already supports `fetch-properties`
- Property data will be normalized to a common shape (`externalId`, `name`, `city`, `country`, `bedrooms`, `maxGuests`) regardless of provider
- The dialog title will dynamically show "Import Properties from Guesty" or "Import Properties from AdvanceCM" based on the connection
