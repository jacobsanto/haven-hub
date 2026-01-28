
# Comprehensive Admin Booking & PMS Synchronization System

## Overview
This plan implements a fully synchronized booking management system where all frontend booking actions are connected to admin-managed data, along with a bidirectional (two-way) PMS integration that syncs data both from and to the external property management system.

---

## Phase 1: Admin Navigation Restructure

### Update `AdminLayout.tsx`
Reorganize the navigation with grouped sections:

```text
Dashboard
─────────────────
BOOKING ENGINE
├── Bookings
├── Availability
├── Add-ons
├── Promotions
├── Fees & Taxes
├── Rate Plans
─────────────────
PROPERTIES
├── Properties
├── Destinations
├── Amenities
─────────────────
EXPERIENCES
├── Experiences
├── Enquiries
─────────────────
CONTENT
├── Blog Posts
├── Authors
├── Categories
├── Newsletter
─────────────────
SYSTEM
├── PMS Health
├── Analytics
├── Settings
```

---

## Phase 2: Enhanced Admin Dashboard

### Update `AdminDashboard.tsx`
Add new stats and widgets for real-time booking visibility:

**New Stats Cards:**
- Active checkout holds count
- Today's check-ins/check-outs
- Conversion rate (holds to bookings)
- Month-over-month revenue comparison
- Active promotions count

**New Widgets:**
- PMS sync status indicator (green/yellow/red)
- 30-day revenue trend chart using Recharts
- Quick action buttons for common tasks
- Real-time booking activity feed

---

## Phase 3: New Admin Management Pages

### 3.1 Add-ons Management (`AdminAddonsManagement.tsx`)
- CRUD interface for `addons_catalog` table
- Category filtering (Transfer, Food, Experience, Service, Package)
- Drag-and-drop reordering
- Property-specific or global toggle
- Active/inactive status toggle

### 3.2 Promotions & Coupons (`AdminPromotions.tsx`)
- Two tabs: Coupons (`coupons_promos`) and Special Offers (`special_offers`)
- Usage tracking (uses vs max_uses)
- Property applicability selection
- Validity date management
- Quick enable/disable toggle

### 3.3 Fees & Taxes (`AdminFees.tsx`)
- CRUD for `fees_taxes` table
- Fee type selection (fixed, percentage, per_night, per_guest, per_guest_per_night)
- Tax vs Fee toggle
- Mandatory toggle
- Preview calculation on sample booking

### 3.4 Rate Plans (`AdminRatePlans.tsx`)
- CRUD for `rate_plans` table
- Rate types (standard, member, promotional, long_stay)
- Property-specific configuration
- Valid date range calendar view
- Member tier requirements

### 3.5 PMS Health Dashboard (`AdminPMSHealth.tsx`)
- Connection status with test button
- Manual sync trigger
- Property mappings table with sync toggles
- Sync history log with error details
- Raw webhook events viewer
- Two-way sync status indicators

### 3.6 Revenue Analytics (`AdminAnalytics.tsx`)
- Revenue overview cards (total, average booking, avg stay length)
- Revenue by property bar chart
- Monthly trends line chart
- Top-performing add-ons table
- Occupancy rate metrics

---

## Phase 4: New Admin Hooks

### 4.1 `useAdminAddons.ts`
```typescript
export function useAdminAddons() {
  // Fetch all addons (including inactive)
}
export function useCreateAddon() { /* ... */ }
export function useUpdateAddon() { /* ... */ }
export function useDeleteAddon() { /* ... */ }
export function useReorderAddons() { /* ... */ }
```

### 4.2 `useAdminPromotions.ts`
```typescript
export function useAdminCoupons() { /* ... */ }
export function useCreateCoupon() { /* ... */ }
export function useUpdateCoupon() { /* ... */ }
export function useDeleteCoupon() { /* ... */ }
export function useAdminSpecialOffers() { /* ... */ }
// Similar CRUD for special offers
```

### 4.3 `useAdminFees.ts`
```typescript
export function useAdminFees() { /* ... */ }
export function useCreateFee() { /* ... */ }
export function useUpdateFee() { /* ... */ }
export function useDeleteFee() { /* ... */ }
```

