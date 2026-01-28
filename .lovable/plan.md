

# Header Improvement Plan - 2026 Best Practices

## Overview

Enhance the header navigation to include all key public pages (Blog, Experiences, Destinations) while following 2026 UX/UI best practices for luxury hospitality websites.

---

## Current State Analysis

### Existing Navigation Links (Desktop & Mobile)
- Properties ✓
- About ✓
- Contact ✓

### Missing Pages (Available in App.tsx)
| Page | Route | Priority |
|------|-------|----------|
| Destinations | `/destinations` | High - Key content for hospitality |
| Experiences | `/experiences` | High - User requested |
| Blog | `/blog` | High - User requested |

---

## Proposed Header Structure

```
+------------------------------------------------------------------+
|  [LOGO]    Properties | Destinations | Experiences | Blog | About    [Search] [User/Sign In]  |
+------------------------------------------------------------------+
```

### Navigation Priority (Left to Right)
1. **Properties** - Primary conversion goal
2. **Destinations** - Discovery & inspiration
3. **Experiences** - Unique offerings
4. **Blog** - Content & engagement
5. **About** - Company information

**Removed from main nav:** Contact (moved to About dropdown or accessible via footer)

---

## Implementation Details

### File to Modify
`src/components/layout/Header.tsx`

### Changes

#### 1. Add New Navigation Links
Add Destinations, Experiences, and Blog links to both desktop and mobile navigation:

```tsx
// Desktop Navigation
<Link to="/properties">Properties</Link>
<Link to="/destinations">Destinations</Link>
<Link to="/experiences">Experiences</Link>
<Link to="/blog">Blog</Link>
<Link to="/about">About</Link>
```

#### 2. Active Link Indicator
Add visual feedback for the current page using `useLocation`:

```tsx
const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

// Apply active styling
className={cn(
  "text-sm font-medium transition-colors",
  isActive('/properties') 
    ? "text-foreground" 
    : "text-muted-foreground hover:text-foreground"
)}
```

#### 3. Improved Link Styling
Add subtle underline animation on hover for desktop links:

```tsx
className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 
           after:bg-primary after:transition-all hover:after:w-full"
```

#### 4. Mobile Menu Updates
Update mobile menu to include all new links with consistent styling and proper ordering.

#### 5. Accessibility Improvements
- Add `aria-current="page"` for active links
- Ensure proper focus states
- Add `role="navigation"` to nav element

---

## Desktop vs Mobile Layout

### Desktop (md and up)
- Horizontal navigation with 5 main links
- Search toggle button
- User menu (dropdown for logged-in users, Sign In button for guests)

### Mobile (below md)
- Hamburger menu toggle
- Full-width "Find Your Stay" CTA button at top
- Vertical list of all navigation links
- Sign In button or user actions at bottom

---

## Visual Enhancements

| Enhancement | Description |
|-------------|-------------|
| Active indicator | Subtle underline or text color change for current page |
| Hover animation | Smooth underline slide-in effect |
| Scroll transition | Already exists - transparent to solid background |
| Focus states | Visible focus ring for keyboard navigation |

---

## Technical Implementation

### Import Updates
Add `cn` utility if not already imported:
```tsx
import { cn } from '@/lib/utils';
```

### Navigation Items Array
Create a reusable array for cleaner code:
```tsx
const navItems = [
  { label: 'Properties', path: '/properties' },
  { label: 'Destinations', path: '/destinations' },
  { label: 'Experiences', path: '/experiences' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
];
```

### Active Link Helper
```tsx
const isActive = (path: string) => {
  if (path === '/') return location.pathname === '/';
  return location.pathname === path || location.pathname.startsWith(path + '/');
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Add new links, active states, hover animations, accessibility attributes |

---

## Summary of Improvements

| Before | After |
|--------|-------|
| 3 nav links | 5 nav links including Blog & Experiences |
| No active indicator | Visual active state for current page |
| Basic hover | Smooth underline animation on hover |
| Limited mobile links | Full navigation in mobile menu |
| Missing accessibility | aria-current and proper focus states |

