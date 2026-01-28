

# Unify Lifestyle Layout Hero Section

## Current State

The **LifestyleLayout** currently uses a magazine-style split hero (image 50% / content 50% in a grid) which is inconsistent with the other two layouts.

**Current Lifestyle Hero:**
```text
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Blog (in container, not on hero)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┬───────────────────────────────────┐   │
│  │   [HERO IMAGE]  │  Badge                            │   │
│  │   (50% width)   │  Title                            │   │
│  │   in grid       │  Excerpt                          │   │
│  │                 │  Author • Date                    │   │
│  └─────────────────┴───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Target Hero (matching DestinationGuide/TravelTips):**
```text
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Blog (absolute positioned on hero)               │
│                                                             │
│  [FULL-WIDTH HERO IMAGE - 35vh]                            │
│  with gradient overlay                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LIFTED HEADER CARD (negative margin overlap)       │   │
│  │  Badge • Title • Excerpt • Author • Date • Time     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Changes to LifestyleLayout.tsx

### 1. Replace Split Hero with Full-Width Hero

**Remove:**
- The container-based back link (lines 56-65)
- The split grid hero section (lines 67-133)

**Add:**
- Full-width hero section with 35vh height (matching DestinationGuide)
- Absolutely positioned back button on the hero
- Gradient overlay for readability
- Lifted header card with negative margin

### 2. Updated Hero Structure

```tsx
{/* Hero Image with gradient */}
<section className="relative h-[35vh] overflow-hidden">
  {post.featured_image_url ? (
    <img
      src={post.featured_image_url}
      alt={post.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
  
  {/* Back Button - Consistent Style */}
  <div className="absolute top-4 left-4 z-10">
    <Link
      to="/blog"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Blog
    </Link>
  </div>
</section>
```

### 3. Updated Header Card

```tsx
{/* Article Header Card */}
<div className="container mx-auto px-4 -mt-24 relative z-10">
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-card rounded-2xl p-6 md:p-10 shadow-xl max-w-4xl mx-auto border border-border/50"
  >
    {/* Badge, Title, Excerpt, Author/Meta - same structure as DestinationGuide */}
  </motion.div>
</div>
```

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/blog/layouts/LifestyleLayout.tsx` | Replace split hero grid with full-width hero image + lifted header card pattern |

---

## Visual Result

After the change, all three layouts will share the same hero pattern:

| Element | DestinationGuide | Lifestyle | TravelTips |
|---------|------------------|-----------|------------|
| Hero height | 35vh | 35vh | 25vh |
| Hero style | Full-width with parallax | Full-width (no parallax) | Full-width |
| Back button | Absolute on hero | Absolute on hero | Absolute on hero |
| Header card | Lifted with -mt-24 | Lifted with -mt-24 | Lifted with -mt-16 |
| Card styling | Same shadow/border | Same shadow/border | Same shadow/border |

The only remaining differentiator for Lifestyle will be:
- No parallax effect (simpler animation)
- Excerpt displayed in the header card
- No sticky Table of Contents sidebar (centered content only)

