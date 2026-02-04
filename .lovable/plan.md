

# Booking Engine Stripe Readiness Audit: Add-ons & Experiences

## Summary

After a comprehensive audit of the add-ons and experiences systems, I've found:

| Component | Status | Stripe Ready? |
|-----------|--------|---------------|
| Add-ons Catalog | Complete | Yes |
| Add-on Selection UI | Complete | Yes |
| Add-on Price Calculation | Complete | Yes |
| Add-on Persistence (booking_addons) | Complete | Yes |
| Fees & Taxes | Schema ready, **no data** | Needs admin setup |
| Experiences | Enquiry-based only | Not for direct booking |
| Price Breakdown | Complete | Yes |
| Checkout Flow | Complete | Yes |

---

## 1. Add-ons System - Stripe Ready

### What's Working

The add-ons system is **fully integrated** into the booking flow:

**Database**: `addons_catalog` table
- Stores add-on products with flexible pricing (fixed, per_person, per_night, per_person_per_night)
- Supports property-specific and global add-ons
- Has 1 active add-on: "Airport Transfer" at €40/fixed

**Frontend**: `AddonsSelection.tsx`
- Beautiful category-grouped UI (Transfers, Dining, Experiences, Services, Packages)
- Quantity controls with max limits
- Real-time price calculation

**Price Engine**: `useBookingEngine.ts`
- `calculateAddonPrice()` handles all pricing types
- Add-ons are included in `calculatePriceBreakdown()` as line items

**Persistence**: `useCompleteBooking.ts`
- Add-ons saved to `booking_addons` table with booking_id reference
- Stored with unit_price, quantity, total_price, status

**Checkout Integration**: `Checkout.tsx`
- Step 2 ("addons") allows add-on selection
- Selected add-ons appear in price summary
- Passes to payment step

### What's in Place for Stripe

When Stripe is implemented, add-ons will be:
1. Included in the payment intent amount (already calculated)
2. Listed as line items in price breakdown (already structured)
3. Passed to Stripe metadata for dashboard visibility
4. Saved atomically after payment success

---

## 2. Experiences System - NOT for Direct Booking

### Current Design (Intentional)

Experiences are **enquiry-based**, not direct-purchase:

```
experiences table → EnquiryForm → experience_enquiries table
```

**Why This Makes Sense:**
- Experiences are high-touch services (Wine Tasting €350/person, Yacht Charter €2,500/group)
- Require coordination, availability confirmation, custom scheduling
- Not suitable for instant checkout

**Current Flow:**
1. Guest browses experiences
2. Fills out enquiry form (name, email, preferred date, group size)
3. Admin reviews in `/admin/experience-enquiries`
4. Manual follow-up to confirm and collect payment

### Should Experiences Be Added to Booking Flow?

**Option A: Keep Current (Recommended)**
- Experiences remain enquiry-based
- Add-ons catalog already has "experience" category for simpler experiences
- High-value experiences benefit from concierge approach

**Option B: Future Enhancement (Post-Stripe)**
- Allow experiences to be added as booking add-ons
- Would require linking experiences to addons_catalog
- Could add "instant book" flag to experiences

---

## 3. Gaps to Address Before Stripe

### 3a. No Fees or Taxes Configured

The `fees_taxes` table is empty, but the schema supports:
- Cleaning fees (fixed)
- Service fees (percentage)
- Tourism tax (per_guest_per_night)
- VAT (percentage on subtotal)

**Action Required:** Admin needs to configure fees/taxes in `/admin/fees` before going live

### 3b. Experience Category in Add-ons

The add-on categories include "experience" which could create confusion:

| System | Purpose |
|--------|---------|
| `addons_catalog` category="experience" | Simple purchasable items (cooking class, spa add-on) |
| `experiences` table | High-value concierge services (yacht charter, wine tour) |

**Recommendation:** Rename add-on category to "activities" to avoid confusion

---

## 4. Complete Stripe Integration Checklist

### Already Complete (from booking engine)
- Property selection and pricing
- Date selection with availability checks
- Guest information capture with validation
- Add-ons selection and pricing
- Coupon validation and discount application
- Fees and taxes calculation framework
- Full price breakdown display
- 10-minute checkout hold (TTL lock)
- Booking reference generation
- PMS sync hooks

### Needs Implementation (for Stripe)

| Component | Description |
|-----------|-------------|
| `create-payment-intent` edge function | Creates Stripe PaymentIntent with full amount |
| Stripe Elements UI | Card input in payment step |
| `confirm-payment` edge function | Creates booking records after payment success |
| Stripe metadata | Pass booking details for dashboard |
| Payment webhook | Handle async payment events |

---

## 5. Recommended Pre-Stripe Setup

Before implementing Stripe, complete these admin setup tasks:

| Task | Admin Path | Status |
|------|------------|--------|
| Add more add-ons | /admin/addons | Only 1 exists |
| Configure fees | /admin/fees | Empty |
| Configure taxes | /admin/fees | Empty |
| Review rate plans | /admin/rate-plans | Check if configured |
| Set up coupons | /admin/promotions | For launch discounts |

---

## 6. Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CHECKOUT FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │  Dates   │ → │ Add-ons  │ → │  Guest   │ → │ Payment  │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       │              │              │              │            │
│       ▼              ▼              ▼              ▼            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Calendar │   │ AddonsUI │   │ GuestUI  │   │ Stripe   │     │
│  │ + Holds  │   │ + Prices │   │ + Valid  │   │ Elements │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                    │            │
│                 ┌──────────────────────────────────┘            │
│                 ▼                                               │
│          ┌─────────────────────┐                                │
│          │ calculatePriceBreak │ ← nightlyRate                  │
│          │ down()              │ ← selectedAddons               │
│          │                     │ ← fees/taxes                   │
│          │                     │ ← coupon                       │
│          └─────────────────────┘                                │
│                 │                                               │
│                 ▼                                               │
│          ┌─────────────────────┐                                │
│          │ Total Amount        │ → Stripe PaymentIntent         │
│          └─────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Conclusion

**The booking engine is ready for Stripe integration.** The add-ons system is fully wired up, the price calculation engine handles all scenarios, and the checkout flow has all steps in place. The main work is:

1. **Edge Functions**: `create-payment-intent` and `confirm-payment`
2. **Payment UI**: Stripe Elements in the payment step
3. **Admin Setup**: Configure fees, taxes, and add more add-ons

The experiences system is correctly designed as enquiry-based for high-touch concierge services and does not need to be part of the Stripe integration.

