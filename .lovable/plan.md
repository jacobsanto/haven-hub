

# Apply Uploaded Hero Slider Designs + Admin Hero Style Selector

## Summary

The uploaded file contains 6 distinct hero slider styles (Parallax Depth, Split Reveal, Morph Tiles, Cinematic Ken Burns, Vertical Curtain, Dark Card Deck). The current hero uses a custom "Card Deck" implementation. The plan is to port all 6 slider styles into the project as selectable hero variants, and add an admin setting to choose which style is active on the live site.

## What Changes

### 1. Database: Add `hero_style` setting
Insert a new row into `hero_settings` with key `hero_style` and default value `card-deck` (the current style). This uses the existing key-value table -- no schema change needed, just a data migration.

### 2. New Component: `src/components/home/hero/HeroSliderVariants.tsx`
Port all 6 slider styles from the uploaded JSX file, adapted to:
- Use real property data (from `useFeaturedProperties`) instead of hardcoded slides
- Use Tailwind classes instead of inline styles where practical
- Respect `prefers-reduced-motion`
- Keep the existing dark aesthetic (CSS variables `--bg`, `--sand`, etc. replaced with Tailwind theme tokens)

Each slider becomes a named export: `ParallaxDepthHero`, `SplitRevealHero`, `MorphTilesHero`, `CinematicHero`, `VerticalCurtainHero`, `CardDeckHero`.

### 3. Update `src/components/home/HeroSection.tsx`
- Read `hero_style` from `useHeroSettings()`
- Map the setting value to the corresponding slider component
- Render the selected variant, passing properties, navigation callbacks, and autoplay state
- Keep existing footer bar (social icons, dots, prev/next) as a shared overlay

### 4. Update `src/hooks/useHeroSettings.ts`
- Add `hero_style` to the `DEFAULTS` map (default: `'card-deck'`)
- Expose `heroStyle` in the return object

### 5. Update Admin Settings: Expand `HeroImageSection` in `src/pages/admin/AdminSettings.tsx`
- Rename to "Homepage Hero" (already done)
- Add a **Hero Style** selector: a visual grid of 6 cards (thumbnail + name) representing each slider style
- Each card shows a small static preview/icon and the style name
- Clicking saves the `hero_style` key via `useHeroSettingsMutations`
- Show a toast confirming the change -- the frontend will pick it up on next query refresh
- Keep the existing hero background image upload below the style selector

### Slider Style IDs & Names
| ID | Name | Description |
|---|---|---|
| `parallax-depth` | Parallax Depth | Full-bleed image with parallax scroll + bottom-left text |
| `split-reveal` | Split Reveal | 55/45 split with clip-path reveal animation |
| `morph-tiles` | Morph Tiles | 4-column grid that morphs active tile to full-bleed |
| `cinematic` | Cinematic | Ken Burns zoom with centered text overlay |
| `vertical-curtain` | Vertical Curtain | Vertical clip-path wipe with side nav dots |
| `card-deck` | Card Deck | Current dark minimalist stacked cards (default) |

## Technical Details

- All 6 sliders share the same `properties` array, `goTo`/`goNext`/`goPrev` callbacks, and autoplay timer from `HeroSection`
- The shared footer bar (social links, dot indicators, prev/next arrows) stays outside the slider component
- Each slider receives props: `properties`, `activeIndex`, `onSelect`, `prefersReduced`
- The search bar overlay remains conditionally rendered based on `showSearchBar` setting
- No new database tables needed -- reuses `hero_settings` key-value store
- Migration: `INSERT INTO hero_settings (key, value) VALUES ('hero_style', 'card-deck') ON CONFLICT DO NOTHING`

## Files Changed
1. `src/components/home/hero/HeroSliderVariants.tsx` -- **new** (all 6 slider components)
2. `src/components/home/HeroSection.tsx` -- switch renderer based on `heroStyle`
3. `src/hooks/useHeroSettings.ts` -- expose `heroStyle`
4. `src/pages/admin/AdminSettings.tsx` -- add style selector grid to `HeroImageSection`
5. Database migration -- insert `hero_style` default row

