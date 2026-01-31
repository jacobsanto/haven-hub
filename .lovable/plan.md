

# Scheduled Promotional Pop-up Offers System

## Overview

Create a comprehensive promotional pop-up system that allows admins to schedule rich, storytelling-based offers that appear as pop-ups when visitors enter the website. Each offer includes visual artwork, compelling copy, scheduling, and flexible discount methods (coupon codes OR automatic price adjustments).

---

## Feature Components

### 1. Promotional Campaigns (New Entity)

A new system separate from existing property-specific special offers, designed for site-wide promotional pop-ups:

| Field | Description |
|-------|-------------|
| **Title** | Campaign headline (e.g., "Summer Escape Sale") |
| **Storytelling** | Rich text with the "why" behind the offer |
| **Image/Art** | Visual banner for the pop-up |
| **Discount Method** | Coupon code OR automatic percentage off |
| **Schedule** | Start date/time and end date/time |
| **Display Rules** | When to show (entry, exit intent, both) |
| **Priority** | If multiple campaigns overlap, which takes precedence |

### 2. Two Discount Approaches

**Option A: Coupon-Based**
- Links to an existing coupon from `coupons_promos`
- User must enter code at checkout
- Allows tracking of redemptions
- Best for: Limited usage, targeted campaigns

**Option B: Automatic Discount**
- Applies a site-wide percentage discount automatically
- No code needed - prices shown are already reduced
- Creates urgency with visible "was/now" pricing
- Best for: Flash sales, seasonal promotions

### 3. Pop-up Trigger Options

| Trigger | Description |
|---------|-------------|
| **On Entry** | Shows immediately when user lands on site |
| **Exit Intent** | Shows when user moves to leave (existing behavior) |
| **Timed Delay** | Shows after X seconds on site |
| **Scroll Depth** | Shows after scrolling X% of page |

---

## Database Schema

### New Table: `promotional_campaigns`

```sql
CREATE TABLE promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,  -- The storytelling/reason
  image_url TEXT,    -- Visual banner art
  
  -- Call to action
  cta_text TEXT DEFAULT 'Claim Offer',
  cta_link TEXT,  -- Optional custom link
  
  -- Discount configuration
  discount_method TEXT NOT NULL DEFAULT 'coupon',  -- 'coupon' or 'automatic'
  coupon_id UUID REFERENCES coupons_promos(id),    -- If coupon method
  auto_discount_percent INTEGER,                    -- If automatic method
  
  -- Scheduling
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Display rules
  trigger_type TEXT NOT NULL DEFAULT 'entry',  -- 'entry', 'exit', 'both', 'timed'
  trigger_delay_seconds INTEGER DEFAULT 0,
  show_on_mobile BOOLEAN DEFAULT true,
  
  -- Targeting
  applicable_pages TEXT[] DEFAULT '{}',  -- Empty = all pages
  applicable_properties UUID[],           -- Empty = all properties
  
  -- Control
  priority INTEGER DEFAULT 0,  -- Higher = takes precedence
  max_impressions INTEGER,      -- Optional limit
  impressions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Index for Active Campaign Queries

```sql
CREATE INDEX idx_promo_campaigns_active ON promotional_campaigns 
  (is_active, starts_at, ends_at, priority DESC);
