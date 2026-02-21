
# Booking Component Visual Refactor (UI Only)

## Overview

Restyle the BookingWidget, PriceBreakdown, and QuickBookCard components to a clean, solid-white aesthetic with strict spacing, clear price hierarchy, and minimal motion. Zero changes to business logic, hooks, API calls, or data flow.

## What Changes

### 1. BookingWidget.tsx -- Main booking card

**Card container** (line 243):
- Remove: `border-border/50 shadow-sm` (current classes)
- Apply: `bg-white dark:bg-card rounded-2xl border border-[rgba(30,60,120,0.08)] p-5 space-y-4`
- Inline style: `box-shadow: var(--shadow-soft)` (no glow, no glass blur)
- No `backdrop-blur`, no `card-organic` class

**Internal spacing** -- tighten from 6-unit to 8px-scale:
- Outer padding: `p-5` (20px = 2.5 x 8)
- Section gaps: `space-y-4` (16px)
- Date picker gap: `space-y-3` (12px)
- Guest row: `px-3 py-2`

**All internal borders**: `border-[rgba(30,60,120,0.08)]` -- the subtle navy-tinted border

**Price hierarchy** (both instant and request flows):
- Subtotal line: `text-xs text-muted-foreground` (smaller, muted)
- Discount line: `text-xs text-emerald-600` (smaller, green)
- Total label: `text-sm font-semibold text-foreground`
- Total value: `text-xl font-bold text-foreground` (large, bold, navy via `--foreground`)

**Animated total** -- new local `AnimatedTotal` component:
- Uses `useRef` to track previous value
- On value change: fade opacity 0 -> 1
- Duration: `0.25s ease` via inline `transitionDuration`
- Fade only, no translate, no scale
- No card-level animation at all

**Primary CTA buttons** (Book & Pay Now, Continue, Request Booking):
- Replace `btn-organic` class with explicit:
  - `bg-gradient-to-r from-primary to-primary/90 text-primary-foreground`
  - `rounded-full shadow-soft`
  - `hover:-translate-y-[2px] hover:shadow-medium`
  - Transition using existing `--duration-hover` and `--ease-lift` tokens
  - No glow, no shine sweep, no additional decorative effects

**Popover backgrounds**: `bg-white dark:bg-card` (solid, not `bg-card` which can be translucent)

### 2. PriceBreakdown.tsx -- Checkout price details

**Full variant** (line 64):
- Container: `bg-white dark:bg-card rounded-2xl border border-[rgba(30,60,120,0.08)] p-6`
- Apply `box-shadow: var(--shadow-soft)` via style prop
- Remove any inherited glassmorphism from `bg-card` being translucent

**Price hierarchy in full variant**:
- All line items (accommodation, add-ons, fees, taxes): keep `text-sm text-muted-foreground`
- Total label: `font-serif text-lg font-medium` (unchanged)
- Total value: `font-serif text-2xl font-bold text-foreground` (bumped from `font-semibold` to `font-bold`)

**Compact variant**: same hierarchy treatment -- line items `text-sm`, total `font-bold`

**Deposit info box**: border changed to `border-[rgba(30,60,120,0.08)]`

### 3. QuickBookCard.tsx -- Property listing card

**Card container** (line 43):
- Replace `card-organic` with: `bg-white dark:bg-card rounded-2xl border border-[rgba(30,60,120,0.08)] overflow-hidden`
- Style: `box-shadow: var(--shadow-soft)`
- No `backdrop-blur`, no glassmorphism

**Hover state**:
- Remove: `hover:shadow-xl hover:-translate-y-1`
- Apply: `hover:-translate-y-[2px]` with `hover:shadow-medium`
- Transition: `transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]`
- No glow effects

**Content spacing**:
- Content area: keep `p-4` (16px, on 8px grid)
- Stats margin: keep `mb-4` (16px)
- CTA border: change to `border-[rgba(30,60,120,0.08)]`

**Hover overlay button**: keep existing gradient button, no changes (this is functional)

## What Does NOT Change

- All hooks: `useCreateBooking`, `useRealtimeAvailability`, `useCurrency`, `useToast`
- All state management and calculations (nights, baseTotal, discountAmount, totalPrice)
- All navigation and routing logic
- All Supabase/PMS calls and data flow
- AvailabilityCalendar integration and date selection logic
- Guest form validation and multi-step flow
- UnifiedBookingDialog (not in scope -- only BookingWidget, PriceBreakdown, QuickBookCard)
- Currency context and formatting
- No new CSS tokens or color variables added

## Files Modified

| File | Change |
|------|--------|
| `src/components/booking/BookingWidget.tsx` | Solid white card, subtle border, tightened 8px spacing, price hierarchy, AnimatedTotal component, blue gradient CTA with 2px hover lift |
| `src/components/booking/PriceBreakdown.tsx` | Solid white container, subtle border, shadow-soft, bold total value |
| `src/components/booking/QuickBookCard.tsx` | Replace card-organic with solid white card, subtle border, 2px hover lift, no glow |
