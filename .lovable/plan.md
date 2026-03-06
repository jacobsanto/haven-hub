

# Implement Reference Design Across All Pages (Semantic Token Architecture)

## What the user wants
Apply the dark cinematic "Slider 6" design aesthetic from the 7 uploaded reference files (Homepage, Villas, Destinations, Experiences, Journal, About, FAQ, Booking) to the existing pages — without hardcoding any colors/fonts. Everything must remain connected to the admin dashboard's brand settings via semantic CSS tokens.

## Key constraint: NO hardcoded values
The reference files use hardcoded CSS variables (`--bg: #0a0a0f`, `--sand: #d4a574`, `fontFamily:'var(--serif)'`). We will **not** copy these. Instead, every color/font maps to existing semantic tokens:

```text
Reference variable  →  Semantic token
──────────────────────────────────────
--bg / --bg2        →  bg-background / bg-muted
--card              →  bg-card
--line              →  border-border
--text              →  text-foreground
--text-mid          →  text-muted-foreground
--text-dim          →  text-muted-foreground/60
--sand              →  text-accent
--warm              →  text-accent (italic emphasis)
--coral             →  text-destructive (category badges)
--serif             →  font-serif (from --font-serif)
--sans              →  font-sans (from --font-sans)
```

## Hero section: NOT touched
The hero section mechanics, slider variants, and admin hero style selector remain exactly as-is. Only the surrounding page sections get redesigned.

## Scope: Pages to redesign

### Phase 1: Homepage sections (already partially done)
Current homepage sections already use semantic tokens and match the reference layout. Minor refinements only:
- **SearchBarOverlay**: Already refactored — no changes needed
- **TrustSection**: Already matches — no changes
- **DestinationsShowcase**: Already matches — no changes
- **DiscoverVillasSection**: Already matches — no changes
- **LiveExperiencesSection**: Already matches — no changes
- **TestimonialsSection**: Already matches — no changes
- **WhyDirectSection**: Already matches — no changes
- **CTASection**: Already matches — no changes

### Phase 2: Properties/Villas page (`src/pages/Properties.tsx`)
Redesign to match reference `Arivia_Villas.jsx`:
- **Hero banner**: Ambient blurred background image, centered heading with stats counters (total villas, destinations, avg rating)
- **Sticky filter bar**: Dark glass-morphism bar with search input, destination/price/guest selects, sort, grid/list toggle
- **Villa cards (grid view)**: Image with gradient overlay, hover lift + scale, instant booking badge, heart favorite, tag pills
- **Villa cards (list view)**: Horizontal layout with image left, details right
- **Detail modal/expand**: Quick-view with image gallery, amenity grid, highlights, booking CTA
- All using semantic tokens (`bg-card`, `border-border`, `text-foreground`, `text-accent`, etc.)

### Phase 3: Destinations page (`src/pages/Destinations.tsx` + `src/pages/DestinationDetail.tsx`)
Redesign to match reference `Arivia_Destinations.jsx`:
- **Hero**: Centered heading with subtitle, stat counters
- **Destination cards**: Large hero image with gradient overlay, weather widget overlay, highlight icons, villa count badge
- **Detail page**: Full-width hero with parallax, highlights grid, weather panel, featured villas carousel, map placeholder

### Phase 4: Experiences page (`src/pages/Experiences.tsx` + `src/pages/ExperienceDetail.tsx`)
Redesign to match reference `Arivia_Experiences.jsx`:
- **Category filter tabs**: Horizontal scrollable category pills with icons
- **Experience cards**: Image top, category badge, duration/price/guests meta row, difficulty indicator
- **Detail view**: Split layout — image gallery left, booking panel right, includes list, related experiences

### Phase 5: Blog/Journal page (`src/pages/Blog.tsx` + `src/pages/BlogPost.tsx`)
Redesign to match reference `Arivia_Journal.jsx`:
- **Featured post**: Large hero card with category badge, reading time, author avatar
- **Post grid**: 3-column grid with image cards, hover lift
- **Category filter**: Horizontal pill tabs
- **Blog post detail**: Editorial layout with reading progress bar, author bio, share buttons

