

## Sheet-Only Filters Implementation Plan

This plan converts the Properties page filters from a dual-mode (sidebar + mobile sheet) to a unified Sheet-only approach for all screen sizes.

---

### What Changes

**Before:**
- Desktop (lg+): Fixed 72px sidebar always visible on the left
- Mobile: Floating "Filters" button at bottom, opens Sheet drawer

**After:**
- All screens: "Filters" button in the toolbar area, opens Sheet drawer
- Property grid gets full width on all devices
- Consistent user experience across desktop, tablet, and mobile

---

### Implementation Steps

#### Step 1: Remove Desktop Sidebar
Remove the entire `<aside>` block (currently lines 236-249) that renders the desktop filter sidebar.

#### Step 2: Update Layout Structure  
Change the main content wrapper from `flex gap-8` to a simpler single-column layout since there's no sidebar anymore.

#### Step 3: Move Filter Button to Toolbar
Relocate the Sheet trigger button from the fixed bottom position to the toolbar row (next to the results count and view toggle buttons). This creates a cleaner, more accessible placement.

#### Step 4: Update Filter Button Styling
- Remove `lg:hidden` class so it shows on all screens
- Remove `fixed bottom-4 left-1/2 -translate-x-1/2` positioning
- Style as a regular toolbar button with the Filter icon and active count badge

#### Step 5: Adjust Grid Columns
With no sidebar taking space, the property grid can use more columns on larger screens:
- Current: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- New: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

---

### Technical Details

**File to modify:** `src/pages/Properties.tsx`

**Key changes:**

```text
1. DELETE lines 236-249 (desktop sidebar aside element)

2. MODIFY line 235: Change wrapper from flex layout
   FROM: <div className="flex gap-8">
   TO:   <div>

3. MODIFY lines 252-265: Move SheetTrigger into toolbar row
   - Remove: lg:hidden, fixed positioning classes
   - Add: Standard button styling in toolbar

4. MODIFY property grid classes (lines 309, 321):
   FROM: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
   TO:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

**New toolbar layout structure:**
```
[Results count] -------- [Filters button] [Grid/Map toggle]
```

---

### Benefits

1. **More property visibility**: Full-width grid shows 4 columns on XL screens instead of 3
2. **Consistent UX**: Same interaction pattern on all devices
3. **Cleaner interface**: No permanent sidebar taking horizontal space
4. **Better for browsing**: Users can focus on properties, opening filters only when needed

