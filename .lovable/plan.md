

# Comprehensive Project Cleanup Plan

## Overview
After a deep audit of the Haven Hub codebase, I've identified multiple categories of issues: dead code after Stripe removal, orphaned/unused files, duplicate hook implementations, stale config references, and outdated comments. This plan addresses all of them systematically.

---

## Summary of Issues Found

| Category | Count | Impact |
|----------|-------|--------|
| Stale Stripe references (comments/text) | 4 locations | Low - confusing, not functional |
| Orphaned config.toml entries | 2 | Low - references non-existent functions |
| Duplicate hook implementations | 4 hooks | Medium - maintenance burden, confusion |
| Unused components | 2 | Low - dead code |
| Unused hooks | 5 functions | Low - dead code |
| Unused hook file (entire) | 1 | Medium - entire file unused |

---

## Detailed Cleanup Items

### 1. Remove Stale Stripe References (Comments/Text)

These are leftover references to Stripe that no longer apply since Stripe was removed:

| File | Line | Issue |
|------|------|-------|
| `src/components/booking/PaymentOptions.tsx` | 201 | Text: "Powered by Stripe • Apple Pay • Google Pay accepted" |
| `src/components/booking/BookingWidget.tsx` | 67 | Comment: "// Instant booking - route to checkout with Stripe payment" |
| `src/hooks/useCompleteBooking.ts` | 186 | Comment: "// Will be updated when Stripe payment completes" |
| `src/types/booking-engine.ts` | 146 | Type field: `stripePaymentIntentId?: string;` |

**Action:** Update text/comments to be generic ("Secure Payment Gateway") and keep the type field (used by database schema).

---

### 2. Remove Orphaned Edge Function Config Entries

The `supabase/config.toml` file references two edge functions that don't exist in the codebase:

| Config Entry | Folder Exists? |
|--------------|---------------|
| `[functions.pms-reconcile]` | No |
| `[functions.test-pms-webhook]` | No |

**Note:** `test-pms-webhook` is referenced in `useAdminPMSHealth.ts` but the function doesn't exist, so that call would fail.

**Action:** 
- Remove the two orphaned config entries from `supabase/config.toml`
- Update `useTestWebhookEndpoint()` in `useAdminPMSHealth.ts` to show an error or implement the missing function

---

### 3. Remove Duplicate Hook Implementations

Several hooks are defined in multiple files with similar functionality:

#### 3a. `useTriggerPMSSync` - Duplicated

| File | Status |
|------|--------|
| `src/hooks/usePMSSyncStatus.ts` | **USED** (imported by AdminDashboard.tsx) |
| `src/hooks/usePMSIntegration.ts` | UNUSED (never imported) |

#### 3b. `useTestPMSConnection` - Duplicated

| File | Status |
|------|--------|
| `src/hooks/useAdminPMSHealth.ts` | **USED** (imported by AdminPMSHealth.tsx) |
| `src/hooks/usePMSIntegration.ts` | UNUSED (never imported) |

#### 3c. `usePMSPropertyMappings` - Duplicated

| File | Status |
|------|--------|
| `src/hooks/useAdminPMSHealth.ts` | **USED** (imported by AdminPMSHealth.tsx) |
| `src/hooks/usePMSIntegration.ts` | UNUSED (never imported) |

#### 3d. `usePMSRawEvents` - Duplicated

| File | Status |
|------|--------|
| `src/hooks/useAdminPMSHealth.ts` | **USED** (imported by AdminPMSHealth.tsx) |
| `src/hooks/usePMSIntegration.ts` | UNUSED (never imported) |

#### 3e. Special Offer Mutations - Duplicated

| File | Status |
|------|--------|
| `src/hooks/useAdminPromotions.ts` | **USED** (imported by SpecialOfferFormDialog) |
| `src/hooks/useSpecialOffers.ts` | UNUSED (only reads are used) |

**Action:** 
- Delete the entire `src/hooks/usePMSIntegration.ts` file (all exports are unused)
- Remove `useCreateSpecialOffer`, `useUpdateSpecialOffer`, `useDeleteSpecialOffer` from `src/hooks/useSpecialOffers.ts`

