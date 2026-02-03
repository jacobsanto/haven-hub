

# Tokeet Availability API Date Interpretation Bug

## Problem Identified

The Tokeet **Availability API** (`/rental/{id}/availability`) is returning different dates than what shows in Tokeet's UI:

| Booking | Tokeet UI | Availability API Returns |
|---------|-----------|--------------------------|
| James | Feb 11 - Feb 14 | `from: Feb 10, to: Feb 11` |
| STELLA | Feb 3 - Feb 4 | `from: Feb 3, to: Feb 4` |

This suggests **one of two issues**:

### Theory A: Timezone Conversion Bug
The Tokeet API returns dates in a specific timezone (likely UTC), but we're parsing them as local dates, causing a 1-day shift.

### Theory B: API Returns "Night Ranges" Not "Stay Dates"
The availability API might return the **nights blocked** rather than check-in/check-out. For a 3-night stay (Feb 11-14), it might return `from: Feb 10, to: Feb 11` meaning "nights starting Feb 10".

## The Solution: Use Inquiry API Instead

Looking at `pms-reconcile/index.ts`, it uses the **Inquiry API** (`/inquiry`) which returns:
```typescript
arrive: number; // Unix timestamp for check-in
depart: number; // Unix timestamp for check-out
```

These timestamps are the **actual booking dates**, not the blocked calendar ranges.

## Recommended Fix

### Option 1: Primary Fix (Use Inquiry API for Booking Data)

Modify `pms-sync-cron` to:
1. **Keep using Availability API** only for blocking calendar dates (its intended purpose)
2. **Use Inquiry API** for extracting booking information (guest names, actual dates)

This separates concerns:
- **Availability blocks** → from availability endpoint (for calendar display)
- **Booking records** → from inquiry endpoint (for bookings table)

### Option 2: Quick Fix (Add Timezone Handling)

If the issue is timezone-related, we can force UTC interpretation in the sync:

```typescript
// Parse Tokeet dates as UTC explicitly
const rangeStart = new Date(range.from + 'T00:00:00Z');
const rangeEnd = new Date(range.to + 'T00:00:00Z');
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/pms-sync-cron/index.ts` | Either fetch from inquiry API for booking data, OR add timezone handling to date parsing |

## Implementation Steps

1. **Test the theory** - Call the inquiry API for Centro House and log what dates it returns for James
2. **If inquiry dates are correct** - Modify sync to use inquiry API for booking extraction
3. **If both APIs return wrong dates** - Investigate Tokeet date timezone settings

## Verification

After fix:
- James booking should show Feb 11 check-in, Feb 14 check-out
- Calendar should block Feb 11, 12, 13 (checkout day Feb 14 available)

