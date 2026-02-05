
# Split Analytics Page: Revenue Analytics + Website Analytics

## Overview

Restructure the Admin Analytics page into two distinct tabs:
1. **Revenue Analytics** (existing) - Business metrics, bookings, and property performance
2. **Website Analytics** (new) - Google Analytics-style SEO and marketing metrics

This separation follows the philosophy of:
- **Revenue Analytics**: Business operations and financial health
- **Website Analytics**: Frontend performance, traffic, and user behavior for SEO/marketing

## Design Layout

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Analytics                                                                       │
│  Track your business and website performance                                     │
│                                                                                  │
│  ┌────────────────────────┐ ┌────────────────────────┐     [Date Range Picker]  │
│  │   Revenue Analytics    │ │   Website Analytics    │                          │
│  └────────────────────────┘ └────────────────────────┘                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [Tab Content Area - Revenue OR Website Analytics]                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Website Analytics Tab Content

### Stats Cards Row
| Metric | Icon | Description |
|--------|------|-------------|
| Total Visitors | Users | Unique visitors in period |
| Page Views | Eye | Total page loads |
| Bounce Rate | LogOut | Single-page sessions % |
| Avg Session Duration | Clock | Time spent on site |
| Pages per Visit | FileText | Engagement depth |

### Visualizations

1. **Visitors Trend Chart** (line chart)
   - Daily visitors over selected period
   - Daily page views overlay

2. **Traffic Sources** (pie/donut chart)
   - Direct, Organic, Referral, Social, etc.

3. **Top Pages** (table)
   - Page URL, Views, % of total

4. **Devices Breakdown** (bar chart or pie)
   - Desktop vs Mobile vs Tablet

5. **Geographic Distribution** (table/bar)
   - Countries by visitor count

## Technical Implementation

### New Files to Create

1. **`src/hooks/useWebsiteAnalytics.ts`**
   - Hook to fetch website analytics data from the Lovable Cloud analytics API
   - Will use the `analytics--read_project_analytics` tool's API endpoint
   - Handles date range parameters and data transformation

### Files to Modify

1. **`src/pages/admin/AdminAnalytics.tsx`**
   - Import Tabs components from `@/components/ui/tabs`
   - Wrap existing content in a "Revenue Analytics" tab
   - Create new "Website Analytics" tab with traffic metrics
   - Update header to be generic ("Analytics" instead of "Revenue Analytics")
   - Share date range selector between tabs

### Data Source

Website analytics will be fetched from Lovable Cloud's built-in analytics which provides:
- `visitors` - Unique visitors with daily breakdown
- `pageviews` - Total page views with daily breakdown
- `pageviewsPerVisit` - Engagement metric
- `sessionDuration` - Time on site
- `bounceRate` - Single-page session percentage
- `page` - Top pages breakdown
- `source` - Traffic sources (Direct, Organic, etc.)
- `device` - Device type breakdown (desktop, mobile, tablet)
- `country` - Geographic distribution

### Implementation Approach

Since Lovable Cloud analytics requires server-side access, we will:
1. Create an edge function `website-analytics` to fetch and return the data
2. The edge function will use the project analytics API
3. Frontend hook will call this edge function

## Component Structure

```text
AdminAnalytics.tsx
├── Header (shared)
├── Date Range Selector (shared)
└── Tabs
    ├── Tab: Revenue Analytics
    │   ├── Stats Cards (Total Revenue, Bookings, etc.)
    │   ├── Monthly Revenue Trends Chart
    │   ├── Revenue by Property
    │   ├── Occupancy Rates
    │   ├── Today's Activity
    │   └── Top Performing Add-ons
    │
    └── Tab: Website Analytics
        ├── Stats Cards (Visitors, Page Views, Bounce Rate, Session Duration)
        ├── Visitors Trend Chart
        ├── Traffic Sources Chart
        ├── Top Pages Table
        ├── Device Breakdown
        └── Geographic Distribution
```

## User Experience

- Tabs persist the selected view
- Date range selector applies to both tabs
- Loading skeletons for all data sections
- Empty states when no data is available
- Responsive grid layout for all cards and charts
- Consistent styling with existing Revenue Analytics

## Notes

- Website analytics data comes from Lovable Cloud's built-in tracking
- No need for external Google Analytics integration
- Data is privacy-friendly and first-party
- Date range limited to last 365 days by the API
