

# Delete Imported Properties When Removing a PMS Connection

## Problem
When you remove a PMS connection, only the connection is deactivated and syncs are disabled. The properties that were imported through that connection remain in the system, cluttering the property list and potentially causing confusion.

## Solution
Update the deactivation logic so that when a PMS connection is removed, all properties that were imported via that connection are also deleted (along with their mappings and related availability data). The confirmation dialog will be updated to clearly warn that imported properties will be removed.

## Changes

### 1. Update `useDeactivatePMSConnection` mutation
**File: `src/hooks/useAdminPMSHealth.ts`**

Before deactivating the connection:
- Fetch all `pms_property_map` entries for the connection to get the list of `property_id` values
- Delete all `availability` records for those properties
- Delete the `pms_property_map` entries (hard delete, not just disable)
- Delete the `properties` rows themselves
- Then deactivate the connection as before
- Invalidate property-related query caches as well

### 2. Update confirmation dialog text
**File: `src/components/admin/PMSConnectionHealthCard.tsx`**

Update the `AlertDialogDescription` to warn the user that imported properties will also be deleted, not just syncs disabled.

## Technical Details

Deletion order matters due to foreign key relationships:
1. Get property IDs from `pms_property_map` for this connection
2. Delete `availability` rows for those property IDs
3. Delete `booking_addons`, `seasonal_rates`, `special_offers`, `rate_plans` for those property IDs (any tables with `property_id` FK)
4. Delete `pms_property_map` rows for this connection
5. Delete `properties` rows
6. Set `is_active = false` on the connection

The confirmation dialog will clearly state: "This will permanently delete all properties imported through this connection, their availability data, and disable all syncs."

Cache invalidation will include `['properties']` and `['availability-calendar']` queries in addition to the existing PMS queries.
