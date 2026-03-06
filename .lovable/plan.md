

## Plan: Replace hero slider variants with Bright Minimalist Micro Slider

The uploaded file is a "Bright Minimalist" hero slider with a light/bright aesthetic — left-side typography + right-side stacked color cards, bottom nav with prev/next buttons and dot indicators.

### Changes

**1. New file: `src/components/home/hero/BrightMinimalistHero.tsx`**
- Adapt the uploaded component to fit the existing `SliderProps` interface (takes `properties`, `activeIndex`, `onSelect`)
- Use real property data instead of hardcoded slides
- Map property accent colors (generate from index or use a predefined palette)
- Use semantic tokens (foreground, muted-foreground, accent) and Tailwind classes where possible
- Include the stacked card deck on the right with color-tinted backgrounds
- Left side shows property name, location, description with animated transitions
- Built-in bottom navigation (prev/next arrows + dot indicators) — these will live inside the variant since the layout differs significantly from the dark variants
- Use `useFormatCurrency` for pricing display
- Include `Link` to property detail page

**2. Update `src/components/home/hero/HeroSliderVariants.tsx`**
- Export `BrightMinimalistHero` from this file (or import and re-export)

**3. Update `src/components/home/HeroSection.tsx`**
- Add `'bright-minimalist': BrightMinimalistHero` to `SLIDER_MAP`
- When `heroStyle === 'bright-minimalist'`, render this variant (the existing SLIDER_MAP pattern handles this automatically)
- The bright variant has its own navigation UI, so the shared footer bar should be hidden when this variant is active

**4. Update `src/pages/admin/AdminSettings.tsx`**
- Add entry to `HERO_STYLES` array:
  `{ id: 'bright-minimalist', name: 'Bright Minimalist', desc: 'Light split layout with color-tinted stacked cards' }`

**5. Update `src/hooks/useHeroSettings.ts`**
- No changes needed — the default `hero_style` value stays `'card-deck'`, and the new variant is just another option in the map.

### Key Adaptation Details
- The uploaded file uses hardcoded `color` and `lightBg` per slide. We'll create a small color palette array and cycle through it based on property index.
- The grid overlay, counter pill (top-right), and bottom nav from the uploaded file will be included inside the variant component.
- The component background will be light (`bg-gradient-to-b from-white via-gray-50 to-gray-100`) — this is intentional as a "bright" alternative to the dark variants.
- Mobile: stack vertically (text on top, cards below) or hide cards on mobile.

