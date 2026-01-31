

# Exit Intent Modal Admin Dashboard

## Overview

Create an admin interface to configure and monitor the Exit Intent Modal, giving administrators control over its behavior and visibility into its performance.

---

## Current Situation

The Exit Intent Modal currently:
- Is hardcoded with fixed offers (10% discount, price drop alerts)
- Has no on/off toggle accessible from admin
- Cannot be customized (timing, cooldown period, offers)
- Collects data into `newsletter_subscribers` but has no dedicated analytics view

---

## Proposed Solution

Create a new admin page for Exit Intent settings with two sections:
1. **Configuration** - Enable/disable and customize the modal behavior
2. **Analytics** - View performance metrics (impressions, conversions, offer preferences)

---

## Implementation Details

### 1. Database Changes

Create a new table to store exit intent settings:

```sql
CREATE TABLE exit_intent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  delay_seconds INTEGER DEFAULT 1,
  cooldown_days INTEGER DEFAULT 7,
  discount_offer_enabled BOOLEAN DEFAULT true,
  discount_percent INTEGER DEFAULT 10,
  price_drop_offer_enabled BOOLEAN DEFAULT true,
  headline TEXT DEFAULT 'Don''t miss out on your dream getaway',
  subheadline TEXT DEFAULT 'Choose an exclusive offer just for you',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminExitIntent.tsx` | Main admin page with settings and analytics |
| `src/hooks/useExitIntentSettings.ts` | Hook to fetch/update settings |

### 3. Admin Page Features

**Settings Tab:**
- Toggle to enable/disable exit intent modal
- Delay before trigger (seconds after page load)
- Cooldown period (days before showing again)
- Individual offer toggles (discount / price drop alerts)
- Customizable discount percentage
- Editable headline and subheadline text

**Analytics Tab:**
- Total impressions (estimated from subscriber counts)
- Conversions by offer type (pie chart)
- Recent sign-ups from exit intent
- Conversion trend over time

### 4. Navigation Update

Add to AdminLayout.tsx under "Booking Engine" section:
```typescript
{ href: '/admin/exit-intent', icon: LogOut, label: 'Exit Intent' },
```

### 5. Connect Settings to Modal

Update `useExitIntent.ts` and `ExitIntentModal.tsx` to:
- Fetch settings from database
- Respect enabled/disabled state
- Use configured timing and cooldown
- Display customized offers and text

---

## Visual Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│  Exit Intent Modal Settings                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Settings]  [Analytics]                                        │
│  ───────────────────────                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Enable Exit Intent Modal              [Toggle: ON]     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Timing & Behavior                                              │
│  ─────────────────                                              │
│  Delay before trigger:  [___3___] seconds                       │
│  Cooldown period:       [___7___] days                          │
│                                                                 │
│  Offers                                                         │
│  ──────                                                         │
│  ☑ Discount offer         Discount: [__10__] %                  │
│  ☑ Price drop alerts                                            │
│                                                                 │
│  Content                                                        │
│  ───────                                                        │
│  Headline:    [Don't miss out on your dream getaway____]        │
│  Subheadline: [Choose an exclusive offer just for you__]        │
│                                                                 │
│                                        [Save Settings]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analytics View

```text
┌─────────────────────────────────────────────────────────────────┐
│  Exit Intent Analytics                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Total Leads  │  │ Discount     │  │ Price Drop   │          │
│  │    127       │  │    89 (70%)  │  │    38 (30%)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  Recent Sign-ups                                                │
│  ───────────────                                                │
│  │ Email               │ Offer Type │ Date          │          │
│  │ john@example.com    │ Discount   │ Jan 31, 2026  │          │
│  │ jane@example.com    │ Price Drop │ Jan 30, 2026  │          │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

### New Files
- `src/pages/admin/AdminExitIntent.tsx` - Settings and analytics page
- `src/hooks/useExitIntentSettings.ts` - Settings CRUD hook

### Modified Files
- `src/App.tsx` - Add route for `/admin/exit-intent`
- `src/components/admin/AdminLayout.tsx` - Add nav link
- `src/hooks/useExitIntent.ts` - Integrate settings from database
- `src/components/booking/ExitIntentModal.tsx` - Use dynamic settings

### Database
- New `exit_intent_settings` table with RLS policies

---

## Benefits

- **Control** - Enable/disable without code changes
- **Customization** - Adjust offers and messaging
- **Analytics** - See what's working
- **Flexibility** - Fine-tune timing and cooldown

