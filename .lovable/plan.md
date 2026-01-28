

# Multiple Blog Article Styles - Category-Based Layouts

## Overview

Create three distinct article styles that automatically apply based on the blog post's category, providing the optimal reading experience for each content type:

1. **Destination Guides** (Current style) - Immersive, image-rich, storytelling format
2. **Lifestyle** - Elegant, editorial, magazine-style layout
3. **Travel Tips** - Scannable, practical, quick-reference format

---

## Design Concept

### 1. Destination Guides (Current)

**Purpose:** Immersive storytelling for specific locations

**Characteristics:**
- Full-width hero with parallax
- Drop caps on first paragraph
- Large pull quotes
- Section dividers with decorative elements
- Inline image galleries
- Location callouts
- Time-based tip boxes

**Visual Style:**
- Deep, atmospheric imagery
- Serif typography for headings
- Generous whitespace between sections
- 40vh hero height

---

### 2. Lifestyle Style (NEW)

**Purpose:** Editorial content about luxury living, trends, experiences

**Characteristics:**
- Magazine-style split hero (image left, title right)
- Two-column layout option for desktop
- Large editorial pull quotes with author attribution
- Photo grids with captions
- No drop caps (cleaner, modern look)
- Minimal section dividers
- Accent color borders and highlights

**Visual Style:**
- Clean, minimal aesthetic
- Mixed serif/sans-serif typography
- Fashion/magazine-inspired layouts
- Full-bleed images with text overlays
- 35vh hero with side-by-side content

**Layout Example:**
```text
┌────────────────────────────────────────────────────────┐
│  ┌─────────────────┬──────────────────────────────┐   │
│  │                 │  LIFESTYLE                    │   │
│  │   [HERO IMAGE]  │  ───────────────              │   │
│  │   (50% width)   │  Article Title                │   │
│  │                 │  Subtitle / Excerpt           │   │
│  │                 │  Author • Date • Read Time    │   │
│  └─────────────────┴──────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Opening paragraph with clean typography...             │
│                                                         │
│  ┌────────────────────────────────────────────────────┐│
│  │  "An inspiring quote from the article that         ││
│  │   captures the essence of the lifestyle topic"     ││
│  │                                                    ││
│  │   — Author Name, Publication                       ││
│  └────────────────────────────────────────────────────┘│
│                                                         │
│  ┌──────────┬──────────┐  Content continues alongside │
│  │  [Image] │  [Image] │  photo grid...               │
│  └──────────┴──────────┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Travel Tips Style (NEW)

**Purpose:** Practical, actionable advice for travelers

**Characteristics:**
- Compact header (no large hero image)
- Numbered sections or "tip cards"
- Checklist-style content
- Quick-reference boxes
- "At a Glance" summary card at top
- Table of contents as numbered steps
- Bookmark-able sections
- Highlight boxes for key takeaways

**Visual Style:**
- Clean, utility-focused design
- Sans-serif throughout for clarity
- Card-based layout for tips
- Icons for each tip category
- Accent color numbering
- Minimal imagery, maximum content

**Layout Example:**
```text
┌────────────────────────────────────────────────────────┐
│  ← Back to Blog                        Share Options   │
├────────────────────────────────────────────────────────┤
│  TRAVEL TIPS                                           │
│  ─────────────                                         │
│  10 Essential Tips for Your Next Trip                  │
│  Author • Date • 5 min read                            │
├────────────────────────────────────────────────────────┤
│  ╔══════════════════════════════════════════════════╗  │
│  ║  📋 AT A GLANCE                                  ║  │
│  ║  ─────────────────────────────────────────       ║  │
│  ║  • Best for: First-time travelers                ║  │
│  ║  • Difficulty: Beginner                          ║  │
│  ║  • Time to read: 5 minutes                       ║  │
│  ║  • Key takeaway: Pack smart, travel light        ║  │
│  ╚══════════════════════════════════════════════════╝  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 01                                             │   │
│  │ ─────────────────────────────────────────────  │   │
│  │ TIP TITLE                                      │   │
│  │ Detailed explanation of the tip with practical │   │
│  │ steps and advice...                            │   │
│  │                                                │   │
│  │ ✓ Action item 1                                │   │
│  │ ✓ Action item 2                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 02                                             │   │
│  │ ─────────────────────────────────────────────  │   │
│  │ NEXT TIP TITLE                                 │   │
│  │ ...                                            │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Article Style Types

Add a new type for article styles based on category slug:

```typescript
type ArticleStyle = 'destination-guide' | 'lifestyle' | 'travel-tips';

const getArticleStyle = (categorySlug?: string): ArticleStyle => {
  switch (categorySlug) {
    case 'lifestyle': return 'lifestyle';
    case 'travel-tips': return 'travel-tips';
    case 'destination-guides':
    default: return 'destination-guide';
  }
};
```

