
# Inline Header Search Bar

## Overview

Replace the current "Find Your Stay" button in the header with a pill-shaped inline search bar that matches the reference design. The search bar sits in the sticky header between the nav links and the auth/currency controls, and is visible on all pages except the homepage.

## Design (from reference screenshot)

- **Container**: Rounded-full pill, white/card background, subtle border + shadow, segments divided by light dividers
- **4 segments** as buttons: WHERE, CHECK IN, CHECK OUT, GUESTS -- each shows a tiny uppercase label with the value below in muted text
- **Active segment** gets a highlighted background (e.g. `bg-muted rounded-full`)
- **Search button**: Circular primary-colored button at the right end with a search icon
- **Guests popover**: Dropdown card with +/- stepper rows for Adults (ages 13+), Children (ages 2-12), Infants (under 2), and an "Apply" button
- **Where popover**: Destination command list (reusing `useActiveDestinations`)
- **Check In / Check Out popovers**: Calendar date pickers
- **Hidden on mobile** (`hidden lg:flex`) -- mobile keeps the existing "Find Your Stay" CTA button

## Files to Change

### 1. Create `src/components/search/HeaderSearchBar.tsx` (New)

A self-contained pill search bar component:

- Internal state: `selectedDestination`, `checkIn` (Date), `checkOut` (Date), `adults` (default 2, min 1), `children` (default 0), `infants` (default 0)
- `activeSegment` state to track which popover is open (where / checkin / checkout / guests / null)
- **Where segment**: Opens Popover with `Command` list from `useActiveDestinations` (same pattern as existing `SearchBar.tsx`)
- **Check In segment**: Opens Popover with `Calendar` component, disabled dates before today
- **Check Out segment**: Opens Popover with `Calendar` component, disabled dates before check-in
- **Guests segment**: Opens Popover with stepper controls (+/- buttons) for Adults, Children, Infants. Each row shows category name, age description, and value with increment/decrement buttons styled as circular bordered buttons
- **Search button**: `w-10 h-10 bg-primary rounded-full` with search icon. On click, navigates to `/properties` with query params (location, checkIn, checkOut, guests = adults + children)
- Container styling: `flex items-center bg-card border border-border rounded-full shadow-sm divide-x divide-border/50 p-1`
- Each segment button: `px-4 py-2 hover:bg-muted/50 text-left transition-colors` with `text-[10px] font-bold uppercase tracking-wider` for the label and `text-sm text-muted-foreground font-medium` for the value

### 2. Modify `src/components/layout/Header.tsx`

- Replace `HeaderSearchToggle` import with `HeaderSearchBar`
- In the desktop section, replace `{showSearch && <HeaderSearchToggle />}` with `{showSearch && <HeaderSearchBar />}`
- Keep mobile menu "Find Your Stay" button as-is (no change)

## Technical Details

- Reuses existing `Popover`, `Calendar`, `Command` UI components already in the project
- Reuses `useActiveDestinations` hook for destination data
- Guest stepper logic is local to the component (no context changes needed)
- Total guests passed as query param = `adults + children` (infants don't count toward occupancy)
- The `PropertyStickyNav` (z-40) and header (z-50) will not conflict since the header always sits above