### 4.4 `useAdminRatePlans.ts`
```typescript
export function useAdminRatePlans() { /* ... */ }
export function useCreateRatePlan() { /* ... */ }
export function useUpdateRatePlan() { /* ... */ }
export function useDeleteRatePlan() { /* ... */ }
```

### 4.5 `useAdminPMSHealth.ts`
```typescript
export function usePMSConnectionStatus() { /* ... */ }
export function usePMSSyncHistory() { /* ... */ }
export function usePMSPropertyMappings() { /* ... */ }
export function usePMSRawEvents() { /* ... */ }
export function useTriggerManualSync() { /* ... */ }
export function useTestPMSConnection() { /* ... */ }
export function usePushBookingToPMS() { /* ... */ }
```

### 4.6 `useAdminAnalytics.ts`
```typescript
export function useRevenueStats(dateRange) { /* ... */ }
export function useRevenueByProperty() { /* ... */ }
export function useMonthlyTrends() { /* ... */ }
export function useAddonPerformance() { /* ... */ }
export function useOccupancyMetrics() { /* ... */ }
```

---

## Phase 5: Two-Way PMS Integration

### 5.1 Enhance PMSAdapter Interface
Add bidirectional operations to `src/integrations/pms/types.ts`:

```typescript
interface PMSAdapter {
  // Existing PULL operations
  fetchProperties(): Promise<PMSProperty[]>;
  fetchAvailability(...): Promise<PMSAvailability[]>;
  fetchRates(...): Promise<PMSRate[]>;
  fetchFees(...): Promise<PMSFee[]>;
  
  // New PUSH operations (two-way sync)
  pushBooking(booking: PMSBookingRequest): Promise<PMSBookingResponse>;
  pushCancellation(request: PMSCancellationRequest): Promise<PMSCancellationResponse>;
  pushAvailabilityBlock(block: PMSAvailabilityBlock): Promise<void>;
  pushRateUpdate(update: PMSRateUpdate): Promise<void>;
  
  // Webhook handling
  handleWebhook(payload: unknown): Promise<PMSWebhookResult>;
  
  // Sync operations
  syncAll(): Promise<PMSSyncResult>;
  syncFromPMS(): Promise<PMSSyncResult>; // Pull changes
  syncToPMS(changes: LocalChanges): Promise<PMSSyncResult>; // Push changes
}
```

### 5.2 Enhance MockPMSAdapter
Update `src/integrations/pms/mock-adapter.ts` to support two-way operations:
- Add `pushBooking()` - simulates pushing reservation to PMS
- Add `pushCancellation()` - simulates cancellation push
- Add `pushAvailabilityBlock()` - simulates blocking dates in PMS
- Add `handleWebhook()` - simulates processing incoming webhooks
- Track local vs remote state for testing

### 5.3 PMS Webhook Edge Function
Create `supabase/functions/pms-webhook/index.ts`:
- Verify webhook signature (Tokeet-specific headers)
- Store raw event in `pms_raw_events` table
- Process event type (booking_created, booking_updated, availability_changed, rate_changed)
- Update local database tables accordingly
- Trigger React Query invalidation via realtime

### 5.4 Booking Push Edge Function
Create `supabase/functions/push-booking-to-pms/index.ts`:
- Called after successful payment
- Creates reservation in PMS via adapter
- Stores external booking ID in local booking record
- Handles errors with retry logic
- Updates `audit_log` with sync status

---

## Phase 6: Frontend-Admin Synchronization

### 6.1 Connect Booking Creation to Admin
When a booking is created via `UnifiedBookingDialog` → Checkout → Payment:

1. Create booking in local `bookings` table
2. Call PMS push function to sync to external system
3. Log to `audit_log` table
4. Invalidate React Query caches for admin views
5. Admin dashboard shows new booking in real-time

### 6.2 Connect Status Changes
When admin updates booking status in `AdminBookings.tsx`:

1. Update local `bookings` table
2. Push status change to PMS (cancellation, confirmation)
3. Log change to `audit_log`
4. Frontend booking widgets reflect updated status

### 6.3 Add-ons & Pricing Sync
The `UnifiedBookingDialog` and `Checkout` components already use:
- `useAddons()` - fetches from `addons_catalog` (admin-managed)
- `useFeesTaxes()` - fetches from `fees_taxes` (admin-managed)
- `useValidateCoupon()` - validates against `coupons_promos` (admin-managed)

