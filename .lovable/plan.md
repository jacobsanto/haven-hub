

# Homepage Color & Contrast Audit

## Current Section-by-Section Breakdown

```text
Section               Background Token    Text Tokens Used
─────────────────────────────────────────────────────────────
Hero                  bg-background       foreground, muted-foreground
Search Bar Overlay    bg-background       foreground, muted-foreground, accent
Trust Section         bg-muted            foreground, muted-foreground, accent
Destinations          bg-background       foreground, muted-foreground, accent
Discover Villas       bg-background       foreground, muted-foreground, accent
Featured Vacations    bg-muted            foreground, muted-foreground, accent
Live Experiences      bg-muted            foreground, muted-foreground, accent
Testimonials          bg-background       foreground, muted-foreground, accent
Why Direct            bg-muted            foreground, muted-foreground, accent
CTA                   bg-background       foreground, muted-foreground, accent
```

---

## PROS (What's Working)

1. **Consistent semantic tokens** -- All sections use the same token vocabulary (`foreground`, `muted-foreground`, `accent`). No hardcoded hex colors remain on the homepage.
2. **Alternating rhythm** -- Sections alternate between `bg-background` and `bg-muted`, giving visual separation.
3. **Accent usage is disciplined** -- Gold/accent is reserved for labels, icons, CTAs, and emphasized words. It draws the eye without overwhelming.
4. **Card surfaces** -- Cards use `bg-card` with `border-border`, providing subtle depth against both `bg-background` and `bg-muted` parents.

---

## CONS (Readability & Contrast Problems)

### 1. Hero text over photo -- low contrast risk
The hero overlays `text-foreground` (navy) and `text-muted-foreground` on a semi-transparent photo. With light theme defaults:
- **foreground = navy (#2B2664)** on a photo with only 50% opacity and a light 30/15/40% gradient is hard to read when the photo is bright.
- The text relies on the photo being dark enough, which varies per property image.

### 2. `muted-foreground` is too faint
`muted-foreground` is `hsl(243 10% 62%)` -- a mid-grey. On `bg-muted` (pale blue `hsl(243 29% 86%)`), the contrast ratio is approximately **2.8:1**, which **fails WCAG AA** for body text (requires 4.5:1). This affects:
- Trust Section descriptions
- Featured Vacation location labels  
- Why Direct body paragraph
- Experience card descriptions

### 3. Two consecutive `bg-muted` sections
**Featured Vacations → Live Experiences → Why Direct** are all `bg-muted`. Three muted sections back-to-back with only `border-t border-b` separators makes the page feel monotonous and the sections blur together visually.

### 4. `accent` on `bg-background` is borderline
The accent color (`hsl(32 48% 66%)` -- a muted gold) on white background (`hsl(0 0% 100%)`) has a contrast ratio of roughly **2.5:1**. This fails WCAG AA for the small uppercase labels like "Explore", "Properties", "Curated", "Summer 2026".

### 5. Search bar shadow uses hardcoded rgba
`SearchBarOverlay.tsx` line 31 still has `boxShadow: '0 20px 60px rgba(0,0,0,0.4)'` -- a hardcoded black shadow that won't adapt to light/dark themes.

### 6. Featured Vacation card overlay text
The gradient overlay on the tall property cards uses `from-background/85` which makes text readable, but `text-muted-foreground` for location text on a photo gradient is still risky. On light theme, this is pale grey over a semi-transparent white-to-photo gradient.

---

## SUGGESTIONS TO FIX

### Fix 1: Boost `muted-foreground` contrast
Change `--muted-foreground` from `243 10% 62%` to something darker like `243 10% 48%`. This single change fixes readability across every section that uses `text-muted-foreground` on `bg-muted` or `bg-background`.

### Fix 2: Fix the alternating background rhythm
Reorder or reassign backgrounds so no more than two consecutive sections share the same surface:
```text
Hero              bg-background  (photo)
Search            bg-background
Trust             bg-muted        ← muted
Destinations      bg-background   ← background
Discover Villas   bg-muted        ← CHANGE to muted
Featured Vacation bg-background   ← CHANGE to background
Live Experiences  bg-muted        ← stays muted
Testimonials      bg-background   ← stays
Why Direct        bg-muted        ← stays
CTA               bg-background   ← stays
```
This creates a clean A-B-A-B alternation.

### Fix 3: Darken accent labels or switch to `foreground`
The small uppercase labels ("Explore", "Curated", etc.) using `text-accent` on white fail contrast. Two options:
- **Option A**: Use a darker accent-derived color (e.g., `text-primary` or `text-foreground`) for these labels
- **Option B**: Darken the accent token slightly (lower lightness from 66% to ~50%)

### Fix 4: Hero text safety
Add a stronger text shadow or a dark scrim behind the text column to ensure readability regardless of which property photo is active. A subtle `text-shadow` or a localized gradient panel behind the left text column would guarantee contrast.

### Fix 5: Replace hardcoded search bar shadow
Change the inline `rgba(0,0,0,0.4)` shadow to use the semantic foreground token: `hsl(var(--foreground) / 0.15)` for light mode compatibility.

### Fix 6: Featured Vacation overlay location text
Switch location labels inside photo overlays from `text-muted-foreground` to `text-foreground/80` to ensure they remain visible against the gradient.

---

## Summary of File Changes

| File | Change |
|---|---|
| `src/index.css` | Adjust `--muted-foreground` lightness for better contrast |
| `src/components/home/DiscoverVillasSection.tsx` | Change `bg-background` → `bg-muted` |
| `src/components/home/FeaturedVacationSection.tsx` | Change `bg-muted` → `bg-background`, fix overlay location text color |
| `src/components/home/SearchBarOverlay.tsx` | Replace hardcoded rgba shadow with semantic token |
| `src/components/home/HeroSection.tsx` | Add text-shadow or scrim for text readability safety |

Total: ~10 targeted line changes across 5 files. No logic changes, purely visual/contrast improvements.

