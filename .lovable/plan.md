

## Fix Hero Text Contrast

### Problem
With all image effects removed, the raw background photo competes with the text. The gradient overlay (`from-background/80 via-background/40 to-background`) is too transparent in the middle, making `text-foreground`, `text-accent`, and `text-muted-foreground/60` hard to read against the bright photo.

### Solution
Strengthen the gradient overlay so text remains legible over any hero image, while the photo still shows through.

**`src/components/properties/PropertiesHeroBanner.tsx`**:
- Change gradient overlay from `from-background/80 via-background/40 to-background` to `from-background/90 via-background/70 to-background` — heavier tint ensures all text pops
- Boost subtitle text from `text-muted-foreground/60` to `text-muted-foreground` (full opacity) for better readability
- Boost stat labels from `text-muted-foreground/60` to `text-muted-foreground/80`

This keeps the photo visible in corners/edges while guaranteeing text contrast across any image.

