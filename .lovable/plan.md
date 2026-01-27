
# Enhanced Amenities System with Admin Management

This plan enhances the amenity display with more icons and descriptions, and adds a new admin section for creating and managing custom amenities dynamically.

---

## 1. Current State Analysis

### What Exists Now
- **25 hardcoded amenities** in `src/lib/constants.ts`
- **Static icon/label maps** in `AmenityList.tsx`
- **Checkbox selection** in property form (from hardcoded list)
- **No ability** to add new amenities without code changes

### Limitations
- New amenities require developer changes
- No descriptions for amenities (only labels)
- Missing some luxury property features (butler service, private chef, etc.)

---

## 2. Database Schema

Create an `amenities` table to store amenities dynamically:

```text
+-------------------+
|    amenities      |
+-------------------+
| id (uuid, PK)     |
| slug (text)       |  <-- unique identifier (e.g., "butler-service")
| name (text)       |  <-- display name (e.g., "Butler Service")  
| description (text)|  <-- optional detail text
| icon (text)       |  <-- lucide icon name (e.g., "Crown")
| category (text)   |  <-- grouping (e.g., "Services", "Views", "Wellness")
| is_active (bool)  |  <-- soft delete / toggle visibility
| created_at        |
| updated_at        |
+-------------------+
```

### Row Level Security
- **SELECT**: Anyone can view active amenities
- **INSERT/UPDATE/DELETE**: Admins only

---

## 3. Seed Data - Enhanced Amenities

Populate the table with **35+ amenities** organized by category:

| Category | New Amenities |
|----------|---------------|
| **Wellness** | Yoga Deck, Meditation Room, Steam Room, Massage Room |
| **Services** | Butler Service, Private Chef, Housekeeping, Airport Transfer |
| **Views** | Lake View, City View, Garden View, Sunset View |
| **Entertainment** | Cinema Room, Game Room, Music System, Library |
| **Outdoors** | Tennis Court, Golf Access, Hiking Trails, Private Beach |
| **Luxury** | Wine Cellar, Infinity Pool, Rooftop Terrace, Helipad |
| **Technology** | Smart Home, EV Charging, High-Speed Internet, Home Office |

Each amenity includes:
- Descriptive text (e.g., "Dedicated space with yoga mats and equipment for daily practice")
- Appropriate Lucide icon
- Category for organized display

---

## 4. Admin Amenities Management Page

Create new page at `/admin/amenities`:

### Features
1. **List View**
   - Table with: Icon, Name, Category, Status (active/inactive), Actions
   - Search/filter by category
   - Toggle active status inline

2. **Add/Edit Dialog**
   - Name input
   - Slug (auto-generated from name)
   - Description textarea
   - Icon picker (dropdown with popular Lucide icons)
   - Category dropdown
   - Active toggle

3. **Delete** 
   - Soft delete (set is_active = false) to preserve data integrity
   - Warning if amenity is used by properties

### Icon Picker
A curated list of ~50 relevant Lucide icons with visual preview:
- Home/Building icons: Home, Building, Castle, Warehouse
- Nature icons: Mountain, Trees, Waves, Sun, Sunrise
- Activity icons: Dumbbell, Bike, Gamepad2, Music
- Luxury icons: Crown, Gem, Star, Sparkles
- Service icons: Bell, Headphones, Car, Plane
- Wellness icons: Heart, Spa, Leaf, Wind

---

## 5. Updated Property Form

Modify `/admin/properties/new` and `/edit`:

### Before
- 4-column grid of checkboxes from hardcoded list

### After
- **Categorized sections** (collapsible)
- **Search/filter** amenities by name
- **Icons displayed** next to each checkbox
- **Hover tooltips** showing description
- **Selected count** badge per category
- **"Manage Amenities"** link to admin page

---

## 6. Enhanced Frontend Display

### Property Card (`PropertyCard.tsx`)
- Show amenity icons (not just text badges)
- Color-coded by category
- Tooltip on hover with description

### Property Detail (`PropertyDetail.tsx`)
- **Categorized grid layout**
- Each amenity shows: Icon + Name + Description
- Visual category headers
- Larger, more visual presentation

### AmenityList Component Updates
- Fetch amenity metadata from database
- Support for descriptions
- Category grouping option
- Enhanced styling with brand colors

---

## 7. New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminAmenities.tsx` | List and manage amenities |
| `src/components/admin/AmenityDialog.tsx` | Add/Edit amenity modal |
| `src/components/admin/IconPicker.tsx` | Visual icon selector |
| `src/hooks/useAmenities.ts` | CRUD operations for amenities |

---

## 8. Updated Files

| File | Changes |
|------|---------|
| `src/components/admin/AdminLayout.tsx` | Add "Amenities" to sidebar nav |
| `src/pages/admin/AdminPropertyForm.tsx` | Use dynamic amenities with categories |
| `src/components/properties/AmenityList.tsx` | Fetch from DB, show descriptions |
| `src/components/properties/PropertyCard.tsx` | Show icons on amenity badges |
| `src/lib/constants.ts` | Keep as fallback, add icon mapping util |
| `src/App.tsx` | Add route for `/admin/amenities` |

---

## 9. Implementation Order

1. **Database**: Create `amenities` table with RLS policies
2. **Seed Data**: Insert 35+ amenities with icons, descriptions, categories
3. **Hook**: Create `useAmenities.ts` for data fetching and mutations
4. **Icon Picker**: Build reusable icon selector component
5. **Admin Page**: Build amenities management interface
6. **Admin Layout**: Add navigation link
7. **Property Form**: Update to use dynamic amenities
8. **Frontend Display**: Enhance AmenityList and PropertyCard

---

## 10. Visual Examples

### Admin Amenities Table
```text
+--------+------------------+-------------+--------+---------+
| Icon   | Name             | Category    | Status | Actions |
+--------+------------------+-------------+--------+---------+
| [Wifi] | WiFi             | Technology  | Active | Edit ⋮  |
| [Wave] | Infinity Pool    | Luxury      | Active | Edit ⋮  |
| [Crow] | Butler Service   | Services    | Active | Edit ⋮  |
+--------+------------------+-------------+--------+---------+
            [+ Add Amenity]
```

### Property Form Categories
```text
Wellness (3 selected)
  ☑ Spa & Wellness - Full-service spa with massage...
  ☑ Yoga Deck - Dedicated outdoor space for...
  ☐ Meditation Room - Quiet sanctuary for...
  ☑ Hot Tub - Private jacuzzi with...

Views (2 selected)
  ☑ Ocean View - Panoramic views of the...
  ☑ Mountain View - Stunning backdrop of...
  ☐ Sunset View - West-facing for...
```

---

## Technical Notes

### Backward Compatibility
- Existing properties use string arrays (`amenities: string[]`)
- We'll match by slug to the new table
- Hardcoded constants serve as fallback if DB amenity not found

### Performance
- Amenities cached with React Query
- Small dataset (~50 items) loads once per session

### Lucide Icons
- Dynamic icon rendering using the `icons` object from `lucide-react`
- Type-safe with `keyof typeof icons` for icon names
