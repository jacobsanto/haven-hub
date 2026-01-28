

# Add Visual Style Indicators to Blog Listing Cards

## Overview

All blog categories already exist in the database and posts are assigned to them:
- **Destination Guides** (slug: `destination-guides`) - "The Ultimate Santorini Guide..."
- **Lifestyle** (slug: `lifestyle`) - "2026's Most Coveted Luxury Hotel Trends..."
- **Travel Tips** (slug: `travel-tips`) - "10 Insider Tips for Elevating Your Luxury Travel Experience"

This plan adds visual indicators to blog cards so users can see which layout type each article uses before clicking.

---

## Design Concept

Each article layout will have a subtle visual indicator showing its style:

| Layout Type | Icon | Color Accent | Label |
|-------------|------|--------------|-------|
| Destination Guide | `Map` | Primary (warm terracotta) | "Guide" |
| Lifestyle | `Sparkles` | Secondary (sage green) | "Lifestyle" |
| Travel Tips | `Lightbulb` | Amber/Gold | "Tips" |

The indicator will appear as a small pill/badge near the category badge or in the card footer, providing a quick visual cue about the reading experience.

---

## Implementation Details

### 1. Create ArticleStyleBadge Component

Create a new reusable component that displays the layout style indicator:

**File:** `src/components/blog/ArticleStyleBadge.tsx`

```tsx
import { Map, Sparkles, Lightbulb } from 'lucide-react';
import { getArticleStyle, ArticleStyle } from '@/types/article-styles';
import { cn } from '@/lib/utils';

interface ArticleStyleBadgeProps {
  categorySlug?: string;
  variant?: 'default' | 'compact' | 'overlay';
  className?: string;
}

const styleConfig: Record<ArticleStyle, {
  icon: typeof Map;
  label: string;
  bgClass: string;
  textClass: string;
}> = {
  'destination-guide': {
    icon: Map,
    label: 'Guide',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
  },
  'lifestyle': {
    icon: Sparkles,
    label: 'Lifestyle',
    bgClass: 'bg-secondary/20',
    textClass: 'text-secondary-foreground',
  },
  'travel-tips': {
    icon: Lightbulb,
    label: 'Tips',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
};

export function ArticleStyleBadge({ 
  categorySlug, 
  variant = 'default',
  className 
}: ArticleStyleBadgeProps) {
  const style = getArticleStyle(categorySlug);
  const config = styleConfig[style];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium",
          config.textClass,
          className
        )}
        title={`${config.label} layout`}
      >
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          "bg-background/80 backdrop-blur-sm",
          config.textClass,
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
```

### 2. Update BlogPostCard Component

Add the style indicator to the regular blog post card (grid layout).

**File:** `src/components/blog/BlogPostCard.tsx`

**Changes:**
- Import `ArticleStyleBadge`
- Add the badge in the card's metadata section (footer area)
- Display next to read time for visual balance

```tsx
// Add to imports
import { ArticleStyleBadge } from './ArticleStyleBadge';

// In the regular card render (non-featured), add to the footer:
<div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
  {post.author && (
    <div className="flex items-center gap-1.5">
      {/* existing author avatar */}
    </div>
  )}
  <span className="flex items-center gap-1">
    <Clock className="h-3 w-3" />
    {readTime} min
  </span>
  {/* NEW: Article style indicator */}
  <ArticleStyleBadge 
    categorySlug={post.category?.slug} 
    variant="compact" 
  />
</div>
```

### 3. Update BlogSecondaryCard Component

Add the style indicator to the horizontal secondary cards.

**File:** `src/components/blog/BlogSecondaryCard.tsx`

**Changes:**
- Import `ArticleStyleBadge`
- Position the badge in the image overlay area (next to category badge) or in footer

```tsx
// Add to imports
import { ArticleStyleBadge } from './ArticleStyleBadge';

// In the image area, add alongside category badge:
<div className="absolute top-4 left-4 flex items-center gap-2">
  {post.category && (
    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
      {post.category.name}
    </Badge>
  )}
  <ArticleStyleBadge 
    categorySlug={post.category?.slug} 
    variant="overlay" 
  />
</div>
```

### 4. Update BlogHero Component

Add the style indicator to the featured hero section.

**File:** `src/components/blog/BlogHero.tsx`

**Changes:**
- Import `ArticleStyleBadge`
- Position next to the category badge in the hero overlay

```tsx
// Add to imports
import { ArticleStyleBadge } from './ArticleStyleBadge';

// In the hero content area, add next to category badge:
<div className="flex items-center gap-3 mb-4">
  {post.category && (
    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
      {post.category.name}
    </Badge>
  )}
  <ArticleStyleBadge 
    categorySlug={post.category?.slug} 
    variant="overlay"
    className="text-white/90"
  />
</div>
```

---

## Visual Result

After implementation, each blog card will show:

**Hero Card:**
```text
┌─────────────────────────────────────────────────────────────┐
│  [HERO IMAGE]                                               │
│                                                             │
│  [Destination Guides] [🗺 Guide]  ← Both badges visible     │
│  Title of the Article                                       │
│  Excerpt text...                                            │
│  Author • Date • Read time                                  │
└─────────────────────────────────────────────────────────────┘
```

**Secondary Card:**
```text
┌────────────────────────────────────────────────┐
│  [IMAGE]          │  Title                     │
│  [Lifestyle] [✨] │  Excerpt...                │
│                   │  Author • 5 min  [Read →]  │
└────────────────────────────────────────────────┘
```

**Grid Card:**
```text
┌─────────────────────────────┐
│  [IMAGE]                    │
│  [Travel Tips]              │
│  Title                      │
│  Excerpt...                 │
│  Author • 3 min • 💡        │  ← Compact icon indicator
└─────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/blog/ArticleStyleBadge.tsx` | **Create** - New component for style indicators |
| `src/components/blog/BlogPostCard.tsx` | **Modify** - Add compact style badge to footer |
| `src/components/blog/BlogSecondaryCard.tsx` | **Modify** - Add overlay style badge near category |
| `src/components/blog/BlogHero.tsx` | **Modify** - Add overlay style badge next to category |

---

## Technical Notes

1. **Consistent with Design System**: Uses existing color tokens (`primary`, `secondary`, `amber`) and styling patterns (`rounded-full`, `backdrop-blur-sm`)

2. **Three Variants**:
   - `default` - Full pill with icon + label (standalone use)
   - `compact` - Icon only, smaller (for tight spaces like card footers)
   - `overlay` - Semi-transparent with backdrop blur (for image overlays)

3. **Accessibility**: Each badge has a `title` attribute explaining the layout type

4. **Reusable**: The `ArticleStyleBadge` component can be used anywhere article style indication is needed

