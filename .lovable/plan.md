

## Plan: Redesign About, Blog, Destinations, Experiences Pages + Create FAQ Page + Redesign Booking Flow

This is a large-scale visual redesign applying the uploaded Arivia reference designs to 6 existing pages and creating 1 new page, all using semantic tokens instead of hardcoded colors.

### Scope

| Page | Action | Reference File |
|------|--------|---------------|
| About (`/about`) | **Rewrite** | `Arivia_About-2.jsx` |
| Destinations (`/destinations`) | **Rewrite** | `Arivia_Destinations-2.jsx` |
| Experiences (`/experiences`) | **Rewrite** | `Arivia_Experiences-2.jsx` |
| Blog (`/blog`) | **Rewrite** | `Arivia_Journal-2.jsx` |
| FAQ (`/faq`) | **New page** | `Arivia_FAQ-2.jsx` |
| Checkout (`/checkout`) | **Restyle** | `Arivia_Booking-2.jsx` |

### Color Mapping (Same as Properties page)

All `var(--sand)` → `text-accent`, `var(--bg)` → `bg-background`, `var(--card)` → `bg-card`, `var(--line)` → `border-border`, `var(--text)` → `text-foreground`, `var(--text-mid)` → `text-muted-foreground`, `var(--text-dim)` → `text-muted-foreground/60`, `var(--sea)` → `text-emerald-500`, `var(--coral)` → `text-destructive`.

### 1. About Page (`src/pages/About.tsx`)

Rewrite to match the reference layout:
- **Hero**: Full-bleed image with gradient overlay, centered "Our Story" label + serif heading + subtitle
- **Origin Story**: 2-column grid (text left, 4:5 image right) with floating stat card and quote card
- **Stats Bar**: 6-column stat counters (pulls from dynamic data where possible — property count, destination count, etc.)
- **Values Section**: 2x2 grid of value cards with icon boxes, sourced from `usePageContent`
- **87-Point Inspection**: Alternating image/text split with checklist items
- **Team Section**: 3-column grid of team cards with hover-reveal bios (pulls from `usePageContent` for editability)
- **Timeline**: Vertical timeline with dot markers and card content
- **Press/As Seen In**: 4-column press quote cards
- **Contact CTA**: Split layout with contact methods + "Talk to a Human" image card

All data pulls from existing `usePageContent` hook. Team/timeline data from page content or hardcoded initially with admin editability path.

### 2. Destinations Page (`src/pages/Destinations.tsx`)

Rewrite to match the reference:
- **Hero**: Ambient blurred background with stats (destination count, villa count, avg rating)
- **Destination Cards**: Large alternating 55/45 split cards (image left on even, right on odd) with hover scale, gallery thumbnails, weather pill, highlights grid, and CTA buttons
- **Destination Detail Modal**: Full overlay with image gallery, weather grid, highlights, description, and CTA to view villas
- **Map Section**: Horizontal destination pills with thumbnails acting as visual "map"
- **CTA**: "We're Always Expanding" concierge CTA

Data from existing `useActiveDestinations` + `useProperties` hooks. The `DestinationCard` component is replaced with the new alternating split card design.

### 3. Experiences Page (`src/pages/Experiences.tsx`)

Rewrite to match the reference:
- **Hero**: Ambient blurred background with coral accent label
- **Sticky Filter Bar**: Category pills (with icons) + search input + result count
- **Experience Cards**: Grid cards with 16:10 aspect image, difficulty badge, price pill, icon circle overlapping image/body, location label, rating + review count, duration + max guests
- **Experience Detail Modal**: Full overlay with gallery, icon + title header, meta row (duration, guests, rating, season), long description, "What's Included" checklist grid, CTA
- **Custom Experience CTA**: Coral-accented card

Data from existing `useActiveExperiences` hook. The `ExperienceCard` component is replaced.

### 4. Blog/Journal Page (`src/pages/Blog.tsx`)

Rewrite to match the reference:
- **Featured Hero**: Full-bleed featured post image (70vh) with overlay content — badges, title, excerpt, author avatar + date + read time. Clicking navigates to the blog post page.
- **Sticky Filter Bar**: Category pill tabs + search input
- **Post Grid**: 3-column card grid with hover lift, 16:10 image, category badge, serif title, excerpt (3-line clamp), author avatar + name, date + read time
- **Newsletter Section**: Centered section with email input

Data from existing `useBlogPosts`, `useFeaturedBlogPost`, `useBlogCategories` hooks. The individual BlogPost page (`/blog/:slug`) is NOT changed — only the listing page.

### 5. FAQ Page (NEW — `src/pages/FAQ.tsx`)

Create new page at `/faq`:
- **Hero**: Ambient blurred background with search input, result count
- **Popular Questions**: Grid of most-asked question buttons (highlighted when open)
- **Category Tabs**: Pill tab bar with icons and counts per category
- **FAQ Accordion**: Expandable items with category color dots, search highlighting, chevron animation, category badge in answer
- **Still Need Help**: 3-column contact cards (Live Chat, Email, Call) with colored icon circles
- **Quick Links**: Horizontal pill links to policies

FAQ data will be stored in the database. Create a `faqs` table with columns: `id`, `category`, `question`, `answer`, `is_popular`, `sort_order`, `created_at`. Also create a `faq_categories` table: `id`, `name`, `slug`, `icon`, `color_token`, `sort_order`. Both with RLS for public read, admin write.

### 6. Checkout Page Restyle (`src/pages/Checkout.tsx`)

Adapt the booking flow's visual language from the reference:
- **Progress Stepper**: Circle icons with connecting lines (done = emerald, active = accent, future = muted)
- **Sidebar**: Sticky villa preview card with image, location, rating, date summary, price breakdown, cancellation policy
- **Step layouts**: Each step uses serif headings with italic accent, card-based form sections with semantic borders
- **Confirmation (Step 5)**: Confetti animation, success checkmark, booking reference card, villa summary with stay grid, "What Happens Next" cards, host card, action buttons

The checkout already uses Stripe for actual payment — the visual restyle wraps around the existing payment logic. No changes to payment processing, hold logic, or booking engine.

### Database Changes

**New `faqs` table:**
```sql
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  question text NOT NULL,
  answer text NOT NULL,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

### Routing

Add to `App.tsx`:
```tsx
const FAQ = React.lazy(() => import("./pages/FAQ"));
// ...
<Route path="/faq" element={<FAQ />} />
```

### Files Summary

| File | Action |
|------|--------|
| `src/pages/About.tsx` | Rewrite |
| `src/pages/Destinations.tsx` | Rewrite |
| `src/pages/Experiences.tsx` | Rewrite |
| `src/pages/Blog.tsx` | Rewrite |
| `src/pages/FAQ.tsx` | New |
| `src/pages/Checkout.tsx` | Restyle |
| `src/App.tsx` | Add FAQ route |
| `src/components/destinations/DestinationCard.tsx` | Keep (used by homepage sections) |
| `src/components/experiences/ExperienceCard.tsx` | Keep (used by homepage sections) |

### Implementation Order

Due to the size, this will be implemented in sequence:
1. FAQ page (new, no conflicts) + DB migration
2. About page rewrite
3. Destinations page rewrite
4. Experiences page rewrite
5. Blog page rewrite
6. Checkout restyle
7. Add FAQ route to App.tsx

