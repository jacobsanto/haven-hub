

# Hero Slider — Trendy Enhancement Proposals

## Current State Assessment
The two-layer cross-fade system is working correctly. The autoplay is stable, timing is synchronized at 700ms, and the race conditions are resolved. The slider is functionally solid.

## Proposed Enhancements

### 1. Ken Burns (Slow Zoom + Pan) Effect
Add a subtle CSS scale animation on the background images — each slide slowly zooms in from `scale(1.0)` to `scale(1.08)` over the 6s autoplay duration. This is the signature luxury travel hero technique used by Four Seasons, Aman Resorts, and Airbnb Luxe. It makes static images feel cinematic without any performance cost (GPU-composited `transform: scale`).

### 2. Clip-Path Reveal Transition (instead of fade)
Replace the simple opacity fade with a modern `clip-path` wipe transition. The incoming image reveals via `clip-path: inset(0 100% 0 0)` animating to `clip-path: inset(0 0 0 0)` — a horizontal curtain reveal. This is the 2025/2026 trend replacing fades on premium sites (used by Awwwards winners). Falls back gracefully to opacity fade on older browsers.

### 3. Parallax Text Offset on Scroll
Add a subtle parallax effect where the hero text translates upward at 0.3x scroll speed as the user scrolls down, creating depth separation between the background and content. Uses `transform: translateY()` driven by a scroll listener with `requestAnimationFrame` — fully GPU-composited.

### 4. Animated Progress Bar on Navigation Dots
Replace the static dot indicators with a thin progress bar or animated ring that fills over the 6s autoplay interval, giving users a visual cue of when the next slide arrives. Resets on manual navigation.

### 5. Staggered Text Entrance
Instead of the entire text block fading in as one unit, stagger the heading and description with a 150ms delay between them — the heading slides up first, then the description follows. Uses Framer Motion's `staggerChildren`.

## Recommended Combination
Apply enhancements 1, 2, and 5 together for maximum impact with minimal complexity. Enhancement 3 is optional (adds a scroll listener). Enhancement 4 is a nice-to-have for UX polish.

## Files to Modify
- **`src/components/home/HeroSection.tsx`** — Add Ken Burns keyframes, replace fade with clip-path reveal, implement staggered text entrance

## What Stays
- Two-layer cross-fade architecture (just changing the animation type)
- Ref-based autoplay system
- Touch swipe, mobile dots, footer bar
- All data hooks and brand context
- Reduced motion fallbacks

