

# Homepage Redesign — Traivels-Inspired Layout

This is a significant visual overhaul of the homepage and card components, adopting the clean, modern editorial style from the reference while keeping your existing color system (navy primary, gold accent, pale blue secondary) and all existing data hooks.

## What Changes

### 1. Hero Section (`HeroSection.tsx`) — Restyle
- Keep the rotating 4-property background slider with cross-fade transitions
- Change heading style to large **italic serif** text (like "Discover Your Perfect Getaway with Ease") — use the active property's tagline or a CMS-driven heading
- Add a **search form overlay** at the bottom-left: "Find Your Dream Destination" card with destination input, date range, and guest count (connects to existing `SearchBar` / booking flow)
- Add a **"Popular Country" widget** next to the search form showing featured destinations as pill buttons
- Remove the portrait card slider on desktop (replaced by the search form as the interactive element)
- Keep dot indicators + swipe on mobile, hide search form overlay on mobile (show simplified version)

### 2. Trust Section (New: `TrustSection.tsx`)
Replace `EnjoySection` with a "Your Trusted Partner in Finding the Perfect Vacation Rental Experience" section:
- Large serif heading on the left
- Right side: 2 image blocks with text overlays ("Handpicked Properties", "Unique Experiences")
- Below: 2 feature cards with icons ("Seamless Booking Process", "24/7 Customer Support")
- Data comes from existing `usePageContent('home', 'trust', {...})` with fallback defaults

### 3. Destinations Section (New: `DestinationsShowcase.tsx`)
Replace or add between existing sections:
- Heading: "Discover the World's Most Captivating Places"
- Horizontal scrollable cards showing destinations from `useActiveDestinations()`
- Each card: landscape image, location pin, destination name, "Show Detail" button with dot pagination
- Cards have a rounded style with colored accent badges

### 4. Properties Section — Redesign `DiscoverVillasSection.tsx`
- New heading: "Find Your Perfect Home with Ease" with "See All" link
- Horizontal row of 4 property cards (new compact card design)
- Card design: Image top, location pin + city, property name, short description, price, "Booking Now" button
- Uses existing `useFeaturedProperties()` hook

### 5. Property Card Component (`PropertyCard.tsx`) — New Variant
Add a `variant="compact"` mode:
- Cleaner layout matching the reference: image → location tag → name → description → price + CTA row
- Location shown as a small pill with pin icon at the top of the content area
- "Booking Now" button in accent/primary color
- Keep the existing full card as default variant

### 6. Features Section (New: `FeaturesSection.tsx`)
"Crafting Memorable Stays and Hassle-Free Travel":
- Left column: heading + 2 feature items with images (Curated Vacation Rentals, Flexible Payment Options)
- Right column: 2 accent-colored feature cards ("Local Guides", "Customer Service") with arrow icons
- All CMS-driven via `usePageContent`

### 7. Featured Vacation Section (New: `FeaturedVacationSection.tsx`)
- Small heading with icon: "Featured Vacation"
- Description text + "See All Vacations" button
- 3 property cards with pricing overlay ("Starting from $100")
- Uses `useFeaturedProperties()` filtered differently or same data

### 8. Testimonials Section — Restyle `TestimonialsSection.tsx`
- New heading: "Real Stories from Happy Travelers"
- Left side: large testimonial quote with author name in accent color + dot pagination
- Right side: photo grid mosaic (3x3 or similar) using property/destination images
- Keep existing testimonial data structure

### 9. Experience Card (`ExperienceCard.tsx`) — Restyle
- Match the cleaner card aesthetic: rounded image, category pill, name, description, price/duration row
- Keep existing data structure, just visual refresh

## Files to Create
- `src/components/home/TrustSection.tsx`
- `src/components/home/DestinationsShowcase.tsx`
- `src/components/home/FeaturesSection.tsx`
- `src/components/home/FeaturedVacationSection.tsx`
- `src/components/home/HeroSearchForm.tsx`

## Files to Modify
- `src/components/home/HeroSection.tsx` — restyle heading, add search overlay
- `src/components/home/DiscoverVillasSection.tsx` — new heading/layout
- `src/components/home/TestimonialsSection.tsx` — new layout with photo grid
- `src/components/properties/PropertyCard.tsx` — add compact variant
- `src/components/experiences/ExperienceCard.tsx` — visual refresh
- `src/pages/Index.tsx` — new section ordering

## What Stays the Same
- All data hooks (properties, destinations, experiences, testimonials)
- Color system (navy, gold, pale blue semantic tokens)
- Header/Footer components
- Booking flow and business logic
- Admin CMS integration via `usePageContent`

## New Index.tsx Section Order
```text
1. HeroSection (with search form overlay)
2. TrustSection ("Your Trusted Partner...")
3. DestinationsShowcase ("Discover the World's...")
4. DiscoverVillasSection ("Find Your Perfect Home...")
5. FeaturesSection ("Crafting Memorable Stays...")
6. FeaturedVacationSection
7. LiveExperiencesSection (kept as-is, minor restyle)
8. TestimonialsSection (restyled)
```

