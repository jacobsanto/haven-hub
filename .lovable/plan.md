
# Fix: Header Search Bar Visibility and Layout

## Problem
The search bar is currently hidden on the homepage (where you are now) and overflows the header on other pages. Two issues to fix:

1. **Not visible on homepage** -- The code explicitly hides the search bar when on `/`
2. **Overflows on other pages** -- The header layout doesn't give the search bar enough room, causing it to clip off the right edge

## Changes

### 1. `src/components/layout/Header.tsx`

- **Remove the `showSearch` condition** so the search bar appears on every page including the homepage
- **Restructure the header layout**: Instead of three separate sections (logo | nav | search+auth), use a layout where the search bar is centered and the logo/auth are on the sides. This prevents the search bar from competing for space with nav links.
- Move nav links into a more compact arrangement or allow the search bar to take priority in the center of the header

Specifically:
- Remove `const showSearch = location.pathname !== '/';`
- Change `{showSearch && <HeaderSearchBar />}` to just `<HeaderSearchBar />`
- Adjust the nav container to use `flex-1` on the left and right sections, with the search bar taking the center space
- Reduce nav link gap from `gap-8` to `gap-6` to free up horizontal space

### 2. `src/components/search/HeaderSearchBar.tsx`

- Reduce padding on segments from `px-4` to `px-3` to make the bar more compact
- Reduce the max-width on the destination text from `max-w-[120px]` to `max-w-[100px]`
- These small tweaks ensure the bar fits comfortably in the header at common screen widths (1024px+)

## Result
The search bar will be visible and properly contained in the sticky header on every page, including the homepage.
