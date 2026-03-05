

# Properties & Experiences Page Redesign

Based on the reference images (Traivels property listing & experiences pages), here's the redesign plan matching that editorial card style while keeping your semantic color system.

## Properties Page (`src/pages/Properties.tsx`)

### Layout Changes
- **3-column layout on desktop**: Left sidebar filters (always visible, not Sheet), center 2-column card grid, right map placeholder
- **Mobile**: Filters stay in Sheet drawer, full-width card grid
- Simplify header — remove the hero-gradient background, use a clean white header with just the search bar

### Sidebar Filters (visible on `lg+`)
- Render `FilterContent` directly in a left column (`w-64 hidden lg:block`) with sticky positioning
- Keep Sheet for mobile/tablet
- Add section headers: "Property Types", "Furniture" (bedrooms/bathrooms), "Curtains" (amenities), "Vacations", "Values" (price), "Types"
- Add a green "Search & Find" CTA button at bottom of filters

### Property Card Redesign (`QuickBookCard.tsx`)
Match the reference card layout:
- Landscape image with rounded corners
- Below image: **star rating row + price** on same line (use accent color for price)
- Property name (bold, serif)
- Short description (2-line clamp, muted text)
- Bottom row: 4 small amenity icon circles + **"Start Date →"** CTA button (primary/accent colored, rounded-full)
- Remove the hover overlay with "Instant Book" — keep it simple
- Remove property type badge from image corner

### Map Placeholder (right column)
- Show a styled placeholder div on `xl+` screens with a map icon and "Map coming soon" or embed a static image

## Experiences Page (`src/pages/Experiences.tsx`)

### Hero Section
- Replace the gradient hero with a **full-width landscape image banner** (use first featured experience's hero image or a fallback)
- No text overlay on the image — just the image itself, edge-to-edge

### Content Section
- Large uppercase heading: "CURATED LOCAL EXPERIENCES" with description paragraph below
- Category filters as inline pills (keep existing)

### Experience Card Redesign (`ExperienceCard.tsx`)
Match reference — **horizontal card layout** (image left, content right):
- Image: `w-[200px]` rounded, square aspect ratio
- Right side: Experience name (uppercase, bold), price in accent color, description (3-line clamp), calendar icon + "Book Now" green CTA button
- Grid: 2 columns on desktop, 1 on mobile
- Remove the vertical card layout entirely

### CTA Section
- Keep the "Complete Your Trip" CTA card at the bottom, restyle to match cleaner aesthetic

## Files to Modify
1. **`src/pages/Properties.tsx`** — 3-column layout with inline sidebar filters
2. **`src/components/booking/QuickBookCard.tsx`** — New card design matching reference
3. **`src/pages/Experiences.tsx`** — Image banner hero, uppercase heading, horizontal card grid
4. **`src/components/experiences/ExperienceCard.tsx`** — Horizontal layout with image-left content-right

## What Stays the Same
- All data hooks, search params, filter logic
- Booking flow integration
- SEO components
- Color tokens (semantic system)
- SearchResultCard for list view (date-search mode)

