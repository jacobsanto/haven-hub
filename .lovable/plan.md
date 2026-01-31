# Scheduled Promotional Pop-up Offers System

## Status: ✅ IMPLEMENTED

## Overview

A comprehensive promotional pop-up system that allows admins to schedule rich, storytelling-based offers that appear as pop-ups when visitors enter the website. Each offer includes visual artwork, compelling copy, scheduling, and flexible discount methods (coupon codes OR automatic price adjustments).

---

## Completed Implementation

### Database
- ✅ `promotional_campaigns` table with content, discount config, scheduling, display rules, targeting, and analytics fields
- ✅ RLS policies for admin management and public read of active campaigns
- ✅ Index for efficient active campaign queries

### New Files Created
| File | Purpose |
|------|---------|
| `src/components/promotions/PromotionalPopup.tsx` | Animated popup with image, storytelling, countdown, coupon display |
| `src/hooks/useActivePromotion.ts` | Fetches current active campaign with priority logic |
| `src/hooks/usePromotionalCampaigns.ts` | Admin CRUD hooks |
| `src/contexts/PromotionContext.tsx` | State management, dismiss handling, impression tracking |
| `src/pages/admin/AdminPromotionalCampaigns.tsx` | Admin management page with stats |
| `src/components/admin/PromotionalCampaignFormDialog.tsx` | Tabbed form for creating/editing |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/layout/PageLayout.tsx` | Added PromotionProvider and PromotionalPopup |
| `src/components/admin/AdminLayout.tsx` | Added "Campaigns" nav link |
| `src/App.tsx` | Added `/admin/campaigns` route |

---

## Features

### Discount Methods
- **Coupon-Based**: Links to existing coupons, code displayed and copied on CTA click
- **Automatic**: Stores percentage for future pricing integration

### Trigger Types
| Trigger | Behavior |
|---------|----------|
| Entry | Shows after optional delay when user lands on site |
| Exit | Shows when user attempts to leave (coordinates with exit intent) |
| Both | Shows on entry AND exit (if not dismissed) |
| Timed | Shows after specified delay in seconds |

### Admin Features
- Campaign stats (active, scheduled, total impressions)
- Status badges (Active, Scheduled, Expired, Paused)
- Quick toggle for active/inactive
- Full CRUD with tabbed form (Content, Discount, Settings)

### Visitor Experience
- Beautiful animated modal with backdrop blur
- Countdown timer showing time remaining
- Coupon code display with copy button
- Dismiss prevents re-showing for 1 day
- Mobile-responsive
