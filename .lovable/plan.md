

## Make Properties the Center of Attention

This plan will transform properties into the focal point of the platform by enhancing visual experience, search and discovery, booking flow, property details, and deep cross-linking with destinations and experiences.

---

### Phase 1: Enhanced Visual Experience

**1.1 Full-Screen Hero Gallery with Lightbox**
- Replace current gallery grid with an immersive full-screen hero slider
- Add swipe gestures for mobile navigation
- Include thumbnail navigation strip at the bottom
- Add image counter and navigation arrows

**1.2 Virtual Tour Placeholder**
- Add optional `virtual_tour_url` field to properties table
- Embed support for Matterport, YouTube 360, or similar services
- Display "Take Virtual Tour" button when available

**1.3 Property Video Support**
- Add optional `video_url` field to properties table
- Auto-play hero video (muted) with fallback to image
- Video lightbox for full viewing experience

---

### Phase 2: Search & Discovery Improvements

**2.1 Interactive Map View**
- Add map toggle on properties listing page
- Display property pins with price labels
- Hover/click shows property preview card
- Filter properties by map bounds

**2.2 Property Comparison Tool**
- Allow selecting up to 3 properties for side-by-side comparison
- Compare price, guests, amenities, location
- Sticky comparison bar showing selected properties

**2.3 Smart Recommendations**
- "Similar Properties" section on property detail page
- Based on location, price range, and amenities
- "Recently Viewed" carousel for logged-in users

**2.4 Advanced Filters**
- Add bedroom/bathroom count filters
- Add property type filter (villa, apartment, estate)
- Save favorite searches (for members)

---

### Phase 3: Enhanced Booking Experience

**3.1 Visual Availability Calendar**
- Full-month calendar view showing available/unavailable dates
- Color-coded: green (available), red (booked), gray (blocked)
- Click date range to auto-fill booking widget

**3.2 Dynamic Pricing Display**
- Add `seasonal_rates` table for variable pricing
- Show price variations on calendar hover
- Display "From $X" with tooltip showing rate breakdown

**3.3 Special Offers Section**
- Add optional `special_offer` fields (title, discount, valid_until)
- Highlight badge on property cards when offer is active
- Dedicated "Special Offers" section on property detail

**3.4 Instant Booking Indicator**
- Add `instant_booking` boolean field
- Show lightning bolt icon for instant-bookable properties
- Filter by "Instant Book" on properties page

---

### Phase 4: Richer Property Details

**4.1 Room & Space Breakdown**
- Add `rooms` JSON field for bedrooms, bathrooms, living areas
- Display as visual floor plan summary
- Show bed types (king, queen, twin, sofa bed)

**4.2 Neighborhood & Location Section**
- Add `neighborhood_description` and `nearby_attractions` fields
- Display nearby points of interest with distances
- Embedded map preview (static image or interactive)

**4.3 Property Highlights**
- Add `highlights` array field for key selling points
- Display as icon badges (e.g., "Beachfront", "Chef's Kitchen", "Private Pool")
- Feature on property cards and detail pages

**4.4 House Rules & Policies Expansion**
- Add `house_rules`, `cancellation_policy`, `pet_policy` fields
- Expandable accordion sections on detail page
- Clear check-in/check-out info with icons

---

### Phase 5: Deep Integration with Destinations & Experiences

**5.1 Link Properties to Destinations**
- Add `destination_id` foreign key to properties table
- Auto-display destination info on property pages
- "Explore [Destination]" section with highlights

**5.2 Related Experiences**
- Show experiences available near/at the property
- "Enhance Your Stay" section with bookable experiences
- Filter by property's destination

**5.3 Similar Properties Section**
- "Other Properties in [Destination]" carousel
- Exclude current property from results
- Link to full destination property listing

**5.4 Cross-Navigation**
- Breadcrumb: Home > Destinations > [Destination] > [Property]
- "Back to [Destination]" link on property pages
- Property count on destination cards

---

### Database Changes Required

```text
ALTER TABLE properties ADD COLUMN
  - destination_id UUID REFERENCES destinations(id)
  - video_url TEXT
  - virtual_tour_url TEXT
  - instant_booking BOOLEAN DEFAULT false
  - highlights TEXT[] DEFAULT '{}'
  - rooms JSONB DEFAULT '[]'
  - neighborhood_description TEXT
  - nearby_attractions JSONB DEFAULT '[]'
  - house_rules TEXT[] DEFAULT '{}'
  - cancellation_policy TEXT
  - pet_policy TEXT
  - bedrooms INTEGER DEFAULT 1
  - bathrooms NUMERIC DEFAULT 1
  - property_type TEXT DEFAULT 'villa'

CREATE TABLE seasonal_rates
  - id UUID PRIMARY KEY
  - property_id UUID REFERENCES properties(id)
  - name TEXT (e.g., "Peak Season", "Summer")
  - start_date DATE
  - end_date DATE
  - price_multiplier NUMERIC DEFAULT 1.0
  - nightly_rate NUMERIC

CREATE TABLE special_offers
  - id UUID PRIMARY KEY
  - property_id UUID REFERENCES properties(id)
  - title TEXT
  - description TEXT
  - discount_percent INTEGER
  - valid_from DATE
  - valid_until DATE
  - is_active BOOLEAN DEFAULT true
```

---

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `PropertyHeroSlider` | Full-screen image/video carousel |
| `AvailabilityCalendar` | Visual date picker with availability |
| `PropertyMap` | Interactive map for single property |
| `PropertiesMapView` | Map view for properties listing |
| `PropertyComparison` | Side-by-side comparison modal |
| `SimilarProperties` | Carousel of related properties |
| `RelatedExperiences` | Experiences near the property |
| `RoomBreakdown` | Visual room/bed layout |
| `NeighborhoodInfo` | Location details and attractions |
| `SpecialOfferBadge` | Promotional offer indicator |
| `PropertyHighlights` | Key features badges |

---

### Updated Admin Interface

- Extend property form with new fields:
  - Destination selector dropdown
  - Video URL input
  - Virtual tour URL input
  - Room configuration builder
  - Highlights multi-select
  - Neighborhood description editor
  - Nearby attractions manager
  - House rules list
  - Cancellation policy selector
  - Pet policy options
  - Instant booking toggle

- New admin pages:
  - Seasonal Rates management
  - Special Offers management

---

### Implementation Priority

1. **Database schema updates** - Foundation for all features
2. **Destination linking** - Connect properties to destinations
3. **Enhanced property detail page** - Room breakdown, highlights, neighborhood
4. **Visual availability calendar** - Better booking UX
5. **Map view for properties listing** - Improved discovery
6. **Related experiences section** - Cross-linking
7. **Similar properties carousel** - Engagement
8. **Advanced filters** - Better search
9. **Property comparison tool** - Decision support
10. **Video/virtual tour support** - Premium experience
11. **Seasonal rates & special offers** - Dynamic pricing
12. **Recently viewed** - Personalization

---

### Technical Notes

- All new database columns will have appropriate RLS policies inherited from the properties table
- Map integration will use a lightweight solution (static maps initially, interactive as enhancement)
- Video support will use native HTML5 video with YouTube/Vimeo embed fallback
- Room configuration uses JSONB for flexibility without additional tables
- Seasonal rates table enables date-based price calculations server-side

