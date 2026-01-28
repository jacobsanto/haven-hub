
# Fix BookingDetailDialog Issues

## Problems Identified

1. **React Warning**: "Function components cannot be given refs" - The Badge component doesn't use `forwardRef` but receives refs when used inside certain shadcn/ui components
2. **"Booking Not Found" Flash**: Dialog briefly shows "not found" state during query refetches because it checks `!booking` without considering the loading/stale state

## Solutions

### Fix 1: Add forwardRef to Badge component

**File**: `src/components/ui/badge.tsx`

Wrap the Badge component with `React.forwardRef` to properly handle ref forwarding:

```typescript
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";
```

### Fix 2: Improve query stability in useBookingDetails

**File**: `src/hooks/useBookings.ts`

Add `staleTime` and `gcTime` to prevent unnecessary refetches that cause the "not found" flash:

```typescript
return useQuery({
  queryKey: ['admin', 'booking-detail', bookingId],
  queryFn: async (): Promise<BookingDetails> => {
    // ... existing code
  },
  enabled: !!bookingId,
  staleTime: 30000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
});
```

### Fix 3: Better loading state handling in BookingDetailDialog

**File**: `src/components/admin/BookingDetailDialog.tsx`

Add check for `isFetching` state to prevent showing "not found" during background refetches:

```typescript
const { data, isLoading, isFetching } = useBookingDetails(bookingId);

// Show skeleton during initial load OR background refetch when no data
if (isLoading || (isFetching && !data?.booking)) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Skeleton />
      </DialogContent>
    </Dialog>
  );
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/badge.tsx` | Add `forwardRef` wrapper |
| `src/hooks/useBookings.ts` | Add `staleTime` and `gcTime` options |
| `src/components/admin/BookingDetailDialog.tsx` | Improve loading state handling with `isFetching` |

## Expected Results

After these fixes:
- No more React ref warnings in console
- Dialog will not flash "Booking Not Found" during refetches
- Data will remain visible during background updates
