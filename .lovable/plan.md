

## Remove City References from Hero Section

### Problem
Line 147 of `src/pages/Index.tsx` renders: `{hero.heading_prefix} {heroProperty?.city || brandName}`

When you clear the "Heading Prefix" field in admin, the city name ("Fira") still shows because it's hardcoded as a separate part of the heading. The subtitle also substitutes `{city}` and `{country}` placeholders with the property's location data.

### Changes

**File: `src/pages/Index.tsx`**

1. **Line 147 (heading)**: Replace `{hero.heading_prefix} {heroProperty?.city || brandName}` with `{hero.heading_prefix || brandName}` -- shows the prefix text if set, otherwise falls back to the brand name. No city reference.

2. **Lines 150-154 (subtitle)**: Replace the conditional city/country substitution with just `{hero.subtitle_default}` -- always shows the default subtitle text regardless of whether a featured property is loaded.

### Result
- If heading prefix is "Experience": shows "Experience"
- If heading prefix is empty: shows brand name (e.g. "Arivia Villas")
- Subtitle always shows the default text (e.g. "Discover extraordinary vacation homes around the world")
- "Fira" will no longer appear anywhere in the hero text
