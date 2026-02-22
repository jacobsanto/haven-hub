

# Responsive Header with Taller Search Bar Area

## Current State
The header works but is too short (h-16 / 64px), making the search bar feel cramped and squeezed against the nav links and auth controls.

## Changes

### 1. `src/components/layout/Header.tsx`
- Increase header height from `h-16` to `h-[72px]` to give the search bar more breathing room
- Keep the current layout structure: Logo + priority nav links (left), search bar (center), currency + auth (right)
- No other structural changes needed -- the current layout already matches the reference

### 2. `src/components/search/HeaderSearchBar.tsx`
- Increase segment padding from `py-1.5` to `py-2` so the text has more vertical space inside each segment
- This makes the pill search bar slightly taller and more comfortable to read

## Technical Details

### Header.tsx (line 64)
- Change `h-16` to `h-[72px]` on the nav element

### HeaderSearchBar.tsx (lines 81, 134, 163, 192)
- Change `py-1.5` to `py-2` on each segment button

### Impact
- All pages that reference header height via `pt-16` spacing may need updating to `pt-[72px]` -- will search for and update any affected layout files

