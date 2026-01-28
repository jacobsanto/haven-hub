
# Revenue Analytics Dashboard Implementation

## Overview
Create a comprehensive admin analytics page (`AdminAnalytics.tsx`) that displays revenue insights, booking trends, property performance, and occupancy metrics using Recharts charts and the existing `useAdminAnalytics.ts` hooks.

---

## Components to Create

### Main Page: `src/pages/admin/AdminAnalytics.tsx`

**Layout Structure:**
- Header with title and date range selector
- Revenue overview stats cards row
- Two-column grid for charts
- Performance tables section

---

## Section 1: Revenue Overview Stats

**Stats Cards (4 cards in a row):**
1. **Total Revenue** - Sum of confirmed booking revenue for selected period
2. **Confirmed Bookings** - Count of confirmed bookings
3. **Average Booking Value** - Revenue / bookings count
4. **Average Stay Length** - Average nights per booking

Uses: `useRevenueStats()` hook

---

## Section 2: Monthly Revenue Trends Chart

**Line Chart using Recharts:**
- X-axis: Month labels (e.g., "Jan 2026", "Feb 2026")
- Y-axis (left): Revenue in currency format
- Y-axis (right): Booking count
- Two lines: Revenue trend, Bookings count trend
- Interactive tooltip showing exact values

Uses: `useMonthlyTrends(12)` hook

**Technical Implementation:**
```typescript
<ChartContainer config={chartConfig}>
  <LineChart data={monthlyTrends}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line yAxisId="left" dataKey="revenue" stroke="var(--color-revenue)" />
    <Line yAxisId="right" dataKey="bookings" stroke="var(--color-bookings)" />
  </LineChart>
</ChartContainer>
```

---

## Section 3: Revenue by Property Chart

**Bar Chart:**
- Horizontal bars showing revenue per property
- Sorted by revenue (highest first)
- Property name as label
- Revenue value displayed

Uses: `useRevenueByProperty()` hook

---

## Section 4: Occupancy Rates Chart

**Bar Chart:**
- Horizontal bars showing occupancy percentage per property
- Color coding: Green (>70%), Yellow (40-70%), Red (<40%)
- Shows booked nights / total nights

Uses: `useOccupancyMetrics()` hook

---

## Section 5: Top Performing Add-ons Table

**Data Table:**
| Add-on Name | Units Sold | Revenue |
|-------------|------------|---------|
| Airport Transfer | 15 | €750 |
| Chef Service | 8 | €1,200 |

Uses: `useAddonPerformance()` hook

---

## Section 6: Today's Activity Card

**Quick Stats Widget:**
- Check-ins today
- Check-outs today  
- New bookings today

Uses: `useTodayActivity()` hook

---

## Section 7: Date Range Selector

**UI Component:**
- Quick presets: "This Month", "Last 30 Days", "Last 3 Months", "Year to Date"
- Custom date range picker using Calendar component
- Updates all charts when changed

---

## File Changes

### Create:
- `src/pages/admin/AdminAnalytics.tsx` - Main analytics page

### Modify:
- `src/App.tsx` - Add route for `/admin/analytics`

---

## Technical Details

### Chart Configuration
```typescript
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(142 76% 36%)",
  },
  occupancy: {
    label: "Occupancy",
    color: "hsl(217 91% 60%)",
  },
} satisfies ChartConfig;
```

### Currency Formatting
```typescript
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(value);
```

### Responsive Grid
- Desktop: 2-column layout for charts
- Mobile: Single column, stacked charts
- Stats cards: 4 columns desktop, 2 columns tablet, 1 column mobile

---

## Dependencies Used
- `recharts` - Already installed for charts
- `@/components/ui/chart` - Existing ChartContainer and tooltip components
- `date-fns` - For date formatting and manipulation
- `framer-motion` - For animations (consistent with other admin pages)
- All analytics hooks from `useAdminAnalytics.ts`

---

## Expected UI Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  Revenue Analytics                    [Date Range Picker]   │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ │ Total     │ │ Confirmed │ │ Avg Value │ │ Avg Stay  │    │
│ │ Revenue   │ │ Bookings  │ │           │ │ Length    │    │
│ │ €45,230   │ │ 23        │ │ €1,966    │ │ 4.2 nights│    │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Monthly Revenue Trends                      │ │
│ │  📈 Line chart with revenue and bookings over 12 months │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────┬───────────────────────────┤
│ ┌───────────────────────────┐   │ ┌───────────────────────┐ │
│ │  Revenue by Property      │   │ │  Occupancy Rates      │ │
│ │  📊 Horizontal bar chart  │   │ │  📊 Horizontal bars   │ │
│ └───────────────────────────┘   │ └───────────────────────┘ │
├─────────────────────────────────┴───────────────────────────┤
│ ┌─────────────────────────┐  ┌────────────────────────────┐ │
│ │  Today's Activity       │  │  Top Add-ons               │ │
│ │  • 3 Check-ins          │  │  Airport Transfer: €750    │ │
│ │  • 2 Check-outs         │  │  Chef Service: €1,200      │ │
│ │  • 1 New booking        │  │  Wine Tour: €480           │ │
│ └─────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

1. Create `AdminAnalytics.tsx` with proper imports and structure
2. Add date range state with preset options
3. Implement revenue stats cards using `useRevenueStats()`
4. Create monthly trends line chart using Recharts
5. Add revenue by property horizontal bar chart
6. Add occupancy rates bar chart with color coding
7. Create add-on performance table
8. Add today's activity widget
9. Add route in `App.tsx`
10. Ensure loading and empty states for all sections
