
# Admin Dashboard Cleanup Plan

## Overview
After auditing the admin dashboard, I've identified several items that need to be cleaned up because they either don't work (broken after Stripe removal), have no data/purpose, or reference features that aren't fully implemented.

---

## Items to Clean Up

### 1. ProcessRefundButton Component (REMOVE)
**Location:** `src/components/admin/ProcessRefundButton.tsx`

**Reason:** 
- Imported in `BookingDetailDialog.tsx` but **never actually used** (no JSX usage found)
- The refund processing edge function was deleted with Stripe removal
- Has no backend to process refunds anymore

**Action:** Delete the file and remove the import from `BookingDetailDialog.tsx`

---

### 2. Unused `isRefunding` State in BookingDetailDialog
**Location:** `src/components/admin/BookingDetailDialog.tsx` (line 75)

**Reason:**
- State variable `isRefunding` is declared but never used after Stripe removal
- Was intended for the ProcessRefundButton which is not rendered

**Action:** Remove the unused state variable

---

### 3. Clean Up Sidebar Navigation - Remove Non-Functional Items

The sidebar shows navigation items that either have empty data or incomplete functionality:

| Nav Item | Reason to Keep/Remove |
|----------|----------------------|
| **Dashboard** | Keep - Works |
| **Bookings** | Keep - Works, has 2 bookings |
| **Add-ons** | Keep - Has data (1 addon in catalog) |
| **Promotions** | Keep - Table exists, functional |
| **Campaigns** | Keep - Table exists, works even if empty |
| **Exit Intent** | Keep - Has 1 settings record, functional |
| **Fees & Taxes** | Keep - Empty but functional, needed for checkout |
| **Rate Plans** | Keep - Empty but functional, needed for pricing |
| **Import Rates** | Keep - Works with edge function |
| **Properties** | Keep - Works |
| **Destinations** | Keep - Works |
| **Amenities** | Keep - Works |
| **Experiences** | Keep - Works |
| **Enquiries** | Keep - Works |
| **AI Generator** | Keep - Works with `generate-content` edge function |
| **Content Calendar** | Keep - Works with `scheduled_blog_posts` table |
| **Blog Posts** | Keep - Works |
| **Authors** | Keep - Works |
| **Categories** | Keep - Works |
| **Newsletter** | Keep - Works |
| **PMS Health** | Keep - Working iCal sync system |
| **Analytics** | Keep - Works |
| **Settings** | Keep - Works |

**Conclusion:** All navigation items should be kept since they all connect to functional features with proper database tables.

---

## Files to Modify

### Delete Files
| File | Reason |
|------|--------|
| `src/components/admin/ProcessRefundButton.tsx` | Unused, no refund backend exists |

### Modify Files
| File | Changes |
|------|---------|
| `src/components/admin/BookingDetailDialog.tsx` | Remove unused `ProcessRefundButton` import and `isRefunding` state |

---

## Summary

This is a minimal cleanup focused on removing dead code after the Stripe removal. The admin dashboard navigation is well-organized and all items connect to functional features, even if some have no data yet (which is expected for a fresh system).

**Total changes:**
- 1 file deleted
- 1 file modified (2 lines removed)

