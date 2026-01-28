
# Harmonizing Blog Article Layouts - Responsive & Consistent Styling

## Current Issues Identified

After reviewing all three layouts against the website's design system, here are the key inconsistencies:

| Issue | DestinationGuide | Lifestyle | TravelTips |
|-------|------------------|-----------|------------|
| Hero approach | 35-40vh parallax | Split grid (unrelated to site) | No hero (too minimal) |
| Back button style | Rounded pill on hero | Text link with arrow | Text link with arrow |
| Category badge | `variant="secondary"` | `variant="outline"` with custom border | Custom bg-primary/10 |
| Title typography | `font-serif` | `font-serif` | `font-bold` (inconsistent) |
| Author avatar size | 8x8 | 10x10 | 7x7 |
| Share buttons | Floating sidebar | Floating sidebar | Share button in header |
| Section padding | `py-12 md:py-16` | `py-12 md:py-16` | `py-10 md:py-14` |
| Related posts title | "Continue Your Journey" | "More to Explore" | "More Tips & Guides" |
| Reading progress | Yes | Yes | Yes |
| Mobile TOC | Yes (drawer) | No | No |

## Website Design System Reference

Based on `index.css`, `tailwind.config.ts`, and component analysis:

| Element | Pattern |
|---------|---------|
| Border radius | `rounded-2xl` for cards, `rounded-xl` for smaller |
| Shadows | `shadow-organic` or `shadow-xl` |
| Section headings | `font-serif font-medium` |
| Badge style | `variant="secondary"` |
| Button style | `rounded-full` |
| Container padding | `py-16 md:py-20` or `py-24` |
| Muted backgrounds | `bg-muted/30` or `bg-secondary/30` |
| Card style | `bg-card border border-border` or `card-organic` class |

---

## Proposed Harmonization

### 1. Unified Hero Pattern
Create a consistent hero approach across all layouts with slight variations:

```text
ALL LAYOUTS HERO STRUCTURE:
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Blog (same style for all)                        │
│                                                             │
│  [HERO IMAGE - 35vh for all, optional parallax]            │
│  or [Gradient placeholder if no image]                     │
│                                                             │
│  HEADER CARD (lifted, same card style)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Badge: secondary variant]                         │   │
│  │  Title (font-serif font-medium for all)             │   │
│  │  Excerpt (if available)                             │   │
│  │  Author • Date • Read Time                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Layout-specific variations:**
- **Destination Guide**: Full-width hero with subtle parallax, sticky Table of Contents sidebar
- **Lifestyle**: Split hero grid (image 50% / content 50%) but with matching card styling
- **Travel Tips**: Compact hero (25vh) with "At a Glance" summary card positioned below

### 2. Consistent Component Styling

**Back Button (all layouts):**
```tsx
<Link
  to="/blog"
  className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
             bg-background/80 backdrop-blur-sm text-foreground text-sm 
             font-medium hover:bg-background transition-colors"
>
  <ArrowLeft className="h-4 w-4" />
  Back to Blog
</Link>
```

**Category Badge (all layouts):**
```tsx
<Badge variant="secondary" className="mb-4">
  {post.category.name}
</Badge>
```

**Title (all layouts):**
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium 
               text-foreground mb-6 leading-tight">
```

**Author Section (all layouts - consistent sizing):**
```tsx
<Avatar className="h-8 w-8 border border-border">
// Same avatar size, same fallback styling
```

**Meta Information (all layouts):**
```tsx
<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
  <span className="flex items-center gap-1">
    <Calendar className="h-4 w-4" />
    {format(publishedDate, 'MMMM d, yyyy')}
  </span>
  <span className="hidden sm:inline text-border">•</span>
  <span className="flex items-center gap-1">
    <Clock className="h-4 w-4" />
    {readTime} min read
  </span>
</div>
```

### 3. Content Area Standardization

**All layouts use consistent content width:**
```tsx
<article className="max-w-3xl mx-auto">
  // Content here
</article>
```