```

---

## Frontend Implementation

### 1. New Promotional Pop-up Component

**File: `src/components/promotions/PromotionalPopup.tsx`**

A beautiful, customizable modal that displays the active campaign:

```text
┌─────────────────────────────────────────────────────────┐
│  [X]                                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │         [Campaign Image/Art Here]               │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│          SUMMER ESCAPE SALE                             │
│          ─────────────────                              │
│                                                         │
│    "Because summer memories shouldn't wait.             │
│    Book now and save 20% on your dream villa."          │
│                                                         │
│    🎫 Use code: SUMMER20                                │
│                                                         │
│         [  Claim Your Discount  ]                       │
│                                                         │
│    Valid until August 31, 2026                          │
└─────────────────────────────────────────────────────────┘
```

Features:
- Animated entrance (fade + scale)
- Dismissible with "X" or clicking outside
- Cookie/localStorage to prevent repeated shows
- Mobile-responsive layout
- Optional countdown timer for urgency

### 2. Hook for Active Campaign

**File: `src/hooks/useActivePromotion.ts`**

```typescript
// Fetches the current active campaign based on:
// - Current date within starts_at/ends_at
// - is_active = true
// - Highest priority if multiple match
// - Respects max_impressions limit
```

### 3. Promotion Provider

**File: `src/contexts/PromotionContext.tsx`**

Manages:
- Loading the active campaign
- Tracking impressions
- Respecting "already seen" cookies
- Coordinating with exit intent modal

### 4. Integration with PageLayout

Update `PageLayout.tsx` to include the new promotional pop-up:

```tsx
// Conditional rendering based on trigger type
{activePromotion && triggerConditionMet && (
  <PromotionalPopup campaign={activePromotion} onClose={handleDismiss} />
)}
```

---

## Admin Interface

### 1. Campaign Management Page

**File: `src/pages/admin/AdminPromotionalCampaigns.tsx`**

A dedicated page for managing promotional campaigns:

- List view with campaign cards
- Status indicators (Scheduled, Active, Expired)
- Quick toggle for is_active
- Preview modal to see how pop-up will look
- Analytics: impressions, clicks, conversions

### 2. Campaign Form Dialog

**File: `src/components/admin/PromotionalCampaignFormDialog.tsx`**

Rich form with:
- Image uploader for banner art
- Rich text editor for storytelling
- Discount method toggle (Coupon vs Automatic)
- Coupon selector (dropdown of active coupons)
- Date/time pickers for schedule
- Trigger configuration
- Property targeting

### 3. Calendar Integration

Add promotional campaigns to the existing Content Calendar:
- Different color coding for promotions
- Visual timeline of overlapping campaigns

---

## User Experience Flow

### Visitor Journey

1. **Visitor arrives** on website
2. **System checks** for active campaigns matching current conditions
3. **Pop-up displays** with rich promotional content
4. **Visitor can:**
   - Click CTA → Goes to properties page (with coupon auto-applied if applicable)
   - Dismiss → Cookie set to prevent re-showing for X days
5. **At checkout:**
   - If coupon method: Code pre-filled or user enters manually
   - If automatic method: Prices already reflect discount

### Admin Workflow

1. **Create campaign** with compelling storytelling and visuals
2. **Choose discount method:**
   - Coupon: Select existing or create new coupon
   - Automatic: Set percentage (applies to all eligible bookings)
3. **Set schedule** for when campaign runs
4. **Configure triggers** (entry, exit, timing)
5. **Activate** and monitor performance

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/promotions/PromotionalPopup.tsx` | The pop-up modal component |
| `src/hooks/useActivePromotion.ts` | Fetches current active campaign |
| `src/hooks/usePromotionalCampaigns.ts` | Admin CRUD hooks |
| `src/contexts/PromotionContext.tsx` | State management for promotions |
| `src/pages/admin/AdminPromotionalCampaigns.tsx` | Admin management page |
| `src/components/admin/PromotionalCampaignFormDialog.tsx` | Create/edit dialog |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/layout/PageLayout.tsx` | Add PromotionalPopup integration |
| `src/components/admin/AdminLayout.tsx` | Add nav link for campaigns |
| `src/App.tsx` | Add route for campaigns page |
| `src/hooks/useExitIntent.ts` | Coordinate with promotional system |

### Database Migration

- Create `promotional_campaigns` table
- Add RLS policies for admin management and public read

---

## Discount Integration

### For Coupon Method

When user clicks CTA:
1. Coupon code is copied to clipboard (with toast notification)
2. User is redirected to properties page
3. Coupon code can also be auto-filled at checkout via URL parameter

### For Automatic Discount

When campaign is active:
1. All prices displayed include the discount
2. Original prices shown as strikethrough
3. "Limited Time: X% Off" badge appears on property cards
4. Price breakdown at checkout shows the automatic discount

---

## Benefits

- **Storytelling power** - Rich content explains the "why" behind offers
- **Visual impact** - Custom artwork makes campaigns memorable
- **Flexibility** - Coupon codes for tracking OR automatic discounts for urgency
- **Scheduling** - Plan campaigns weeks in advance
- **Targeting** - Limit to specific properties or pages
- **Analytics** - Track impressions, clicks, and conversions
- **No code overlap** - Separate from existing special offers system, which remains property-specific

