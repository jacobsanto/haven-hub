

# Add Essentials Amenities Block

## What Changes

Insert 10 new amenities into the `amenities` table under the "Essentials" category, covering basic guest expectations that are currently missing.

## Amenities to Add

| Slug | Name | Icon | Category |
|------|------|------|----------|
| `tv` | Smart TV | `Tv` | Essentials |
| `hair-dryer` | Hair Dryer | `Wind` | Essentials |
| `iron` | Iron & Ironing Board | `Shirt` | Essentials |
| `safe` | In-Room Safe | `Lock` | Essentials |
| `coffee-maker` | Coffee Maker | `Coffee` | Essentials |
| `microwave` | Microwave | `Microwave` | Essentials |
| `oven` | Oven | `CookingPot` | Essentials |
| `towels-linens` | Towels & Linens | `BedDouble` | Essentials |
| `elevator` | Elevator / Lift | `ArrowUpDown` | Essentials |
| `minibar` | Minibar | `Wine` | Essentials |

## Technical Details

- Single SQL INSERT into the `amenities` table using the data insert tool (not a migration -- this is data, not schema)
- All amenities set to `is_active = true` by default
- Each includes a short description for tooltip display on the property page
- Icons use existing Lucide icon names already supported by the `AmenityList` component
- No code changes required -- the existing amenity system will automatically pick these up

## Files Changed

None -- data insert only.

