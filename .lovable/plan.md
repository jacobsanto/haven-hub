

## Plan: Remove Standalone Detail Pages, Route All CTAs to Modals/Booking Flow

### Problem
Clicking "View Villa", "Book Now", or "Explore" links across the site navigates to standalone detail pages (`/properties/:slug`, `/destinations/:slug`, `/experiences/:slug`). The user wants all these to use the modal/booking flow instead, and the standalone detail pages deleted.

### What Changes

#### 1. Delete standalone detail pages
Remove these **routes** from `App.tsx` (keep files for now since admin links reference them):
- `/properties/:slug` → `PropertyDetail.tsx` — **delete route + file**
- `/destinations/:slug` → `DestinationDetail.tsx` — **delete route + file**  
- `/experiences/:slug` → `ExperienceDetail.tsx` — **delete route + file**

#### 2. Fix `VillaDetailModal` booking buttons
Replace `navigate(/properties/${slug})` with `openBooking({ mode: 'direct', property })` using `useBooking` context. Remove `useNavigate`.

#### 3. Update all property links site-wide to open modal instead

| File | Current Behavior | New Behavior |
|------|-----------------|-------------|
| `PropertyCard.tsx` | `<Link to=/properties/${slug}>` wraps card | `onClick` → open `VillaDetailModal` (needs a callback prop or state lift) |
| `QuickBookCard.tsx` | `<Link to=/properties/${slug}>` wraps card | `onClick` → `openBooking({ mode: 'direct', property })` |
| `SearchResultCard.tsx` | `<Link to=/properties/${slug}>` | `onClick` → open modal or booking flow |
| `HeroSliderVariants.tsx` | `<Link to=/properties/${slug}>` "View Villa" | `onClick` → `openBooking({ mode: 'direct', property })` |
| `RecentlyViewedWidget.tsx` | `<Link to=/properties/${slug}>` | `onClick` → open booking flow |
| `PaymentCancelled.tsx` | `<Link to=/properties/${slug}>` "Return to Property" | Navigate to `/properties` listing instead |

#### 4. Update destination links

| File | Current | New |
|------|---------|-----|
| `Destinations.tsx` (modal CTAs) | `<Link to=/destinations/${slug}>` | Open destination modal (already exists in page) |
| `Destinations.tsx` (card CTAs) | `<Link to=/destinations/${slug}>` | Open destination modal |

#### 5. Update experience links

| File | Current | New |
|------|---------|-----|
| `Experiences.tsx` (modal CTAs) | `<Link to=/experiences/${slug}>` | Open experience modal (already exists in page) |
| `LiveExperiencesSection.tsx` | `<Link to=/experiences/${slug}>` | Navigate to `/experiences` page (where modals handle detail view) |

#### 6. Property listing page needs modal state
`Properties.tsx` already uses `VillaDetailModal` via the `VillaCardGrid`/`VillaCardList` `onClick` handlers — these are correct. The issue is `PropertyCard.tsx` (used on homepage) wraps everything in a `<Link>`. Change it to use an `onClick` that opens the villa detail modal or booking flow.

#### 7. Admin links preserved
Admin pages that link to `/properties/${id}/edit` or open in new tab for preview — these are **kept as-is** since they serve admin purposes.

### Files Modified

| File | Action |
|------|--------|
| `src/pages/PropertyDetail.tsx` | **Delete** |
| `src/pages/DestinationDetail.tsx` | **Delete** |
| `src/pages/ExperienceDetail.tsx` | **Delete** |
| `src/App.tsx` | Remove 3 detail routes |
| `src/components/properties/VillaDetailModal.tsx` | Use `openBooking` instead of navigate |
| `src/components/properties/PropertyCard.tsx` | Replace `<Link>` with `onClick` → `openBooking` |
| `src/components/booking/QuickBookCard.tsx` | Replace `<Link>` with `onClick` → `openBooking` |
| `src/components/properties/SearchResultCard.tsx` | Replace `<Link>` with `onClick` → `openBooking` |
| `src/components/home/hero/HeroSliderVariants.tsx` | Replace `<Link>` with `onClick` → `openBooking` |
| `src/components/properties/RecentlyViewedWidget.tsx` | Replace `<Link>` with `onClick` → `openBooking` |
| `src/components/home/LiveExperiencesSection.tsx` | Replace `<Link>` with navigate to `/experiences` |
| `src/pages/Destinations.tsx` | Replace detail page links with modal open actions |
| `src/pages/Experiences.tsx` | Replace detail page links with modal open actions |
| `src/pages/PaymentCancelled.tsx` | Change "Return to Property" to go to `/properties` |

### Key Decisions
- **Property clicks from homepage/cards** → open `openBooking({ mode: 'direct', property })` directly (fastest path to conversion, aligned with direct-booking-first philosophy)
- **Property clicks from listing page** → still open `VillaDetailModal` first (already works this way), then booking from modal uses `openBooking`
- **Destination/Experience detail links** → open their respective modals (already built into those pages)
- **SEO impact**: Detail pages are removed. If SEO is needed later, they can be restored. The user explicitly requested deletion.

