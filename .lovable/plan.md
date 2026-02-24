

# Fix Multi-PMS Admin Page: Show All Connections

## Problem

The PMS admin page has several issues that prevent you from seeing your Guesty connection:

1. **Single-connection display**: `usePMSConnectionStatus()` calls `.maybeSingle()` -- it only returns ONE active connection. If AdvanceCM was created first, Guesty is invisible.

2. **Hardcoded AdvanceCM activation**: The Configure dialog uses `useEnsureAdvanceCMConnection()` which always creates/activates an "AdvanceCM" record regardless of which provider you selected. Selecting Guesty and clicking "Activate" still saves an AdvanceCM connection.

3. **Test button only works for AdvanceCM**: The dialog disables the Test button for non-AdvanceCM providers (`disabled={!isAdvanceCM}`), and the test function calls the hardcoded AdvanceCM adapter.

## Solution

### 1. Update the admin page to show ALL active connections

Replace the single-connection view with a list of all connections. Each connection gets its own health card showing provider name, status, last sync, and action buttons.

**File: `src/pages/admin/AdminPMSHealth.tsx`**
- Use `useAllPMSConnections()` (already exists) instead of `usePMSConnectionStatus()`
- Render a health card per connection
- Show property mappings, sync history, etc. filtered by the selected/expanded connection
- Add an "Add Connection" button for adding additional PMS providers

### 2. Make the Config Dialog provider-aware

**File: `src/components/admin/PMSConfigDialog.tsx`**
- Replace `useEnsureAdvanceCMConnection()` with a new generic `useEnsurePMSConnection(providerId)` mutation
- The new mutation creates a `pms_connections` row with the correct `pms_name` and `config.provider` matching the selected provider (e.g., `pms_name: "Guesty"`, `config: { provider: "guesty" }`)
- Enable the Test button for all providers that have edge functions deployed (route via `resolveEdgeFunctionForConnection`)
- Replace `useTestAdvanceCMConnection()` with the existing `useTestPMSConnection(connectionId)` from the health hooks

### 3. Add a generic "ensure connection" hook

**File: `src/hooks/useAdminPMSHealth.ts`** (add new hook)

```
useEnsurePMSConnection() mutation:
  Input: { providerId, providerName }
  Logic:
    1. Check if a connection with config->>provider = providerId already exists
    2. If yes, activate it and return it
    3. If no, INSERT new row with pms_name = providerName, config = { provider: providerId }
    4. Invalidate queries
```

This replaces the AdvanceCM-only version.

### 4. Update the Connection Health Card to show provider name

**File: `src/components/admin/PMSConnectionHealthCard.tsx`**
- No structural changes needed, it already reads provider from connection config

## Files to Modify

- `src/pages/admin/AdminPMSHealth.tsx` -- Switch to multi-connection view with `useAllPMSConnections()`
- `src/components/admin/PMSConfigDialog.tsx` -- Use generic ensure/test hooks, remove AdvanceCM hardcoding
- `src/hooks/useAdminPMSHealth.ts` -- Add `useEnsurePMSConnection()` hook

## What Does NOT Change

- Database schema (already supports multiple connections)
- Edge functions
- Booking routing logic (already dynamic)
- Provider registry (`pms-providers.ts`)
- Guest-facing UI

