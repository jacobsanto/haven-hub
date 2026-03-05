

# About Page Redesign — Traivels Reference

Redesign the About page to match the Traivels reference layout: hero with large italic serif text over a landscape image, two-column story + values layout, team grid, mission section with CTA cards, testimonial carousel, and an inline contact form.

## Layout Structure (top to bottom)

### 1. Hero Banner
- Full-width landscape image with dark gradient overlay
- Large italic serif heading: "Our Story: Bridging the World, One Unforgettable Stay at a Time."
- Left-aligned text (not centered), matching reference style
- Keep existing `heroContent` CMS hook

### 2. Story + Values (2-column side by side)
- **Left column**: "Meet the Global Explorers Behind {brandName}" heading + story paragraphs from `storyContent`
- **Right column**: "Our Values" heading + 3 value cards in a row (icon in rounded square, title, short description below first card)
- Values use existing `valuesContent` hook — show only 3 values to match reference grid

### 3. Team + Mission (2-column)
- **Left column**: 6 team member avatar circles in a 3x2 grid with name + role below each. Use placeholder avatar images (Unsplash headshots) since no team table exists — make them static/CMS-ready
- **Right column**: "Our Mission" heading + mission text paragraphs. Below: 2 CTA cards side by side — "Customer Service" (accent bg) and "Local Guides" (outline) with arrow icons

### 4. Mission + Contact (2-column)
- **Left column**: "Our Mission" sub-section with a small testimonial carousel (2-3 cards with star ratings)
- **Right column**: "Get in Touch" with email + phone info, plus an inline contact form (Name, Email, Message, "Connect with Us" button). Reuse the existing `ContactForm` logic but render a simplified inline version

### 5. Remove old sections
- Remove the Statistics dark bar section
- Remove the "Direct Booking Benefits" / TrustBadges section
- Remove the standalone CTA section at the bottom
- These are replaced by the integrated mission/contact layout

## Files to Modify
- **`src/pages/About.tsx`** — Complete restructure with the new layout sections

## What Stays
- All `usePageContent` hooks and CMS integration
- `useBrand` for brandName substitution
- `PageLayout`, `PageSEO`
- Color system (semantic tokens)
- Framer Motion animations

