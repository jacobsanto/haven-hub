

# Property Detail Page Redesign

## Overview

Restructure the property detail page to match the reference layout: a clean, card-based design with the gallery and booking summary side-by-side in the hero area, highlight pills below, inline quick stats, and an experiences strip at the bottom.

## Layout Structure

```text
|  [< Back]      Property Name          [Save] [Heart]  |
|          Location · Feature · Verified Exclusive       |
|                                                        |
|  [=== Gallery Slider ===]  [ Booking Summary  ]       |
|  [  thumbs  thumbs  >  ]  [ Check-In  Check-Out ]     |
|                            [ Guests              ]     |
|                            [ Price / night       ]     |
|                            [ Reserve Villa >     ]     |
|                            [ Free Cancel · Pay Later ] |
|                                                        |
|  [Infinity Pool] [Sunset View] [Private Terrace]       |
|                                                        |
|  120 m²  ·  2 Bedrooms  ·  2 Bathrooms                |
|                                                        |
|  Experiences:  Sunset Cruise €180  ·  Wine Tasting €95 |
|                                    [Talk to Concierge] |
```

## Changes

### 1. `src/pages/PropertyDetail.tsx` -- Major restructure

**Top bar**: Replace breadcrumbs with a simpler navigation bar:
- Left: "Back" button (glass-panel pill, arrow + "Back") using `useNavigate(-1)`
- Center: Property name (serif, large) + subtitle line (location, first highlight, "Verified Exclusive" if instant_booking)
- Right: "Save" text button + Heart icon (inline, not floating)

**Hero section**: Replace the current full-width gallery + separate sidebar layout with a side-by-side row:
- Left (~60-65%): Use `PropertyHeroSlider` (Embla carousel with thumbnails) instead of `PropertyGallery` (bento grid)
- Right (~35-40%): Compact booking summary card (glass-panel) showing:
  - "Booking summary" header
  - Check-In / Check-Out date display boxes
  - Guests selector
  - Price per night (large)
  - Gold "Reserve Villa" button
  - "Free Cancellation · Pay Later" trust line
  - This replaces the existing `BookingWidget` in the sidebar

**Below hero**: 
- Highlight pills row (reuse `PropertyHighlights` with `variant="compact"`)
- Quick stats inline row (simplified from `PropertyQuickStats`)

**Experiences strip**: Compact horizontal row of related experiences with name + price, plus "Talk to Concierge" button on the right

**Remove from this page view**:
- `PropertyStickyNav` (remove)
- `PropertyShareSave` floating sidebar (replace with inline top-bar buttons)
- Breadcrumbs (replace with Back button)
- `PropertyQuickStats` overlapping card (replace with inline stats)
- The old 3-column grid layout

**Keep below the fold** (scrollable content unchanged):
- Overview/Description section
- Highlights detail section
- Rooms & Spaces
- Amenities
- Location & Neighborhood
- House Rules & Policies
- Similar Properties
- Mobile Booking CTA

### 2. `src/components/booking/BookingWidget.tsx` -- No changes

The existing BookingWidget stays as-is for the below-fold sticky sidebar. The hero area will have a NEW compact "BookingSummaryCard" component rendered inline in PropertyDetail.tsx (not a separate file -- just JSX in the page, keeping it simple). This compact card will trigger the same `BookingFlowDialog` on "Reserve Villa" click.

### 3. Files NOT modified

- All hooks, services, contexts untouched
- BookingWidget.tsx stays for potential reuse
- PropertyHeroSlider.tsx used as-is (already has Embla carousel + thumbnails)
- MobileBookingCTA stays for mobile users

## Technical Details

### PropertyDetail.tsx changes:

**New imports:**
- `PropertyHeroSlider` (replacing `PropertyGallery`)
- `useNavigate` from react-router-dom
- `BookingFlowDialog` for the compact card's reserve button
- `Heart, ArrowLeft, MessageCircle, Shield` from lucide-react

**Remove imports:**
- `PropertyGallery`
- `PropertyStickyNav`
- `PropertyShareSave`
- `PropertyQuickStats`
- Breadcrumb components

**Hero compact booking card** (inline JSX):
- Glass-panel styled card
- Check-in/Check-out displayed as styled date boxes (using pre-filled dates or placeholder)
- Guests dropdown display
- Price: large serif font with "/per night"
- Gold "Reserve Villa" button that opens `BookingFlowDialog`
- Trust line: clock icon + "Free Cancellation · Pay Later"

**Experiences strip** (inline JSX):
- Fetch related experiences (already available via `RelatedExperiences` query pattern)
- Display as horizontal compact cards: experience name + price + "/person"
- "Talk to Concierge" button on the right (links to /contact)

**Quick stats row**: Simple flex row with icons -- area_sqm, bedrooms, bathrooms -- separated by dots. No card wrapper.

### Responsive behavior:
- Desktop (lg+): Gallery + Booking card side by side
- Mobile: Gallery full width, booking card below, then highlights + stats
- MobileBookingCTA remains for sticky bottom bar on mobile

### No new files created -- all changes within `PropertyDetail.tsx`

## Files Modified

1. `src/pages/PropertyDetail.tsx` -- Complete hero section restructure with new layout
