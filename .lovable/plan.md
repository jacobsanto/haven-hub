

## Fix Individual Property Sync Buttons

The issue is that when you click "Sync" on any single property, ALL sync buttons in the Property Mappings table show the loading spinner and become disabled. This happens because `syncPropertyNow.isPending` is a global state that applies to the entire mutation, not to individual rows.

---

### The Problem

**Current behavior:**
- Click "Sync" on Property A
- Property A, B, C, D buttons ALL show spinning icon and become disabled
- User can't tell which property is actually syncing

**Expected behavior:**
- Click "Sync" on Property A
- Only Property A's button shows the spinning icon
- Other properties remain clickable

---

### Solution

Track the currently-syncing property ID in local state and use it to conditionally show the loading state only for that specific row.

---

### Implementation

**File to modify:** `src/pages/admin/AdminPMSHealth.tsx`

1. **Add state to track which property is syncing:**
   ```tsx
   const [syncingPropertyId, setSyncingPropertyId] = useState<string | null>(null);
   ```

2. **Update the sync handler to track the property:**
   ```tsx
   const handleSyncPropertyNow = async (externalPropertyId: string) => {
     if (!connection) return;
     setSyncingPropertyId(externalPropertyId); // Track which one is syncing
     try {
       const result = await syncPropertyNow.mutateAsync({ 
         connectionId: connection.id, 
         externalPropertyId 
       });
       // toast notifications...
     } catch (error) {
       // error handling...
     } finally {
       setSyncingPropertyId(null); // Clear when done
     }
   };
   ```

3. **Update the button to use row-specific loading state:**
   ```tsx
   <Button
     variant="ghost"
     size="sm"
     onClick={() => handleSyncPropertyNow(mapping.external_property_id)}
     disabled={syncingPropertyId !== null || !mapping.sync_enabled}
   >
     <RefreshCw className={`h-4 w-4 mr-1 ${
       syncingPropertyId === mapping.external_property_id ? 'animate-spin' : ''
     }`} />
     Sync
   </Button>
   ```

---

### Technical Details

| Change | Description |
|--------|-------------|
| Add `syncingPropertyId` state | Tracks the `external_property_id` currently being synced |
| Wrap mutation in try/finally | Ensures state is cleared even on errors |
| Button spinner condition | Only spin if this row's ID matches `syncingPropertyId` |
| Button disabled condition | Disabled if any sync is in progress OR sync is disabled for this property |

---

### Benefits

1. **Clear feedback**: Users see exactly which property is syncing
2. **Prevents double-clicks**: All buttons disabled during any sync operation
3. **Proper cleanup**: State is cleared even if the sync fails