---

### 4. Remove Unused Hook Exports

These hook functions are defined but never called anywhere:

| File | Function | Reason Unused |
|------|----------|---------------|
| `src/hooks/usePMSIntegration.ts` | `usePMSConnection()` | Never imported |
| `src/hooks/usePMSIntegration.ts` | `usePMSSyncRuns()` | Never imported |
| `src/hooks/usePMSIntegration.ts` | `useStorePMSWebhookEvent()` | Never imported |
| `src/hooks/useAvailability.ts` | `usePropertyAvailability()` | Never imported |
| `src/hooks/useAvailability.ts` | `usePropertyBookingsForCalendar()` | Never imported |
| `src/hooks/useSpecialOffers.ts` | `useSpecialOffers()` | Never imported (only active offer used) |
| `src/hooks/useSpecialOffers.ts` | `useAllActiveOffers()` | Never imported |
| `src/hooks/useCancellationRefund.ts` | Entire file | Never imported (was for refund processing) |

**Action:** 
- Delete entire `src/hooks/usePMSIntegration.ts`
- Delete entire `src/hooks/useCancellationRefund.ts`
- Remove unused functions from `useAvailability.ts` and `useSpecialOffers.ts`

---

### 5. Unused Components

| Component | Location | Reason Unused |
|-----------|----------|---------------|
| `NavLink` | `src/components/NavLink.tsx` | Never imported anywhere |
| `PaymentOptions` | `src/components/booking/PaymentOptions.tsx` | Never imported (checkout uses placeholder) |

**Action:** Delete both files.

---

## Files to Delete

| File | Reason |
|------|--------|
| `src/hooks/usePMSIntegration.ts` | All exports are duplicates of hooks in other files, never imported |
| `src/hooks/useCancellationRefund.ts` | Was for refund calculations, never used after Stripe removal |
| `src/components/NavLink.tsx` | Custom NavLink wrapper, never imported |
| `src/components/booking/PaymentOptions.tsx` | Payment UI component, never used (checkout has placeholder) |

---

## Files to Modify

### `supabase/config.toml`
- Remove `[functions.pms-reconcile]` section (lines 21-22)
- Remove `[functions.test-pms-webhook]` section (lines 24-25)

### `src/hooks/useAdminPMSHealth.ts`
- Remove or mark as broken the `useTestWebhookEndpoint()` function (references non-existent edge function)

### `src/hooks/useAvailability.ts`
- Remove `usePropertyAvailability()` function
- Remove `usePropertyBookingsForCalendar()` function

### `src/hooks/useSpecialOffers.ts`
- Remove `useSpecialOffers()` function
- Remove `useAllActiveOffers()` function
- Remove `useCreateSpecialOffer()` function
- Remove `useUpdateSpecialOffer()` function
- Remove `useDeleteSpecialOffer()` function
- Keep only `useActiveSpecialOffer()` (which is used)

### `src/components/booking/BookingWidget.tsx`
- Update comment on line 67 to remove Stripe reference

### `src/hooks/useCompleteBooking.ts`
- Update comment on line 186 to remove Stripe reference

---

## Implementation Order

1. **Delete orphaned files** (4 files)
2. **Clean up config.toml** (remove 2 sections)
3. **Remove unused hook functions** from shared files
4. **Update stale comments/text** to remove Stripe references

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Delete `usePMSIntegration.ts` | Low | Verified no imports exist |
| Delete `PaymentOptions.tsx` | Low | Verified no imports exist |
| Delete `NavLink.tsx` | Low | Verified no imports exist |
| Remove config entries | None | Functions don't exist anyway |
| Update comments | None | No functional change |

---

## Post-Cleanup Verification

After cleanup, verify:
- Admin dashboard PMS sync still works (uses `usePMSSyncStatus.ts`)
- PMS Health page still works (uses `useAdminPMSHealth.ts`)
- Special offers display on property cards (uses `useActiveSpecialOffer`)
- Checkout flow still works (uses `useCheckoutFlow.ts`)

