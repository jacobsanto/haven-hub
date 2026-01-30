

# Fluid Floating Blob Animations

## Problem

The current animations have a "stop-start" feel because:

1. **`ease-in-out` timing** creates deceleration/acceleration at each keyframe point
2. **Sharp direction changes** at 25%, 50%, 75% keyframes cause visible pauses
3. **Limited keyframe points** make the movement feel segmented rather than continuous

---

## Solution

Create smooth, continuous circular/lemniscate (figure-8) motion paths using:

1. **`linear` timing function** - eliminates acceleration/deceleration pauses
2. **More keyframe points** - smoother path with gradual direction changes
3. **Circular movement paths** - no abrupt direction reversals

---

## Implementation

### File: `src/index.css`

Replace the current keyframes with fluid circular motion patterns:

```css
.animate-float-1 {
  animation: float-diagonal-1 20s linear infinite;
}

.animate-float-2 {
  animation: float-diagonal-2 25s linear infinite;
}

.animate-float-3 {
  animation: float-diagonal-3 18s linear infinite;
}

@keyframes float-diagonal-1 {
  0% { transform: translate(0, 0); }
  10% { transform: translate(25px, -35px); }
  25% { transform: translate(50px, -20px); }
  40% { transform: translate(55px, 20px); }
  50% { transform: translate(35px, 45px); }
  60% { transform: translate(0px, 50px); }
  75% { transform: translate(-30px, 25px); }
  90% { transform: translate(-20px, -15px); }
  100% { transform: translate(0, 0); }
}

@keyframes float-diagonal-2 {
  0% { transform: translate(0, 0); }
  12% { transform: translate(-30px, 20px); }
  25% { transform: translate(-45px, 50px); }
  37% { transform: translate(-20px, 60px); }
  50% { transform: translate(20px, 45px); }
  62% { transform: translate(45px, 15px); }
  75% { transform: translate(35px, -25px); }
  87% { transform: translate(10px, -20px); }
  100% { transform: translate(0, 0); }
}

@keyframes float-diagonal-3 {
  0% { transform: translate(0, 0); }
  15% { transform: translate(30px, 25px); }
  30% { transform: translate(50px, 40px); }
  45% { transform: translate(40px, 55px); }
  60% { transform: translate(10px, 45px); }
  75% { transform: translate(-25px, 25px); }
  90% { transform: translate(-15px, 5px); }
  100% { transform: translate(0, 0); }
}
```

---

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Timing function | `ease-in-out` (pauses) | `linear` (constant speed) |
| Keyframe count | 4-5 points | 8-9 points |
| Motion path | Zig-zag with stops | Smooth elliptical/organic loops |
| Direction changes | Abrupt reversals | Gradual curved transitions |

---

## Visual Result

The blobs will now move in smooth, continuous organic paths - like leaves floating on water or clouds drifting - with no visible stops or direction-change pauses. The movement will feel fluid and "plastic" as requested.

