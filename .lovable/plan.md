

## Fix Destinations Hero to Match Properties Hero Effects

The Destinations page hero is visually inconsistent with the rest of the site. It uses an overly aggressive blur (80px) that nearly destroys the background image, has no grain overlay, and no text shadow. The Properties hero and homepage hero both have these refinements.

### Changes

**File: `src/pages/Destinations.tsx`**

1. **Reduce background blur** — Change `blur-[80px]` to `blur-sm` and `brightness-[0.15]` to something gentler (matching Properties hero style with `bg-cover bg-center` approach).

2. **Add grain overlay** — Import and add `GrainOverlay` component (same as Properties hero).

3. **Add text shadow** — Add `textShadow: '0 1px 1px rgba(0,0,0,0.2)'` to the text container (matching Properties hero).

4. **Adjust gradient overlay** — Update from `from-background/40 to-background` to `from-background/90 via-background/70 to-background` (matching Properties hero pattern for better legibility while showing more of the image).

5. **Ensure "Explore" label uses accent color** — Already using `text-accent`, consistent with Properties hero's "Our Collection".

### Result

The Destinations hero will have the same layered depth system as the Properties hero: visible but softened background image, grain texture, gradient scrim, and subtle text shadow. This creates visual consistency across all page heroes.

