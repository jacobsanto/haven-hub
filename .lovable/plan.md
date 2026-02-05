

# Custom Analytics Tracking System

## Overview

Build a first-party analytics tracking system that stores all page views in your database, giving you full control and ownership of your website traffic data. This replaces the mock data currently shown in Website Analytics with real visitor tracking.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  User Visits Page                                                                │
│       ↓                                                                         │
│  PageLayout renders → usePageTracking hook fires                                │
│       ↓                                                                         │
│  Collects: path, title, referrer, device, country (from headers)                │
│       ↓                                                                         │
│  Generates session_id (stored in sessionStorage)                                │
│       ↓                                                                         │
│  INSERT into page_views table (anonymous, no PII)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Database Design

### New Table: `page_views`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | text | Anonymous session identifier |
| path | text | Page path (e.g., `/properties`) |
| page_title | text | Page title (e.g., "Properties") |
| referrer | text | Referring URL (if available) |
| device_type | text | desktop/mobile/tablet |
| browser | text | Browser name (Chrome, Safari, etc.) |
| country_code | text | 2-letter country code (from IP lookup) |
| utm_source | text | UTM source parameter |
| utm_medium | text | UTM medium parameter |
| utm_campaign | text | UTM campaign parameter |
| created_at | timestamp | When the view occurred |

### RLS Policy
- **Public INSERT**: Allow anonymous inserts (no auth required)
- **Admin SELECT**: Only admins can read the data

## Session Tracking Approach

Sessions are identified using:
1. A random UUID generated on first page load
2. Stored in `sessionStorage` (clears when tab closes)
3. No cookies, no PII, fully GDPR-compliant

Bounce rate calculated by:
- Sessions with only 1 page view = bounce
- Sessions with 2+ page views = engaged

## Files to Create

### 1. `src/hooks/usePageTracking.ts`
- Custom hook that fires on every route change
- Collects page metadata (path, title, referrer)
- Detects device type from user agent
- Extracts UTM parameters from URL
- Generates/retrieves session_id
- Inserts data into `page_views` table

### 2. Update `src/components/layout/PageLayout.tsx`
- Import and invoke `usePageTracking()` hook
- No UI changes, just tracking integration

### 3. Update `supabase/functions/website-analytics/index.ts`
- Replace mock data generation with real database queries
- Aggregate page_views by date, path, device, etc.
- Calculate bounce rate from session analysis
- Calculate average session duration from session timestamps

## Updated Edge Function Logic

The `website-analytics` function will query the real data:

```text
Summary Queries:
├── Total unique sessions → Visitors count
├── Total page_views count → Page Views
├── Sessions with 1 view / Total sessions → Bounce Rate
├── First-to-last view per session → Avg Session Duration
└── Total views / Total sessions → Pages per Visit

Breakdown Queries:
├── GROUP BY date → Daily traffic
├── GROUP BY path → Top pages
├── GROUP BY device_type → Device breakdown
├── GROUP BY country_code → Geographic distribution
└── GROUP BY utm_source → Traffic sources (or 'Direct' if null)
```

## Privacy Considerations

- No cookies used
- No PII stored (no names, emails, or IPs)
- Session IDs are anonymous UUIDs
- Country derived from IP at insert time (IP not stored)
- Fully compliant with GDPR/CCPA

## Implementation Order

1. Create `page_views` table with RLS policies
2. Create `usePageTracking` hook
3. Integrate hook into `PageLayout`
4. Update `website-analytics` edge function to query real data
5. Test end-to-end

## Technical Details

### Device Detection
```javascript
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'Mobile';
  return 'Desktop';
};
```

### Session ID Management
```javascript
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};
```

### Page Title Mapping
The hook will use a lookup table to map paths to friendly titles:
- `/` → "Home"
- `/properties` → "Properties"
- `/properties/:slug` → "Property Detail"
- etc.

### Debouncing
To prevent duplicate tracking on rapid navigations, the hook will debounce inserts by 100ms.

