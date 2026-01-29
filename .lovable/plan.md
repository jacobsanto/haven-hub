

# Increase Floating Blob Animation Range

## Overview

Increase the movement range of the floating blob animations from the current subtle 15-25px to a more noticeable 40-60px range.

---

## Implementation

### File: `src/index.css`

Update the three `@keyframes` definitions with larger translate values:

**float-diagonal-1** (lines 261-266):
```css
@keyframes float-diagonal-1 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(40px, -50px); }
  50% { transform: translate(60px, 25px); }
  75% { transform: translate(-30px, 45px); }
}
```

**float-diagonal-2** (lines 268-273):
```css
@keyframes float-diagonal-2 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-50px, 40px); }
  50% { transform: translate(30px, 60px); }
  75% { transform: translate(45px, -35px); }
}
```

**float-diagonal-3** (lines 275-279):
```css
@keyframes float-diagonal-3 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(45px, 45px); }
  66% { transform: translate(-40px, 30px); }
}
```

---

## Comparison

| Keyframe | Before | After |
|----------|--------|-------|
| float-diagonal-1 | 15-25px range | 40-60px range |
| float-diagonal-2 | 10-25px range | 35-60px range |
| float-diagonal-3 | 12-18px range | 30-45px range |

---

## Result

The decorative blobs will now have more pronounced diagonal movement while maintaining smooth, ambient motion with the same 18-25 second animation durations.

