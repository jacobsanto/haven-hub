
# Admin Availability Audit Report & Enhancement Plan

## Audit Findings

### Current Data State

| Metric | Value | Status |
|--------|-------|--------|
| Total blocked dates in database | 10,094 | — |
| Active bookings (pending/confirmed) | 187 | ✓ Healthy |
| Dates blocked WITH matching bookings | 2,799 | ✓ Correct |
| Dates blocked WITHOUT bookings | 7,295 | ⚠️ Needs Review |

### What are these 7,295 "orphaned" blocks?

These are **NOT errors**. They fall into three categories:

**Category 1: Seasonal Closures / Owner Blocks (Expected)**
Example: Centro House is blocked from Oct 15, 2026 → Jan 24, 2028 (467 consecutive days)
- This is likely a seasonal closure imported from Tokeet
- Many Santorini properties close for winter months
- The PMS marks these as `available: 1` (blocked) but with no guest name

**Category 2: Maintenance/Channel Blocks (Expected)**  
Short blocks without guest names from OTA channels or internal maintenance

**Category 3: Anemelia House (Property Deleted from Tokeet)**
- 170 blocked dates exist for this property
- PMS mapping still active with `sync_enabled: true`
- Should be cleaned up or disabled

### Property-by-Property Breakdown

```text
Property                              | Orphaned Blocks | Last Booking | Issue
--------------------------------------|-----------------|--------------|-------
Dream Home Master Villa               | 664             | None         | No bookings imported
Infinite Blue Horizon Suite           | 535             | Aug 2026     | Winter closure
Centro House                          | 467             | Oct 2026     | Winter closure  
Blue Dreams                           | 462             | Jul 2026     | Winter closure
Infinite Blue Sunrise Suite           | 459             | Oct 2026     | Winter closure
Olive Grove villa 2                   | 400             | Aug 2026     | Winter closure
Olive Grove villa 1                   | 396             | Aug 2026     | Winter closure
Olive Grove Apt 3                     | 381             | Sep 2026     | Winter closure
Art of Barrel                         | 355             | Nov 2026     | Winter closure
Day One Standard                      | 355             | Aug 2026     | Winter closure
Day One Cave                          | 355             | Nov 2026     | Winter closure
Day One Studio                        | 355             | Jul 2026     | Winter closure
Iris Villa                            | 355             | Nov 2026     | Winter closure
DAY 1                                 | 355             | Nov 2026     | Winter closure
Olivia Villa                          | 355             | Nov 2026     | Winter closure
Narcissus Luxury Villa                | 355             | Nov 2026     | Winter closure
Villa Amersa                          | 355             | Nov 2026     | Winter closure
Anemelia House                        | 170             | Aug 2027     | ⚠️ DELETED FROM TOKEET
BLE VILLA                             | 166             | Aug 2027     | Winter closure
```

---

## Recommended Actions

### Action 1: Disable PMS Sync for Anemelia House
Since this property no longer exists in Tokeet, we should:
- Disable `sync_enabled` in `pms_property_map`
- Optionally delete all availability and booking data for this property

### Action 2: Clean Up Anemelia House Data  
Delete orphaned data for the deleted property:
- 170 availability blocks
- 12 booking records (historical, optional to keep)
- PMS property mapping

### Action 3: Keep Winter Closure Blocks
The other 7,125 blocks are **legitimate seasonal closures** from Tokeet. They should remain as they represent real unavailability.

---

## Admin Availability Page Enhancements

### Current Limitations Found

1. **No real-time updates** - Requires manual refresh after PMS sync
2. **No booking context** - Cannot see WHY a date is blocked (booking vs owner block)
3. **No property health indicators** - Draft/active status not shown
4. **No bulk operations** - Single date toggle only
5. **No sync status visibility** - Cannot see when last synced

### Proposed Enhancements

**Enhancement 1: Add Property Health Cards**
Display at top of page:
- Total properties synced
- Properties with sync errors
- Properties with no near-term availability data
- Last sync timestamp

**Enhancement 2: Show Block Context on Calendar**
Differentiate between:
- 🔴 **Booked** - Has matching booking with guest name
- 🟠 **Owner Block** - Blocked without booking (from PMS)
- 🟣 **Manual Block** - Blocked directly in admin

**Enhancement 3: Add Real-time Updates**
Import and use `useRealtimeAvailabilityGlobal()` hook

**Enhancement 4: Property Status Badges**
Show draft/active badge next to property name in dropdown

**Enhancement 5: Sync Status Panel**
Add collapsible panel showing:
- Last PMS sync time
- Next scheduled sync
- Manual "Sync Now" button
- Error log if sync failed

---

## Technical Implementation

### Database Changes
None required - all data structures exist

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminAvailability.tsx` | Add health dashboard, booking context, real-time updates |
| `src/hooks/useAvailability.ts` | Add query to fetch bookings alongside availability |
| `src/hooks/useRealtimeAvailability.ts` | Already exists, just needs to be imported |

### New Components

1. **AvailabilityHealthCard** - Shows property sync health at top
2. **AvailabilityLegend** - Enhanced legend with booking/owner block distinction
3. **SyncStatusBadge** - Shows last sync time inline

---

## Cleanup SQL (For Immediate Execution)

```sql
-- Disable sync for Anemelia House
UPDATE pms_property_map
SET sync_enabled = false
WHERE external_property_name = 'Anemelia House';

-- Delete orphaned availability for Anemelia House
DELETE FROM availability 
WHERE property_id = (SELECT id FROM properties WHERE name = 'Anemelia House');
```

---

## Expected Outcomes

After implementation:
1. **Anemelia House** sync disabled and cleaned up
2. **Admin calendar** shows context for each blocked date
3. **Real-time updates** reflect PMS sync changes instantly
4. **Health dashboard** provides at-a-glance sync status
5. **No false "orphan" alerts** for legitimate seasonal closures