### 2. BlogPost.tsx Modifications

Refactor to use conditional rendering based on article style:

```tsx
const articleStyle = getArticleStyle(post.category?.slug);

return (
  <PageLayout>
    {articleStyle === 'destination-guide' && <DestinationGuideLayout post={post} ... />}
    {articleStyle === 'lifestyle' && <LifestyleLayout post={post} ... />}
    {articleStyle === 'travel-tips' && <TravelTipsLayout post={post} ... />}
  </PageLayout>
);
```

### 3. New Layout Components

| Component | Purpose |
|-----------|---------|
| `DestinationGuideLayout.tsx` | Current layout - extracted as component |
| `LifestyleLayout.tsx` | Magazine editorial style |
| `TravelTipsLayout.tsx` | Practical tips card layout |
| `TipCard.tsx` | Numbered tip card component |
| `AtAGlanceCard.tsx` | Summary box for tips articles |
| `EditorialQuote.tsx` | Lifestyle-style quote with attribution |

### 4. MarkdownRenderer Variants

Create style-specific rendering options:

```tsx
interface MarkdownRendererProps {
  content: string;
  style?: ArticleStyle;
  // ...
}
```

Each style applies different transformations:
- **Destination Guide:** Drop caps, decorative dividers, pull quotes
- **Lifestyle:** Editorial quotes, photo grids, clean dividers
- **Travel Tips:** Numbered sections, checklist parsing, tip cards

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/blog/layouts/DestinationGuideLayout.tsx` | Current layout extracted |
| `src/components/blog/layouts/LifestyleLayout.tsx` | Magazine editorial style |
| `src/components/blog/layouts/TravelTipsLayout.tsx` | Tips card-based layout |
| `src/components/blog/TipCard.tsx` | Numbered tip card |
| `src/components/blog/AtAGlanceCard.tsx` | Summary card for tips |
| `src/components/blog/EditorialQuote.tsx` | Magazine-style quote |
| `src/types/article-styles.ts` | Style type definitions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BlogPost.tsx` | Add style detection, conditional layout rendering |
| `src/components/blog/MarkdownRenderer.tsx` | Add style-aware rendering variants |
| `src/pages/Blog.tsx` | Add visual style indicator on cards |
| `src/components/blog/BlogPostCard.tsx` | Style-specific preview styling |

---

## Mobile Considerations

### Destination Guide
- Single-column immersive images
- Swipeable galleries
- Mobile TOC drawer

### Lifestyle
- Stacked hero (image above title)
- Full-width editorial quotes
- Photo grid collapses to carousel

### Travel Tips
- Cards stack vertically
- Sticky tip navigation
- Collapsible tips for long lists
- "At a Glance" always visible at top

---

## Visual Comparison

| Feature | Destination Guide | Lifestyle | Travel Tips |
|---------|-------------------|-----------|-------------|
| Hero Height | 40vh | 35vh split | Minimal |
| Hero Style | Full-width parallax | Side-by-side | Compact header |
| Typography | Serif headings | Mixed fonts | Sans-serif |
| Drop Caps | Yes | No | No |
| Content Width | Wide (prose-lg) | Medium | Full |
| Pull Quotes | Decorative | Editorial w/ author | Highlight boxes |
| Section Dividers | Decorative dots | Clean lines | Numbered cards |
| Images | Inline galleries | Photo grids | Minimal |
| Special Elements | Location/timing callouts | Author quotes | Tip cards, checklists |

---

## Sample Markdown Syntax Support

### Travel Tips Special Syntax
```markdown
:::tip-card{number=1}
## Pack Light
Always roll your clothes instead of folding...
- [ ] Use packing cubes
- [ ] Choose versatile items
:::

:::at-a-glance
- **Best for:** First-time travelers
- **Difficulty:** Beginner
- **Key takeaway:** Less is more
:::
```

### Lifestyle Special Syntax
```markdown
:::editorial-quote
"Travel is the only thing you buy that makes you richer"
— Author Name
:::

:::photo-grid
![Image 1](url1.jpg)
![Image 2](url2.jpg)
![Image 3](url3.jpg)
:::
```

---

## Implementation Priority

**Phase 1:** Core Layout Framework
- Extract current layout as DestinationGuideLayout
- Create style detection utility
- Set up BlogPost.tsx conditional rendering

**Phase 2:** Lifestyle Layout
- Create LifestyleLayout component
- Editorial quote component
- Photo grid component
- MarkdownRenderer lifestyle variant

**Phase 3:** Travel Tips Layout
- Create TravelTipsLayout component
- TipCard and AtAGlanceCard components
- MarkdownRenderer tips variant
- Numbered section parsing

**Phase 4:** Polish & Mobile
- Mobile-specific optimizations
- Animation refinements
- Blog listing style indicators

