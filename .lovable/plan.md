

# Property Page Enhancements: Square Meters, Room Details, and Full Amenities

## Three Changes Requested

### 1. Add Square Meters to Quick Stats Bar

**Database**: Add a `area_sqm` (integer, nullable) column to the `properties` table.

**Admin Form**: Add a "Size (m2)" number input field alongside bedrooms/bathrooms in the property form.

**Quick Stats Bar** (`PropertyQuickStats.tsx`): Add a 5th stat showing the property size in square meters (only if the value exists). The grid changes from `grid-cols-4` to `grid-cols-5` on desktop.

**AI Generator**: Add `area_sqm` is not AI-generated content, so no changes needed to the edge function -- it's a factual number entered manually.

### 2. Enhance Rooms and Spaces Section

The `RoomBreakdown` component already supports room types like `living`, `kitchen`, `dining`, `office` -- but additional types are needed.

**Database type update**: Expand the `RoomConfig` type to include `terrace`, `balcony`, `laundry`, `garage`, `storage`, and `outdoor` room types.

**RoomBreakdown.tsx updates**:
- Add icons for new room types: terrace (TreePalm), balcony (Fence), laundry (WashingMachine), garage (Car), outdoor (Sun)
- Ensure all rooms (not just bedrooms) show their features list
- Rename "Other Spaces" to "Living Spaces and Outdoor Areas" for clarity

**Admin Form**: The room management section already supports adding rooms with types -- just add the new type options to the dropdown so admins can add terrace, balcony, etc.

### 3. Amenities: Highlighted + Full Collapsible List

Currently, the `AmenityList` component shows all amenities in a flat grid. The change:

**PropertyDetail.tsx** (amenities section):
- Show the property's `highlights` as featured amenity badges at the top (already rendered separately -- keep as-is)
- Show all amenities in a grouped grid but limit the initial view to the first 8 items
- Add a collapsible "Show all X amenities" toggle that reveals the complete categorized list

**AmenityList.tsx**:
- Add a new prop `collapsible?: boolean` and `initialVisible?: number`
- When collapsible is true, show only the first N amenities, with a "Show all X amenities" button that expands using Radix Collapsible
- The expanded view shows the full categorized grid with descriptions

## Files Changed

| File | Change |
|------|--------|
| Database migration | Add `area_sqm INTEGER` column to `properties` |
| `src/types/database.ts` | Add `area_sqm: number | null` to Property, expand RoomConfig types |
| `src/components/properties/PropertyQuickStats.tsx` | Add square meters stat with Maximize icon |
| `src/components/properties/RoomBreakdown.tsx` | Add terrace/balcony/outdoor icons and room types |
| `src/components/properties/AmenityList.tsx` | Add collapsible mode with initial visible count |
| `src/pages/PropertyDetail.tsx` | Pass `collapsible` and `initialVisible` to AmenityList |
| `src/pages/admin/AdminPropertyForm.tsx` | Add area_sqm input, add new room type options |
| `src/pages/admin/AdminQuickOnboard.tsx` | Initialize `area_sqm: null` |

## Technical Details

**New database column:**
```text
ALTER TABLE properties ADD COLUMN area_sqm integer;
```

**RoomConfig type expansion:**
```text
type: 'bedroom' | 'bathroom' | 'living' | 'kitchen' | 'dining' | 'office'
       | 'terrace' | 'balcony' | 'laundry' | 'garage' | 'outdoor'
```

**AmenityList collapsible logic:**
```text
- Show first 8 amenities in a 2-col grid
- "Show all X amenities" button with ChevronDown
- Expands to full categorized view with descriptions
- Uses Radix Collapsible for smooth animation
```

**Quick Stats grid:**
```text
grid-cols-2 md:grid-cols-5 (when area_sqm exists)
grid-cols-2 md:grid-cols-4 (fallback when no area_sqm)
```
