

## Properties Hero — Add Visible Background Image

### Problem
The `PropertiesHeroBanner` applies `blur-[40px] brightness-[0.35]` to the background image, making it completely unrecognizable. The hero section looks like a plain colored background with no visible photo.

### Solution
Reduce the blur and brighten the image so the photo is clearly visible behind the text, while keeping enough overlay for text readability. This matches the ambient cinematic hero pattern used across the rest of the site.

### Changes

**`src/components/properties/PropertiesHeroBanner.tsx`**:
- Change the background div from `blur-[40px] brightness-[0.35]` to `blur-[2px] brightness-[0.45]` — this keeps a slight cinematic softness while making the actual photo clearly visible
- Adjust the gradient overlay to ensure text remains readable: `from-background/80 via-background/40 to-background`
- Increase section padding slightly for a more impactful hero feel

This is a single-file change to the existing component. The image URL source (from `usePageContent` or the default Unsplash fallback) stays the same — the admin can still change it via Admin → Page Content → Properties → Page Header.

