

# Replace PMS Sync Card with Alternative Dashboard Widget

## Current Situation

The PMS Sync Status Card (lines 264-319 in `AdminDashboard.tsx`) displays:
- Connection health status
- Last sync run details
- Processed/failed records count
- Manual sync trigger button

Since PMS sync functionality is no longer in use, this card should be replaced with something more useful.

## Replacement Options

Here are the best alternatives based on the available data sources in your system:

| Option | Description | Data Source | Value |
|--------|-------------|-------------|-------|
| **A. Payment Health** | Shows Stripe connectivity status, last successful payment, any issues | `useStripeHealth` | Critical for operations |
| **B. Occupancy Overview** | Shows occupancy rates across all properties for current month | `useOccupancyMetrics` | Key performance indicator |
| **C. Enquiries Summary** | Shows pending experience enquiries needing response | `useExperienceEnquiries` | Action-oriented |
| **D. Newsletter Growth** | Shows subscriber count and recent signups | `useNewsletterSubscribers` | Marketing insight |
| **E. Quick Actions** | Links to common admin tasks (add property, view bookings, etc.) | N/A (static) | Productivity boost |
| **F. Remove entirely** | Simply remove the card, dashboard has enough content | N/A | Cleaner UI |

---

## Recommended: Option A - Payment Health Card

Since this is an **operational booking platform**, payment health is the most critical replacement. It tells admins at a glance whether guests can successfully complete bookings.

```text
┌─────────────────────────────────────────────────────────────────┐
│  ✓  Payment System                          [Check Now]        │
│                                                                 │
│  Status: Healthy                                                │
│  Stripe connected and processing payments normally             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Stripe.js    │  │ Edge Function │  │ Last Check   │          │
│  │ ✓ Loaded     │  │ ✓ Reachable   │  │ 2 min ago    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alternative: Option B - Occupancy Overview Card

If payment health feels redundant (Stripe issues are rare), an occupancy summary provides valuable operational insight:

```text
┌─────────────────────────────────────────────────────────────────┐
│  📊  This Month's Occupancy                                     │
│                                                                 │
│  Average: 72%                                                   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Villa Amalfi     │  │ Tuscan Estate    │                    │
│  │ ████████░░ 85%   │  │ ██████░░░░ 64%   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Santorini Retreat│  │ Provence Manor   │                    │
│  │ ███████░░░ 78%   │  │ █████░░░░░ 58%   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### For Option A (Payment Health):

**Files to Modify:**
| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Replace PMS Sync card with Payment Health card |

**Changes:**
1. Remove `usePMSSyncStatus` and `useTriggerPMSSync` imports
2. Remove `pmsSyncStatus`, `pmsLastRun`, and `handleTriggerSync` references
3. Add `useStripeHealth` import
4. Replace the PMS Sync Card JSX (lines 264-319) with a Payment Health Card that shows:
   - Overall health status (healthy/degraded/unhealthy)
   - Stripe.js load status
   - Edge function reachability
   - Last checked timestamp
   - "Check Now" button to refresh

### For Option B (Occupancy Overview):

**Files to Modify:**
| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Replace PMS Sync card with Occupancy card |

**Changes:**
1. Remove PMS-related imports and state
2. Add `useOccupancyMetrics` import from `useAdminAnalytics`
3. Replace the PMS Sync Card JSX with an Occupancy Overview showing:
   - Average occupancy percentage
   - Mini progress bars for each property
   - Color coding (green >70%, amber 40-70%, red <40%)

### For Option F (Remove Entirely):

Simply delete lines 264-319 and remove unused imports. The dashboard already has:
- Real-time activity strip (4 cards)
- Stats grid (4 cards)
- Revenue trend card
- Recent bookings list

---

## My Recommendation

**Go with Option A (Payment Health)** because:
1. It's operationally critical - you need to know if payments work
2. It replaces a "system health" card with another "system health" card (consistent purpose)
3. The hook already exists (`useStripeHealth`) - minimal new code needed
4. Fits the visual design of the current PMS Sync card
Also below that, add Newsletter Growth** | Shows subscriber count and recent signups | `useNewsletterSubscribers` | Marketing insight |
Also below Newsletter Growth, **(Occupancy)** would be the best alternative.
