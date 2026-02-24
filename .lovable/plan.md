
# Multi-PMS Support: Properties from Multiple Providers Simultaneously

## Current Limitation

The database schema already supports multi-PMS (each property maps to a specific `pms_connection_id`), but the code assumes a single active connection:

1. **Sync cron** queries `pms_connections` with `.maybeSingle()` -- only picks one connection
2. **Booking completion** hardcodes `advancecm-sync` edge function name
3. **Booking confirmation/retry** also hardcodes `advancecm-sync`
4. **PMS connection admin UI** may only allow one active connection

## Solution

Route all PMS operations per-property by looking up which connection (and therefore which provider) each property belongs to, then calling the correct edge function.

```text
Property A (Villa Amalfi)     --> pms_property_map --> Connection #1 (Guesty)     --> guesty-sync
Property B (Santorini Retreat) --> pms_property_map --> Connection #2 (AdvanceCM)  --> advancecm-sync
Property C (Tuscan Estate)     --> pms_property_map --> Connection #1 (Guesty)     --> guesty-sync
Property D (No PMS)            --> no mapping        --> local only
```

All properties appear together on the website. Guests have no idea which PMS backs which property.

## Files to Modify

### 1. `supabase/functions/pms-sync-cron/index.ts` -- Sync ALL active connections

**Current**: Fetches one active connection, syncs only its properties.

**Change**: Fetch ALL active connections, loop through each, sync their mapped properties. Each connection's properties are synced independently.

```text
Before:
  Get single active connection --> sync its properties

After:
  Get ALL active connections
  For each connection:
    Get its mapped properties
    Sync each property via iCal (iCal is provider-agnostic)
    Record sync run per connection
```

Since iCal feeds are provider-agnostic (both Guesty and AdvanceCM export standard iCal), the existing iCal sync logic works for all providers without changes.

### 2. `src/hooks/useCompleteBooking.ts` -- Route bookings to correct PMS

**Current**: Hardcodes `advancecm-sync` for all PMS booking pushes.

**Change**: When pushing a booking to PMS, look up the property's `pms_connection_id`, then look up the connection's `pms_name` to determine which edge function to call.

Three functions need updating:
- `useCompleteBooking` (instant booking push)
- `useConfirmBookingWithPMS` (admin confirmation push)
- `useRetryPMSSync` (retry failed sync)

Each will:
1. Join `pms_property_map` with `pms_connections` to get the provider name
2. Map provider name to edge function: `advancecm` uses `advancecm-sync`, `guesty` uses `guesty-sync`
3. Call the correct edge function

### 3. `src/integrations/pms/index.ts` -- Provider-aware adapter factory

**Current**: Returns only `AdvanceCMAdapter` or `MockPMSAdapter`.

**Change**: Accept a provider ID parameter and return the correct adapter. Add a helper to map provider names to edge function names.

```text
getEdgeFunctionForProvider('advancecm') --> 'advancecm-sync'
getEdgeFunctionForProvider('guesty')    --> 'guesty-sync'
getEdgeFunctionForProvider('hostaway')  --> 'hostaway-sync'
```

### 4. `src/lib/pms-providers.ts` -- Add edge function name to provider config

Add an `edgeFunctionName` field to each provider config so the mapping is centralized:

```text
advancecm  --> edgeFunctionName: 'advancecm-sync'
guesty     --> edgeFunctionName: 'guesty-sync'
hostaway   --> edgeFunctionName: 'hostaway-sync'
```

### 5. `src/hooks/useAdminPMSHealth.ts` -- Support multiple connections

Review and update to display health for ALL active connections, not just one.

### 6. Admin PMS UI components (if needed)

- `PMSConfigDialog.tsx` -- Allow creating additional connections without deactivating existing ones
- `PMSSyncStatusPanel.tsx` -- Show sync status grouped by connection/provider
- `PMSConnectionHealthCard.tsx` -- Show health per connection

## What Does NOT Change

- Guest-facing UI -- all properties appear together regardless of PMS source
- Database schema -- `pms_property_map` already has the `pms_connection_id` foreign key
- iCal sync logic -- iCal is a universal standard, works with any PMS
- Stripe payment flow -- completely independent of PMS
- Property admin forms -- properties are managed locally, PMS mapping is separate

## Implementation Order

1. Add `edgeFunctionName` to provider registry (foundation)
2. Update sync cron to loop through all active connections
3. Update booking hooks to dynamically route to correct edge function
4. Update PMS adapter factory
5. Update admin UI to support viewing/managing multiple connections

## Important Notes

- The Guesty edge function (`guesty-sync`) from the previous plan must be created first before Guesty properties can push bookings. The iCal sync will work immediately since it's provider-agnostic.
- Each PMS connection can be independently enabled/disabled without affecting others.
- Properties without any PMS mapping continue to work as local-only properties.
