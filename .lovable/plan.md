

## Admin UX Polish -- Comprehensive Improvement Plan

This plan covers four areas: security fixes, table pagination, collapsible sidebar, and polished loading/empty states.

---

### 1. Fix Missing AdminGuard on 2 Pages

**Problem**: `AdminExitIntent` and `AdminSeasonalRatesImport` are wrapped in `AdminLayout` but NOT in `AdminGuard`, meaning any authenticated user (not just admins) can access them.

**Files to change**:
- `src/pages/admin/AdminExitIntent.tsx` -- Wrap the return in `<AdminGuard>` around `<AdminLayout>`
- `src/pages/admin/AdminSeasonalRatesImport.tsx` -- Same treatment, add `<AdminGuard>` wrapper

**Impact**: Security fix. No visual change for admin users; non-admin users will be redirected.

---

### 2. Add Pagination to Admin Tables

**Problem**: The Bookings and Properties tables render all records at once. With growth, this causes performance degradation and poor UX.

**Approach**: Create a reusable `useTablePagination` hook and a `TablePagination` component.

**New files**:
- `src/hooks/useTablePagination.ts` -- Generic hook managing `page`, `pageSize`, `totalPages`, `paginatedData`, and navigation functions
- `src/components/admin/TablePagination.tsx` -- Reusable pagination bar with page info, prev/next buttons, and optional page size selector

**Files to change**:
- `src/pages/admin/AdminBookings.tsx` -- Wire up `useTablePagination` on `filteredBookings`, render `TablePagination` below the table
- `src/pages/admin/AdminProperties.tsx` -- Same for `filteredProperties` in table view mode (grid view will also paginate with a "Load More" button or same bar)

**Default page size**: 15 rows. Options: 15, 30, 50.

---

### 3. Collapsible Sidebar

**Problem**: The sidebar is fixed at 264px (`w-64`), consuming significant screen real estate on smaller desktop screens.

**Approach**: Add a mini/collapsed mode (56px wide, icons only) with a toggle button.

**Files to change**:
- `src/components/admin/AdminLayout.tsx`:
  - Add `sidebarCollapsed` state persisted to `localStorage` (key: `admin-sidebar-collapsed`)
  - In collapsed mode: sidebar becomes `w-14`, only icons visible, section labels hidden
  - Add a toggle button (chevron icon) at the bottom of the sidebar
  - Hovering a collapsed nav item shows a tooltip with the label
  - Collapsible sections auto-close in mini mode
  - Mobile layout stays unchanged (already uses Sheet drawer)

**No new files needed** -- all changes within `AdminLayout.tsx`.

---

### 4. Polish Loading and Empty States

**Problem**: Loading states are inconsistent (some use `Skeleton`, some use spinner, some have nothing). Empty states are minimal text-only.

**Approach**: Create two small reusable components and apply them consistently.

**New files**:
- `src/components/admin/AdminLoadingSkeleton.tsx` -- Configurable skeleton component with variants: `table` (rows of skeleton lines), `cards` (grid of skeleton cards), `form` (label + input skeletons)
- `src/components/admin/AdminEmptyState.tsx` -- Centered empty state with icon, title, description, and optional action button

**Files to change** (apply new components):
- `src/pages/admin/AdminBookings.tsx` -- Use `AdminLoadingSkeleton variant="table"` and `AdminEmptyState` with "No bookings found" + icon
- `src/pages/admin/AdminProperties.tsx` -- Use skeleton for grid/table loading, empty state for no results
- `src/pages/admin/AdminExperiences.tsx` -- Same pattern
- `src/pages/admin/AdminDestinations.tsx` -- Same pattern
- `src/pages/admin/AdminBlogPosts.tsx` -- Same pattern
- `src/pages/admin/AdminNewsletterSubscribers.tsx` -- Same pattern

**Pattern for each page**:
```text
if (isLoading)  -->  <AdminLoadingSkeleton variant="table" rows={8} />
if (data.length === 0)  -->  <AdminEmptyState icon={Calendar} title="No bookings yet" description="..." />
```

---

### Summary of New Files

| File | Purpose |
|------|---------|
| `src/hooks/useTablePagination.ts` | Generic pagination hook |
| `src/components/admin/TablePagination.tsx` | Pagination bar UI |
| `src/components/admin/AdminLoadingSkeleton.tsx` | Loading skeleton variants |
| `src/components/admin/AdminEmptyState.tsx` | Empty state component |

### Summary of Modified Files

| File | Changes |
|------|---------|
| `AdminExitIntent.tsx` | Add AdminGuard wrapper |
| `AdminSeasonalRatesImport.tsx` | Add AdminGuard wrapper |
| `AdminLayout.tsx` | Collapsible sidebar with mini mode |
| `AdminBookings.tsx` | Pagination + loading/empty states |
| `AdminProperties.tsx` | Pagination + loading/empty states |
| `AdminExperiences.tsx` | Loading/empty states |
| `AdminDestinations.tsx` | Loading/empty states |
| `AdminBlogPosts.tsx` | Loading/empty states |
| `AdminNewsletterSubscribers.tsx` | Loading/empty states |

### Implementation Order

1. Security fixes (AdminGuard) -- quick, critical
2. Reusable components (skeleton, empty state, pagination)
3. Collapsible sidebar
4. Apply pagination and polished states across pages

