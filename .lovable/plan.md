
# Unified Booking Experience Overhaul

## Problem Summary
The current booking system has multiple disconnected entry points that confuse users:
- Homepage shows both a "Book Now" button AND a search widget - these serve different purposes and are not connected
- Various "Book Now" buttons, search bars, and booking widgets across the site operate independently
- Mobile calendar has DOM nesting issues causing console errors
- Property cards inconsistently use "Request to Book" vs "Book Now"

## Solution Overview
Create a unified, cohesive booking flow that connects all entry points to a single, property-focused booking system.

---

## Phase 1: Consolidate Homepage Hero

**Current State:**
- "Book Now" button opens property selector dialog
- Search widget below searches/filters properties by location, dates, guests

**Changes:**
1. Remove the standalone "Book Now" button from homepage hero
2. Enhance the SearchBar to be the primary booking entry point with a more prominent CTA
3. Add "View Properties" button that links to /properties as a secondary action

**Reasoning:** One clear call-to-action is better than two competing ones. The search widget already captures all booking intent (where, when, who).

---

## Phase 2: Create Unified Booking Dialog/Flow

**New Component: `UnifiedBookingFlow`**
- Single modal/drawer that handles the complete booking journey
- Steps: Property Selection → Date Selection → Guest Count → Continue to Checkout
- Used consistently across ALL entry points:
  - FloatingBookButton
  - Header "Find Your Stay" button
  - Property card "Book Now" buttons

**Key Features:**
- Pre-populate with property when accessed from a property card
- Pre-populate with search parameters when accessed from search
- Skip property selection step when property is already known
- Mobile-optimized bottom sheet version

---

## Phase 3: Fix Property Cards

**Changes to PropertyCard and QuickBookCard:**
1. Merge into single component or ensure consistent behavior
2. "Book Now" button behavior:
   - Opens unified booking dialog with property pre-selected
   - Skips property selection step, goes directly to date picker
3. Remove "Request to Book" terminology - use "Book Now" consistently

**Button Behavior:**
```text
Property Card "Book Now" clicked
    ↓
Opens Unified Booking Dialog
    ↓
Property already selected (pre-filled)
    ↓
Show date picker immediately
    ↓
Select dates → Select guests → Checkout
```

---

## Phase 4: Fix Mobile Experience

**Calendar DOM Fix:**
- The error "`<button>` cannot appear as descendant of `<button>`" occurs because the Calendar's navigation buttons are rendered inside a PopoverTrigger button
- Solution: Ensure Calendar is rendered in a `div` container, not inside button elements
- Add `pointer-events-auto` class to Calendar wrapper

**Mobile Booking Drawer Improvements:**
1. Consolidate FloatingBookButton and MobileBookingCTA logic
2. Single, consistent mobile booking drawer across all pages
3. Improved calendar with:
   - Larger touch targets (44x44px minimum)
   - Swipe gestures between months
   - Clear date selection feedback

---

## Phase 5: Simplify Header Booking Access

**Changes:**
1. `HeaderSearchToggle` → Opens the unified booking dialog instead of its own dropdown
2. Remove duplicate search functionality in header
3. Simple "Book Now" button in header that opens unified dialog

---

## Technical Implementation Details

### Files to Modify:
1. `src/pages/Index.tsx` - Remove redundant "Book Now" button, enhance SearchBar integration
2. `src/components/booking/FloatingBookButton.tsx` - Refactor to use unified flow
3. `src/components/booking/PropertySelectorDialog.tsx` - Enhance as the unified booking dialog
4. `src/components/properties/PropertyCard.tsx` - Update to use unified booking flow
5. `src/components/booking/QuickBookCard.tsx` - Align with PropertyCard behavior
6. `src/components/booking/HeaderSearchToggle.tsx` - Simplify to open unified dialog
7. `src/components/booking/MobileBookingCTA.tsx` - Fix Calendar DOM nesting issue
8. `src/components/ui/calendar.tsx` - Ensure pointer-events-auto is applied
9. `src/components/search/SearchBar.tsx` - Enhance as primary booking entry on homepage

### New Component:
- `src/components/booking/UnifiedBookingDialog.tsx` - New unified booking experience that can:
  - Accept optional pre-selected property
  - Accept optional pre-filled dates/guests
  - Handle both property browsing and direct booking flows
  - Provide consistent mobile (drawer) and desktop (dialog) experiences

### Shared State/Context (Optional Enhancement):
Consider creating a `BookingContext` to share booking state across components:
- Selected property
- Check-in/out dates
- Guest count
- This allows seamless handoff between components

---

## Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                     ENTRY POINTS                                 │
├─────────────────────────────────────────────────────────────────┤
│  Homepage      │  Header     │  Property    │  Floating Button  │
│  Search Bar    │  Book Now   │  Card        │  (All Pages)      │
└───────┬────────┴──────┬──────┴───────┬──────┴────────┬──────────┘
        │               │              │               │
        └───────────────┴──────────────┴───────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │    UNIFIED BOOKING DIALOG      │
              ├────────────────────────────────┤
              │  Step 1: Property Selection    │  (skip if pre-selected)
              │  Step 2: Date Selection        │
              │  Step 3: Guest Count           │
              │  Step 4: Continue → Checkout   │
              └────────────────┬───────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │         /checkout              │
              │   (with all params in URL)     │
              └────────────────────────────────┘
```

---

## Expected Outcomes
1. Single, clear booking path regardless of entry point
2. Consistent "Book Now" language everywhere
3. Mobile-optimized experience with fixed calendar issues
4. Reduced user confusion from competing CTAs
5. Property cards that directly enable booking for that specific property

Finally I want you to have two booking options one which will be direct connected to a property and it’s availability and a general one that will be searching inside all properties and finds the ones that have availability on the dates selected