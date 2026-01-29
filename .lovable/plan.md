

# Fix Floating Blob Animations

## Problem Identified

The floating blob animations are not working because **Tailwind's JIT compiler is not generating the CSS classes** for `animate-float-1`, `animate-float-2`, and `animate-float-3`.

### Why It's Happening

1. The animation class names are stored in a JavaScript object in `FloatingBlob.tsx`:
   ```typescript
   const animationClasses = {
     1: 'animate-float-1',
     2: 'animate-float-2',
     3: 'animate-float-3',
   };
   ```

2. Tailwind's JIT compiler scans source files for class names, but **dynamic class references in objects may not be detected**

3. Looking at existing working animations in `src/index.css`, classes like `.animate-fade-up` are **manually defined** as a fallback pattern

---

## Solution

Add the floating animation classes and keyframes directly to `src/index.css` in the utilities layer, just like the existing animation utilities.

---

## Implementation

### File: `src/index.css`

Add the following to the `@layer utilities` section (after line 231):

```css
/* Floating blob animations for hero sections */
.animate-float-1 {
  animation: float-diagonal-1 20s ease-in-out infinite;
}

.animate-float-2 {
  animation: float-diagonal-2 25s ease-in-out infinite;
}

.animate-float-3 {
  animation: float-diagonal-3 18s ease-in-out infinite;
}

@keyframes float-diagonal-1 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(15px, -20px); }
  50% { transform: translate(25px, 10px); }
  75% { transform: translate(-10px, 20px); }
}

@keyframes float-diagonal-2 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-20px, 15px); }
  50% { transform: translate(10px, 25px); }
  75% { transform: translate(20px, -10px); }
}

@keyframes float-diagonal-3 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(18px, 18px); }
  66% { transform: translate(-15px, 12px); }
}
```

---

## Why This Works

- **Direct CSS definition** ensures the styles are always included in the build
- **No reliance on Tailwind's class detection** - the classes exist regardless of how they're referenced
- **Follows existing patterns** in the codebase (`.animate-fade-up`, `.animate-fade-in` use the same approach)
- **No changes needed** to the FloatingBlob component or pages

---

## Visual Result

After this fix, the decorative background blobs will:
- Move smoothly in diagonal patterns
- Create subtle, ambient motion (15-25px range)
- Loop infinitely with 18-25 second cycles
- Each blob will animate differently for organic, non-synchronized movement

