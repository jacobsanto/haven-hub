
# Fix Tokeet API Date Interpretation Bug

## Problem Identified

The Tokeet Availability API returns dates that don't match the Tokeet UI. Based on your screenshot and our database investigation:

| Booking | Your Tokeet UI | Availability API | Gap |
|---------|----------------|------------------|-----|
| STELLA | Feb 4-5 out and in 5-7 (out Feb 8) | Feb 3-4 | Wrong dates, wrong duration |
| CRAIG STEVENS | Feb 8-9 | Missing | Not returned at all |
| JAMES | Feb 11-13 (out Feb 14) | Feb 10-11 | 1-day shift, wrong duration |

The Inquiry API has accurate timestamps but only contains bookings that originated as Tokeet inquiries - not manual blocks or iCal imports.

## Root Cause Analysis

The Tokeet `/rental/{id}/availability` API appears to return:
- **Blocked "nights"** rather than **stay dates**
- A 1-day shift in the date interpretation
- Incomplete data for some bookings (Craig Stevens missing)

This is a Tokeet API quirk we need to work around.

## Proposed Solution

### Step 1: Adjust Date Parsing for Availability API

Shift the `from` and `to` dates by +1 day when processing Availability API data:

```text
Current (wrong):   from: Feb 10, to: Feb 11 → Block Feb 10 only
Corrected:         from: Feb 10 → Feb 11 (check-in), to: Feb 11 → Feb 14 based on duration
```

The issue is that the `to` date is also wrong (should be Feb 14, not Feb 11 for a 3-night stay).

### Step 2: Calculate Duration from UI Context

Since the Availability API returns wrong durations, we need to either:
- **Option A**: Cross-reference with Tokeet's rate calendar to detect multi-night blocks
- **Option B**: Trust Availability API for blocking dates only, don't extract booking details from it

### Step 3: Use Combined Data Strategy

Update `pms-sync-cron` to:
1. Use **Inquiry API** as primary source for booking records (accurate dates)
2. Use **Availability API** only for calendar blocking (with +1 day shift correction)
3. For blocks NOT in Inquiry API (like James), create them as "owner blocks" not bookings

## Technical Changes

### File: `supabase/functions/pms-sync-cron/index.ts`

1. Add date shift correction when processing Availability API:

```typescript
// Tokeet Availability API dates are shifted -1 day
// from: "2026-02-10" actually means check-in is Feb 11
const correctedFrom = new Date(range.from);
correctedFrom.setDate(correctedFrom.getDate() + 1);
const correctedFromStr = correctedFrom.toISOString().split('T')[0];
```

2. For the `to` date, the fix is less clear because the API returns wrong durations. We may need to:
   - Just block the corrected `from` date to corrected `to` date as-is
   - Accept that some blocks will be shorter than the actual booking

### Verification Steps

After implementing:
1. Trigger a manual sync
2. Check that STELLA 2 blocks Feb 4-7 (not Feb 3)
3. Check that JAMES blocks Feb 11-13 (not Feb 10)
4. Verify Manoj Katwal dates remain correct (Feb 14 - Mar 16)

## Alternative: Ask User to Verify Tokeet Settings

Before implementing the date shift fix, it might be worth checking:
1. **Tokeet account timezone** - Is it set correctly?
2. **API timezone behavior** - Does Tokeet use UTC for API dates but local time for UI?

If the timezone is the issue, the fix would be to parse all dates as UTC explicitly.

## Questions Before Proceeding

1. Is the +1 day shift consistent across all bookings, or just some?
2. Why is Craig Stevens (Expedia) not appearing in the API at all?
3. Do you want to investigate the Tokeet timezone settings first, or proceed with the +1 day correction?
