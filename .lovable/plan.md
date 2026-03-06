

## Fix: Properties Page Hero Background Image

### Problem
The `PropertiesHeroBanner` background image is effectively invisible because it uses `blur-[80px] brightness-[0.15]` — an extreme blur and near-black brightness. This was designed as an "ambient tint" but visually reads as no image at all. Additionally, the image source depends on the first property's `hero_image_url`, which may be `undefined` during loading.

### Changes

**`src/components/properties/PropertiesHeroBanner.tsx`**:
- Reduce the blur and increase brightness on the background image layer so it's visible as a soft atmospheric backdrop (e.g. `blur-[40px] brightness-[0.35] saturate-75`)
- Add a visible semi-transparent hero image layer behind the text (lightly darkened, not blurred to oblivion)
- Ensure the Unsplash fallback image always loads when no property image is available
- Keep the gradient overlay for text legibility

The result will match the Arivia design system's ambient blurred hero pattern used on other pages — visible but not distracting, with clear text contrast.