**Consistent prose styling:**
```tsx
<div className="prose prose-lg dark:prose-invert max-w-none 
                prose-headings:font-serif prose-headings:font-medium 
                prose-headings:text-foreground prose-p:text-muted-foreground 
                prose-a:text-primary prose-strong:text-foreground">
```

### 4. Footer Sections Standardization

**Tags section (all layouts):**
```tsx
<div className="mt-12 pt-8 border-t border-border">
  <div className="flex items-center gap-2 flex-wrap">
    <Tag className="h-4 w-4 text-muted-foreground" />
    {post.tags.map((tag) => (
      <Badge key={tag} variant="outline" className="text-sm">
        {tag}
      </Badge>
    ))}
  </div>
</div>
```

**Share section (all layouts):**
```tsx
<div className="mt-8 pt-8 border-t border-border">
  <p className="text-sm text-muted-foreground mb-4">Share this article:</p>
  <SocialShareButtons title={post.title} />
</div>
```

**Related posts section (all layouts):**
```tsx
<section className="py-16 md:py-20 bg-muted/30">
  <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground">
    You May Also Enjoy
  </h2>
  // Grid of BlogPostCard components
</section>
```

### 5. Mobile Responsiveness Improvements

**Lifestyle Layout Mobile:**
- Stack hero (image on top, text below) instead of side-by-side
- Reduce image aspect ratio for mobile

**Travel Tips Layout Mobile:**
- At a Glance card becomes sticky on scroll
- Collapsible sections for long tip lists

**All Layouts:**
- Mobile Table of Contents drawer (floating button bottom-right)
- Floating share bar replaced with inline share on mobile
- Consistent touch targets (min 44x44px)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/blog/layouts/DestinationGuideLayout.tsx` | Standardize badge, title, author styling; consistent related posts section |
| `src/components/blog/layouts/LifestyleLayout.tsx` | Add hero image for consistency, standardize all component styles, add mobile TOC support |
| `src/components/blog/layouts/TravelTipsLayout.tsx` | Add compact hero, change title to `font-serif font-medium`, add floating share bar, mobile TOC |
| `src/components/blog/AtAGlanceCard.tsx` | Align styling with website card patterns (use `card-organic` or consistent border/shadow) |

---

## Specific Changes Per Layout

### DestinationGuideLayout.tsx
- Change back button from overlay pill to consistent styled link
- Keep parallax hero (differentiator)
- Standardize related posts title

### LifestyleLayout.tsx
- Keep split hero concept but ensure styling matches website cards
- Add `FloatingShareBar` support
- Add `MobileTableOfContents` support
- Standardize badge to `variant="secondary"`
- Change title from `font-serif` to `font-serif font-medium`
- Standardize related posts section

### TravelTipsLayout.tsx
- Add compact hero image (25vh) or gradient background
- Remove separate Share button in header (use FloatingShareBar)
- Change title from `font-bold` to `font-serif font-medium`
- Add FloatingShareBar and MobileTableOfContents
- Standardize badge styling
- Improve AtAGlanceCard with `card-organic` styling

---

## Visual Consistency Summary

After changes, all three layouts will share:

| Element | Unified Style |
|---------|---------------|
| Back button | Rounded pill with backdrop blur |
| Category badge | `variant="secondary"` |
| Title | `font-serif font-medium`, same sizes |
| Author avatar | 8x8, consistent border |
| Date format | "MMMM d, yyyy" |
| Content width | `max-w-3xl mx-auto` |
| Section padding | `py-12 md:py-16` |
| Tags section | Same border-t style |
| Share section | Same border-t style |
| Related posts | Same bg-muted/30 section, same grid |
| Mobile TOC | All layouts support drawer |
| Floating share | All layouts on desktop |

**Differentiators retained:**
- Destination Guide: Parallax hero, sticky sidebar TOC
- Lifestyle: Split hero grid, no drop caps
- Travel Tips: At a Glance card, numbered sections
