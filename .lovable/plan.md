

# Add Delete/Deactivate PMS Connection Capability

## Problem
The PMS Health page currently has no way to delete or deactivate a PMS connection. You have a Guesty connection that is misconfigured, and there is no UI to remove it and start fresh.

## Solution
Add a "Delete Connection" capability to the PMS health page so you can remove the wrong Guesty entry, then reconfigure it properly.

## Changes

### 1. Add `useDeletePMSConnection` hook
**File: `src/hooks/useAdminPMSHealth.ts`**

Add a new mutation that:
- Sets `is_active = false` on the connection (soft delete -- safer than hard delete, preserves audit trail)
- Disables all property mappings linked to that connection
- Invalidates relevant query caches

### 2. Add Delete button to each connection card
**File: `src/pages/admin/AdminPMSHealth.tsx`**

Add a delete/remove button to each connection's card area (next to Configure, Import, Test, Sync Now). Includes a confirmation dialog to prevent accidental deletion.

### 3. Update connection health card to accept onDelete
**File: `src/components/admin/PMSConnectionHealthCard.tsx`**

Add an `onDelete` prop and a "Remove" button with a confirmation alert dialog to the card's action buttons.

## Technical Details

- **Soft delete approach**: Sets `is_active = false` rather than deleting the row, preserving sync history and audit data
- **Cascading disable**: All `pms_property_map` entries for the connection get `sync_enabled = false` so no orphaned syncs occur
- **Confirmation dialog**: Uses the existing `AlertDialog` component to require explicit confirmation before removing
- **Cache invalidation**: Refreshes all PMS-related queries after deletion