Ensure admin CRUD operations invalidate these query keys for real-time UI updates.

### 6.4 Availability Sync
The `useAvailabilityCalendar()` hook already:
- Fetches from PMS adapter
- Merges with local `availability` blocks
- Considers active `checkout_holds`

Enhance to also listen for realtime updates when admin modifies availability.

---

## Phase 7: App Router Updates

### Update `App.tsx`
Add new admin routes:

```typescript
<Route path="/admin/addons" element={<AdminAddonsManagement />} />
<Route path="/admin/promotions" element={<AdminPromotions />} />
<Route path="/admin/fees" element={<AdminFees />} />
<Route path="/admin/rate-plans" element={<AdminRatePlans />} />
<Route path="/admin/pms" element={<AdminPMSHealth />} />
<Route path="/admin/analytics" element={<AdminAnalytics />} />
```

---

## Phase 8: Real-Time Updates with Supabase Realtime

Enable realtime subscriptions for admin-managed tables:

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkout_holds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pms_sync_runs;
```

Create a `useRealtimeBookings()` hook that subscribes to changes and updates admin dashboard in real-time.

---

## Technical Implementation Files

### Files to Create:
1. `src/pages/admin/AdminAddonsManagement.tsx`
2. `src/pages/admin/AdminPromotions.tsx`
3. `src/pages/admin/AdminFees.tsx`
4. `src/pages/admin/AdminRatePlans.tsx`
5. `src/pages/admin/AdminPMSHealth.tsx`
6. `src/pages/admin/AdminAnalytics.tsx`
7. `src/hooks/useAdminAddons.ts`
8. `src/hooks/useAdminPromotions.ts`
9. `src/hooks/useAdminFees.ts`
10. `src/hooks/useAdminRatePlans.ts`
11. `src/hooks/useAdminPMSHealth.ts`
12. `src/hooks/useAdminAnalytics.ts`
13. `src/hooks/useRealtimeBookings.ts`
14. `supabase/functions/pms-webhook/index.ts`
15. `supabase/functions/push-booking-to-pms/index.ts`

### Files to Modify:
1. `src/components/admin/AdminLayout.tsx` - Grouped navigation
2. `src/pages/admin/AdminDashboard.tsx` - Enhanced stats and widgets
3. `src/App.tsx` - New admin routes
4. `src/integrations/pms/types.ts` - Two-way operations
5. `src/integrations/pms/mock-adapter.ts` - Push operations
6. `src/hooks/usePMSIntegration.ts` - Push booking mutations
7. `src/hooks/useBookings.ts` - Add PMS sync after booking creation
8. `src/pages/Checkout.tsx` - Trigger PMS push on successful payment

---

## Data Flow Diagram

```text
FRONTEND BOOKING FLOW:
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Property Cards  │────▶│ UnifiedBooking   │────▶│    Checkout     │
│ Book Now Button │     │    Dialog        │     │   Payment       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌────────────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │   Create Booking    │
                    │   (Supabase DB)     │
                    └─────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌──────────────┐ ┌───────────────────┐
│ Push to PMS       │ │ Audit Log    │ │ Invalidate Caches │
│ (Edge Function)   │ │ Entry        │ │ (React Query)     │
└─────────┬─────────┘ └──────────────┘ └───────────────────┘
          │
          ▼
┌─────────────────────┐
│ External PMS        │
│ (Tokeet/AdvanceCM)  │
└─────────┬───────────┘
          │ Webhook
          ▼
┌─────────────────────┐
│ PMS Webhook Handler │
│ (Edge Function)     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Update Local DB     │
│ Notify Admin via    │
│ Realtime            │
└─────────────────────┘
```

---

## Expected Outcomes

1. **Centralized Admin Control**: All booking engine configuration (add-ons, fees, coupons, rates) managed from admin dashboard
2. **Real-Time Sync**: Changes in admin immediately reflected in frontend booking flow
3. **Two-Way PMS**: Bookings push to PMS; PMS changes (via webhook) update local system
4. **Visibility**: Admin sees PMS sync health, errors, and can trigger manual syncs
5. **Audit Trail**: All booking-related changes logged for accountability
6. **Revenue Insights**: Analytics dashboard for data-driven decisions
