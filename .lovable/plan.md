
# Add Sample Luxury Properties + Admin Feature Management

This plan adds sample luxury properties to populate your listings and confirms the admin backend capabilities for managing property features.

---

## 1. Sample Luxury Properties

We'll add 6 curated luxury properties across desirable destinations:

| Property | Location | Price/Night | Guests | Highlights |
|----------|----------|-------------|--------|------------|
| Villa Amalfi | Positano, Amalfi Coast, Italy | $1,200 | 8 | Ocean view, pool, terrace |
| Santorini Retreat | Oia, Cyclades, Greece | $950 | 6 | Caldera view, hot tub, spa |
| Bali Serenity | Ubud, Bali, Indonesia | $650 | 10 | Jungle view, pool, spa, yoga deck |
| Maldives Overwater | Malé, Maldives | $2,500 | 4 | Private lagoon, glass floor, beach access |
| Provence Manor | Saint-Rémy, Provence, France | $800 | 12 | Vineyard, garden, fireplace, chef kitchen |
| Tuscan Estate | Chianti, Tuscany, Italy | $1,100 | 14 | Wine cellar, olive groves, pool, concierge |

Each property will include:
- Detailed description highlighting luxury features
- Multiple amenities (wifi, pool, spa, concierge, etc.)
- Status set to **active** so they appear immediately
- Placeholder for hero images (you can upload real images via admin)

---

## 2. Property Descriptions

### Villa Amalfi
*"Perched on the cliffs of Positano with panoramic views of the Tyrrhenian Sea, this stunning villa offers the ultimate Mediterranean escape. Featuring hand-painted tiles, infinity pool, and private terrace for unforgettable sunsets."*

### Santorini Retreat
*"Experience the magic of Santorini from this iconic white-washed villa overlooking the caldera. Designed for relaxation with a private hot tub, spa services, and world-class dining steps away."*

### Bali Serenity
*"Nestled in Ubud's lush jungle, this eco-luxury retreat offers tranquility and adventure. Wake to birdsong, practice yoga overlooking rice terraces, and unwind in your private infinity pool."*

### Maldives Overwater
*"Float above crystal-clear waters in this exclusive overwater bungalow. Glass floor panels reveal marine life below, while your private deck offers direct lagoon access for snorkeling and swimming."*

### Provence Manor
*"A beautifully restored 18th-century manor surrounded by lavender fields and vineyards. Perfect for gatherings with a professional kitchen, wine cellar, and endless countryside views."*

### Tuscan Estate
*"Live la dolce vita at this grand estate in the heart of Chianti wine country. Olive groves, cypress-lined drives, and a historic villa with all modern luxuries await."*

---

## 3. Existing Admin Features

Your admin backend already includes a complete property management system:

### Properties List (/admin/properties)
- View all properties in a table format
- Search by name, city, or country
- Status badges (Active, Draft, Archived)
- Quick actions: View, Edit, Delete
- "Add Property" button

### Property Form (/admin/properties/new or /edit)
Already supports:
- **Basic Info**: Name, slug (auto-generated), description
- **Location**: City, region, country
- **Pricing & Capacity**: Price per night, max guests, status
- **Images**: Hero image upload, gallery images (multiple)
- **Amenities**: 25 selectable amenities with checkboxes

All image uploads go to Lovable Cloud storage and are served publicly.

---

## 4. Database Insert

We'll insert the 6 properties directly into the `properties` table:

```sql
INSERT INTO properties (name, slug, description, city, region, country, 
  base_price, max_guests, amenities, status)
VALUES
  ('Villa Amalfi', 'villa-amalfi', '...description...', 
   'Positano', 'Amalfi Coast', 'Italy', 1200, 8, 
   ARRAY['wifi','pool','ocean-view','terrace','air-conditioning','concierge'], 'active'),
  -- 5 more properties...
```

---

## 5. What You'll See After Implementation

### Homepage
- 6 luxury properties displayed in the "Featured Properties" section
- Property cards showing name, location, price, guest capacity, amenities

### Properties Page
- Full grid of all properties with filtering by price and amenities
- Search by location functionality

### Admin Dashboard
- Property count in dashboard stats
- Full management in /admin/properties

---

## 6. Next Steps After Adding Properties

1. **Upload Images**: Visit /admin/properties, click Edit on each property, and upload hero images and gallery photos
2. **Customize Amenities**: Adjust the amenities for each property as needed
3. **Add Availability**: Use /admin/availability to set available dates for bookings

---

## Summary

| Task | Action |
|------|--------|
| Sample properties | Insert 6 luxury properties with descriptions and amenities |
| Status | All set to "active" for immediate visibility |
| Admin features | Already complete - list, add, edit, delete, images, amenities |
| Images | Placeholders initially; upload real images via admin panel |
