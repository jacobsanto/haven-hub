

# Hero Slider — 2026 Radical Upgrade

## What's Currently There
Ken Burns zoom, horizontal clip-path wipe, staggered text, parallax scroll, progress bars. Solid but conventional — these are 2024-era techniques now standard on most luxury sites.

## Proposed 2026 Enhancements

### 1. Diagonal Polygon Clip-Path Morph (replaces horizontal wipe)
Instead of a flat left-to-right curtain, the incoming image reveals through an **animated diagonal polygon** that sweeps across at an angle. The clip-path morphs from a thin sliver to full coverage:

```text
Before:          During:           After:
┌──────────┐   ┌──────────┐    ┌──────────┐
│ old image│   │old /████ │    │ new image│
│          │   │  / █new██│    │          │
│          │   │ / ███████│    │          │
└──────────┘   └──────────┘    └──────────┘
```

CSS: `clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%)` → `polygon(0 0, 100% 0, 100% 100%, -15% 100%)`. The `-15%` creates that signature diagonal overshoot.

### 2. Split-Text Character Stagger with Blur Reveal
Instead of fading the heading as a block, **split each word** and animate them individually with a blur-to-sharp + translateY effect. Each word starts at `filter: blur(8px); opacity: 0; translateY(20px)` and resolves to sharp focus with 60ms stagger per word. This is the dominant 2026 Awwwards pattern — text appears to "materialize" from fog.

### 3. Micro-Grain Texture Overlay
Add a subtle animated film grain texture using a CSS pseudo-element with a tiny noise SVG pattern at very low opacity (3-5%). This gives the hero a tactile, editorial film quality that flat digital gradients lack. Uses a small inline SVG `<filter>` with `feTurbulence` — zero performance cost, pure GPU compositor.

### 4. Slide Counter with Morphing Number Transition
The `01 / 04` counter currently snaps. Replace with a **vertical number scroll** where the digit slides up/down to the next number — like a mechanical odometer. Uses `overflow: hidden` + `translateY` on a stack of number spans.

### 5. Cursor-Reactive Gradient Shift
Track mouse position on the hero and subtly shift the dark overlay gradient based on cursor location. As the mouse moves right, the gradient follows, creating a "spotlight" effect. Uses a CSS radial-gradient positioned via CSS custom properties updated on `mousemove`. Lightweight — just updating two CSS variables.

## Implementation Approach

All pure CSS + vanilla JS (no new dependencies). Changes only to `src/components/home/HeroSection.tsx`:

- Replace `heroClipReveal` keyframes with diagonal polygon morph
- Add `WordReveal` inline component that splits heading text into `<span>` per word with blur+translate animation
- Add `::after` pseudo-element on the hero container with `feTurbulence` SVG filter for grain
- Refactor the counter `<span>` into a vertical scroll digit component
- Add `onMouseMove` handler that sets `--mouse-x` and `--mouse-y` CSS variables, overlay gradient reads from those

Reduced motion: all effects degrade to instant display (no blur, no polygon animation, no grain, static gradient).

## Files to Modify
- **`src/components/home/HeroSection.tsx`** — All changes contained here

