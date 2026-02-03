
# Admin Availability Page Enhancements Plan

## Overview
This plan adds three major features to the Admin Availability page:
1. **Bulk Date Selection** - Select multiple dates to block/unblock at once
2. **Sync Now Button** - Manual trigger to sync availability from PMS
3. **Multi-Month Overview** - View 3 months at a glance

---

## Current State Analysis

### Existing Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminAvailability.tsx` | `src/pages/admin/` | Main page with single-month calendar |
| `AvailabilityCalendarGrid.tsx` | `src/components/admin/availability/` | Calendar grid with single-click toggle |
| `SyncStatusBadge.tsx` | `src/components/admin/availability/` | Has `onSyncNow` prop but NOT CONNECTED |
| `AvailabilityHealthCard.tsx` | `src/components/admin/availability/` | Health dashboard stats |
| `useBulkUpdateAvailability` | `src/hooks/useAvailability.ts` | Already exists but NOT USED |
| `useSyncPropertyAvailability` | `src/hooks/useAdvanceCMSync.ts` | Already exists for single-property sync |

### Key Finding
The **Sync Now** button UI already exists in `SyncStatusBadge.tsx` but the `onSyncNow` callback is **never passed** from `AdminAvailability.tsx`.

---

## Enhancement 1: Bulk Date Selection

### User Experience
- Hold **Shift + Click** to start a range selection
- Second **Shift + Click** completes the range
- Selected dates highlighted with a selection indicator
- "Block Selected" and "Unblock Selected" buttons appear when dates are selected
- Clear selection button

### Technical Changes

**New State in AdminAvailability.tsx:**
```typescript
const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
const [isSelectingRange, setIsSelectingRange] = useState(false);
const [rangeStart, setRangeStart] = useState<Date | null>(null);
```

**Modify AvailabilityCalendarGrid.tsx:**
- Add `selectedDates` prop and `onSelectDate` callback
- Add `selectionMode` prop for range selection UI
- Highlight selected dates with a distinct style (blue ring)
- Support Shift+Click for range selection

**Add BulkActionsBar Component:**
```text
src/components/admin/availability/BulkActionsBar.tsx
```
- Shows count of selected dates
- "Block All" button
- "Unblock All" button  
- "Clear Selection" button
- Uses existing `useBulkUpdateAvailability` hook

---

## Enhancement 2: Sync Now Button Functionality

### User Experience
- Click "Sync Now" next to property dropdown
- Button shows spinning icon while syncing
- Toast notification on success/failure
- Availability calendar auto-refreshes after sync

### Technical Changes

**Modify AdminAvailability.tsx:**
```typescript
import { useSyncPropertyAvailability } from '@/hooks/useAdvanceCMSync';

const syncAvailability = useSyncPropertyAvailability();

const handleSyncNow = async () => {
  if (!selectedPropertyId) return;
  
  try {
    await syncAvailability.mutateAsync({
      propertyId: selectedPropertyId,
      startDate: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      endDate: format(addMonths(endOfMonth(currentMonth), 11), 'yyyy-MM-dd'),
    });
    toast({ title: 'Sync Complete', description: 'Availability updated from PMS' });
  } catch (error) {
    toast({ title: 'Sync Failed', variant: 'destructive' });
  }
};
```

**Connect to SyncStatusBadge:**
```tsx
<SyncStatusBadge
  lastSyncAt={propertySyncInfo.last_availability_sync_at}
  syncStatus={syncHealth?.lastSyncStatus}
  onSyncNow={handleSyncNow}  // <-- ADD THIS
  isSyncing={syncAvailability.isPending}  // <-- ADD THIS
/>
```

---

## Enhancement 3: Multi-Month Overview

### User Experience
- Toggle button: "Single Month" / "3 Month View"
- In 3-month view, show current + next 2 months side-by-side
- Smaller calendar cells in overview mode
- Still supports clicking dates for blocking

### Technical Changes

**New State:**
```typescript
const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
```

**New Component:**
```text
src/components/admin/availability/MultiMonthCalendar.tsx
```
- Renders 3 `AvailabilityCalendarGrid` components side-by-side
- Responsive: stacks on mobile, 3-column on desktop
- Compact variant with smaller cells

**Modify AvailabilityCalendarGrid.tsx:**
- Add `compact` prop for smaller cells in multi-month view
- Add `showMonthHeader` prop to display month name above each grid

---

## File Changes Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminAvailability.tsx` | Add bulk selection state, sync handler, view toggle, connect all new features |
| `src/components/admin/availability/AvailabilityCalendarGrid.tsx` | Add selection support, compact mode, month header |
| `src/components/admin/availability/index.ts` | Export new components |
| `src/hooks/useAvailability.ts` | Add query invalidation for sync |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/availability/BulkActionsBar.tsx` | Actions toolbar for selected dates |
| `src/components/admin/availability/MultiMonthCalendar.tsx` | 3-month overview wrapper |

---

## Implementation Details

### BulkActionsBar.tsx Structure
```text
+---------------------------------------------------------------+
| 📋 5 dates selected    [Block All] [Unblock All] [Clear ✕]   |
+---------------------------------------------------------------+
```

### Multi-Month Layout
```text
Desktop (3-column):
+-------------------+-------------------+-------------------+
|    February 2026  |     March 2026    |     April 2026    |
|   [Calendar Grid] |   [Calendar Grid] |   [Calendar Grid] |
+-------------------+-------------------+-------------------+

Mobile (stacked):
+-------------------+
|  February 2026    |
|  [Calendar Grid]  |
+-------------------+
|    March 2026     |
|  [Calendar Grid]  |
+-------------------+
```

### Selection Highlighting
- Selected dates: `ring-2 ring-blue-500 ring-offset-1`
- Range-in-progress: `bg-blue-100` for dates between start and cursor

---

## UI Controls Layout

### Updated Header Section
```text
+------------------------------------------------------------------+
| Availability                                                      |
| Manage property availability and block dates                      |
+------------------------------------------------------------------+
| [Property Dropdown ▼] [Last synced 2h ago] [Sync Now]            |
+------------------------------------------------------------------+
| View: [Single Month] [3 Months]                                   |
+------------------------------------------------------------------+
```

### Bulk Actions (appears when dates selected)
```text
+------------------------------------------------------------------+
| 📋 8 dates selected                                               |
| [Block Selected] [Unblock Selected] [Clear Selection]             |
+------------------------------------------------------------------+
```

---

## Expected Outcomes

After implementation:
1. **Bulk Operations**: Users can select date ranges with Shift+Click and bulk block/unblock
2. **Sync Now**: One-click manual sync from PMS for selected property
3. **Multi-Month View**: At-a-glance overview of next 3 months
4. **Improved UX**: Less clicking for common operations

---

## Testing Considerations

- Test Shift+Click range selection across month boundaries
- Test Sync Now with and without PMS connection
- Test multi-month view on mobile devices
- Verify bulk operations don't affect booked dates (should be protected)
- Ensure real-time updates still work after bulk changes
