

# Animated Floating Background Elements

## Overview

Add smooth, continuous floating animations to the decorative background blob elements in hero sections across all pages. The blobs will move in isometric (diagonal) patterns while staying within their section boundaries, creating a subtle, elegant ambient motion effect.

## Current State

The decorative elements currently use:
- `organic-blob` class for the irregular blob shape
- `animate-pulse` for a simple opacity fade
- Static absolute positioning (e.g., `top-20 left-10`)

**Pages with hero blobs:**
- **Index.tsx** (lines 43-44): 2 blobs
- **Destinations.tsx** (lines 28-29): 2 blobs  
- **About.tsx** (lines 46-47): 2 blobs
- **Contact.tsx** (lines 41-42): 2 blobs
- **Experiences.tsx** (lines 26-27): 2 blobs

## Solution

Create new CSS keyframe animations for isometric floating movement and apply them to the blob elements. Each blob will have a slightly different animation duration/delay to create organic, non-synchronized motion.

---

## Technical Implementation

### 1. Add New Keyframes to tailwind.config.ts

Add three floating animation variants:

```typescript
keyframes: {
  // ... existing keyframes
  "float-diagonal-1": {
    "0%, 100%": { transform: "translate(0, 0)" },
    "25%": { transform: "translate(15px, -20px)" },
    "50%": { transform: "translate(25px, 10px)" },
    "75%": { transform: "translate(-10px, 20px)" },
  },
  "float-diagonal-2": {
    "0%, 100%": { transform: "translate(0, 0)" },
    "25%": { transform: "translate(-20px, 15px)" },
    "50%": { transform: "translate(10px, 25px)" },
    "75%": { transform: "translate(20px, -10px)" },
  },
  "float-diagonal-3": {
    "0%, 100%": { transform: "translate(0, 0)" },
    "33%": { transform: "translate(18px, 18px)" },
    "66%": { transform: "translate(-15px, 12px)" },
  },
},
animation: {
  // ... existing animations
  "float-1": "float-diagonal-1 20s ease-in-out infinite",
  "float-2": "float-diagonal-2 25s ease-in-out infinite",
  "float-3": "float-diagonal-3 18s ease-in-out infinite",
}
```

### 2. Create Reusable Floating Blob Component

Create a new component `src/components/decorative/FloatingBlob.tsx` to encapsulate the animated blob logic:

```typescript
interface FloatingBlobProps {
  className?: string;
  variant?: 'primary' | 'accent';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  animationVariant?: 1 | 2 | 3;
}
```

This component will:
- Apply the correct positioning classes based on `position` prop
- Apply size classes (w-48/w-64/w-96)
- Apply the floating animation based on `animationVariant`
- Include the organic-blob shape styling

### 3. Update All Hero Sections

Replace the current static blob divs with the new `FloatingBlob` component across all pages:

**Index.tsx:**
```tsx
<FloatingBlob position="top-left" variant="primary" size="lg" animationVariant={1} />
<FloatingBlob position="bottom-right" variant="accent" size="lg" animationVariant={2} />
```

**Destinations.tsx, About.tsx, Contact.tsx, Experiences.tsx:**
Similar updates with appropriate position/size variants.

---

## Animation Characteristics

| Property | Value | Rationale |
|----------|-------|-----------|
| Duration | 18-25 seconds | Slow enough to feel ambient, not distracting |
| Easing | ease-in-out | Smooth, organic acceleration/deceleration |
| Movement Range | 15-25 pixels | Subtle movement that stays within boundaries |
| Direction | Diagonal (isometric) | Creates depth and visual interest |
| Loop | Infinite | Continuous ambient animation |

---

## Files to Modify

1. **tailwind.config.ts** - Add new keyframes and animation utilities
2. **src/components/decorative/FloatingBlob.tsx** - Create reusable component (new file)
3. **src/pages/Index.tsx** - Update hero blobs
4. **src/pages/Destinations.tsx** - Update hero blobs
5. **src/pages/About.tsx** - Update hero blobs
6. **src/pages/Contact.tsx** - Update hero blobs
7. **src/pages/Experiences.tsx** - Update hero blobs

---

## Benefits

- **Subtle Elegance**: Slow, smooth movements add life without being distracting
- **Performance**: Pure CSS animations are GPU-accelerated and lightweight
- **Consistency**: Reusable component ensures uniform behavior across pages
- **Boundary Respect**: Small translation values (15-25px) keep blobs within their container
- **Organic Feel**: Different durations/patterns prevent mechanical synchronized movement