### Phase 6: About page (`src/pages/About.tsx`)
Redesign to match reference `Arivia_About.jsx`:
- **Hero**: Full-width image with centered text overlay
- **Story section**: Split layout — text left, image right
- **Timeline**: Vertical timeline with milestone dots
- **Team grid**: Photo cards with hover bio reveal
- **Values section**: Icon cards in grid
- **Stats bar**: Horizontal counters

### Phase 7: FAQ page (new page or update existing)
Based on reference `Arivia_FAQ.jsx`:
- **Search bar**: Prominent search input
- **Category tabs**: Horizontal filter pills
- **Accordion FAQ items**: Expandable cards with category icons
- **Popular questions**: Highlighted section
- **Contact CTA**: Bottom section with contact options

### Phase 8: Footer redesign (`src/components/layout/Footer.tsx`)
Match reference footer style:
- Dark background using `bg-foreground text-background` (already in place)
- 4-column grid: Brand + newsletter, Explore links, Company links, Support links
- Social icon circles with hover accent border
- Bottom bar with copyright + tagline
- Keep existing newsletter subscription logic and dynamic nav links from admin

## Technical approach

### What stays the same
- All data fetching hooks (useProperties, useDestinations, useExperiences, useBlogPosts, etc.)
- All service layer code
- Admin dashboard and settings
- Hero section mechanics and slider variants
- BrandContext theme pipeline
- All semantic CSS tokens and their admin connectivity

### What changes
- Page component JSX/layout (visual structure)
- Tailwind classes on page components
- Some new reusable UI patterns (stat counters, category pills, hero banners)
- Possible new shared components: `PageHeroBanner`, `CategoryFilterTabs`, `StatCounter`

### Shared patterns to extract
From the reference files, several UI patterns repeat across pages:
1. **Page hero banner**: Blurred ambient background, centered title with accent `<em>`, subtitle, stat counters
2. **Category filter tabs**: Horizontal scrollable pills with active state
3. **Section header**: Uppercase tracking label + serif heading with italic accent word
4. **Card hover**: translateY(-4px) + border-accent transition

These will be created as reusable components in `src/components/ui/` to avoid duplication.

## File changes summary

| File | Action |
|---|---|
| `src/components/ui/PageHeroBanner.tsx` | Create — shared hero banner component |
| `src/components/ui/CategoryFilterTabs.tsx` | Create — shared category filter |
| `src/components/ui/StatCounter.tsx` | Create — stat counter row |
| `src/pages/Properties.tsx` | Redesign — match Villas reference |
| `src/pages/Destinations.tsx` | Redesign — match Destinations reference |
| `src/pages/DestinationDetail.tsx` | Redesign — match detail reference |
| `src/pages/Experiences.tsx` | Redesign — match Experiences reference |
| `src/pages/ExperienceDetail.tsx` | Redesign — match detail reference |
| `src/pages/Blog.tsx` | Redesign — match Journal reference |
| `src/pages/BlogPost.tsx` | Redesign — match article reference |
| `src/pages/About.tsx` | Redesign — match About reference |
| `src/pages/Contact.tsx` | Redesign — match FAQ/Contact reference |
| `src/components/layout/Footer.tsx` | Restyle to match reference footer |
| `src/components/properties/PropertyCard.tsx` | Restyle card design |
| `src/components/properties/SearchResultCard.tsx` | Restyle for list view |
| `src/components/destinations/DestinationCard.tsx` | Restyle card design |
| `src/components/experiences/ExperienceCard.tsx` | Restyle card design |
| `src/components/blog/BlogPostCard.tsx` | Restyle card design |

## Implementation order
Due to the large scope, this should be done in phases. I recommend starting with:
1. Shared components (PageHeroBanner, CategoryFilterTabs, StatCounter)
2. Properties page (most complex, sets the pattern)
3. Then remaining pages in order

Total estimated: ~18 files modified/created. All using semantic tokens, zero hardcoded values.

