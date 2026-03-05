

# Hero Slider Analysis & Fix Report

## Issues Found

### 1. Triple Background Layer Conflict (Primary Glitch Source)
The slider renders **3 overlapping background divs** during every transition (lines 96-121):
- Layer 0: Previous image (static)
- Layer 1: Active image with `transition-opacity` CSS (starts at opacity 0)
- Layer 2: Active image **again** with a `@keyframes heroFadeIn` CSS animation

Layers 1 and 2 both fade in the same image simultaneously using two different animation systems (CSS transition vs CSS keyframe). This creates a double-composite flicker — the browser composites two semi-transparent copies of the same image on top of each other, producing visible banding/ghosting artifacts.

### 2. Dual Transition-End Race Condition
The transition end is handled by **two competing mechanisms**:
- A `setTimeout` at 800ms (line 47-51) that clears `prevIndex`
- An `onTransitionEnd` handler on layer 1 (line 109-114) that also clears `prevIndex`

Whichever fires first wins, but the other still runs. If the timeout fires first, it removes the DOM elements mid-CSS-transition, causing a visual pop. If `onTransitionEnd` fires first, the timeout is a no-op but still runs unnecessarily.

### 3. AnimatePresence + Background Cross-Fade Are Unsynchronized
The text uses Framer Motion `AnimatePresence mode="wait"` (600ms), but the background uses CSS transitions (800ms). The text exits and enters at a different pace than the background, creating a disjointed feel — text appears to "jump ahead" of the image.

### 4. Autoplay Timer Recreated on Every goNext Change
`goNext` is a dependency of the autoplay `useEffect` (line 69). Since `goNext` depends on `activeIndex` and `isTransitioning`, the effect tears down and recreates the interval on every slide change. This can cause:
- Double-fire if the old interval hasn't cleared before the new one starts
- Missed pause/resume events if event listeners are re-attached during transition

### 5. Opacity Inversion Logic
Line 106: `opacity: prevIndex !== null && !prefersReduced ? 0 : 1` — the active image starts at opacity 0 and is supposed to fade in via CSS `transition-opacity`. But layer 2 (the keyframe layer) also fades in on top. The result: the user sees layer 2's animation, then when `prevIndex` clears, layer 1 snaps to opacity 1 — a subtle but visible "double flash."

## Recommended Fix

### Simplify to a Single Cross-Fade System
Replace the 3-layer approach with **2 layers only** using pure CSS transitions:

```
Layer 0 (z-index 0): Always shows the PREVIOUS image (or current if no transition)
Layer 1 (z-index 1): Shows the NEW image, transitions opacity from 0→1 over 800ms
```

When `onTransitionEnd` fires on Layer 1, promote its image to Layer 0 and remove Layer 1. No keyframe animation, no timeout race.

### Sync Text and Background Timing
Set both Framer Motion text transition and CSS background transition to the same duration (700ms) so they move in lockstep.

### Stabilize Autoplay
Move the interval to a `useRef`-based approach that doesn't depend on `goNext` in the effect dependency array. Instead, read `activeIndex` from a ref inside the interval callback to avoid effect churn.

### Files to Modify
- **`src/components/home/HeroSection.tsx`** — Rewrite the background layer system (remove layer 2 + keyframe, remove setTimeout, keep only `onTransitionEnd`), align text animation timing, stabilize autoplay effect

### What Stays
- Touch swipe logic
- Mobile dot indicators
- Footer bar with social icons and nav arrows
- `HeroSearchForm` integration
- All data hooks and brand context

