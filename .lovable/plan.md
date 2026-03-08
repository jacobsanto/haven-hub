

# Brand Guidelines Adoption Plan

## What the Document Specifies

The Arivia Brand Guidelines define a complete visual identity centered on the Santorini/Aegean Mediterranean aesthetic, replacing the current "dark cinematic" system with a light, clean, blue-and-gold Mediterranean look.

### Key Differences from Current Implementation

| Element | Current | Brand Guidelines |
|---|---|---|
| **Primary color** | Purple-blue `hsl(245,51%,19%)` | Aegean Navy `#1A3A5C` = `hsl(209,55%,23%)` |
| **Accent color** | Generic gold `hsl(32,48%,66%)` | Copper Gold `#C4956A` = `hsl(26,42%,59%)` |
| **Foreground** | `hsl(244,42%,28%)` | Dark Text `#2C3E50` = `hsl(210,29%,24%)` |
| **Secondary** | `hsl(243,29%,86%)` | Warm Beige `#F5F0EB` = `hsl(30,33%,94%)` |
| **Muted** | `hsl(243,29%,86%)` | Soft Gray `#ECF0F1` = `hsl(192,15%,94%)` |
| **Border** | `hsl(243,29%,86%)` | Soft Gray `hsl(192,15%,94%)` |
| **Ring** | `hsl(32,48%,66%)` | Ocean Teal `#2B7A9E` = `hsl(199,57%,39%)` |
| **Destructive** | `hsl(27,24%,58%)` | Terracotta `#E67E22` = `hsl(28,80%,52%)` |
| **Heading font** | Fira Serif | Montserrat (geometric sans-serif) |
| **Body font** | Fira Sans | Nunito Sans (humanist sans-serif) |
| **Tagline** | "Luxury Living, Redefined" | "Live Like a Local" |
| **Heading weight** | 500 (medium) | 600-700 (semi-bold to bold per hierarchy) |
| **Logo** | None set | Oval emblem + "ARIVIA" logotype (image available) |
| **Email brand colors** | Gold `#d4a24e` / Charcoal `#302e33` | Copper Gold `#C4956A` / Aegean Navy `#1A3A5C` |
| **Button style** | Current rounded | Aegean Navy fill, white text, ~25px border-radius |

---

## Implementation Plan

### 1. Copy Logo Asset
Copy the brand logo from the parsed document into `src/assets/arivia-logo.jpg` for use in headers and email templates.

### 2. Update Default Brand Settings (`src/hooks/useBrandSettings.ts`)
Replace the `defaultBrandSettings` color values, fonts, tagline, and weights with the brand guideline values:
- `primary_color` → `209 55% 23%` (Aegean Navy)
- `secondary_color` → `30 33% 94%` (Warm Beige)
- `accent_color` → `26 42% 59%` (Copper Gold)
- `background_color` → `0 0% 100%` (Pure White, unchanged)
- `foreground_color` → `210 29% 24%` (Dark Text)
- `muted_color` → `192 15% 94%` (Soft Gray)
- `card_color` → `0 0% 100%` (White, unchanged)
- `border_color` → `192 15% 94%` (Soft Gray)
- `destructive_color` → `28 80% 52%` (Terracotta)
- `ring_color` → `199 57% 39%` (Ocean Teal)
- `heading_font` → `Montserrat`
- `body_font` → `Nunito Sans`
- `brand_tagline` → `Live Like a Local`
- `heading_weight` → `600`

### 3. Update CSS Variables (`src/index.css`)
Update the `:root` light-mode CSS custom properties to match the new brand defaults. Update `.dark` mode to derive dark-mode equivalents from the new Aegean palette (deep navy backgrounds, lighter foregrounds).

### 4. Update Font Preloading (`index.html`)
Replace the Fira Sans/Fira Serif Google Fonts preload with Montserrat + Nunito Sans at the required weights (300-700).

### 5. Update Tailwind Font Families (`tailwind.config.ts`)
Change the `fontFamily.serif` and `fontFamily.sans` fallback stacks to reference the new fonts while keeping `var(--font-serif)` / `var(--font-sans)` as the primary (which BrandContext controls dynamically).

### 6. Update Email Templates (all 6 templates in `supabase/functions/_shared/email-templates/`)
Replace color constants across all templates:
- `gold` (#d4a24e) → Copper Gold (#C4956A)
- `darkCharcoal` (#302e33) → Aegean Navy (#1A3A5C)
- `mutedGray` (#86838c) → Muted Gray (#7F8C8D)
- Font families: replace `Fira Sans`/`Fira Serif` with `Nunito Sans`/`Montserrat`
- Update button background from gold to Aegean Navy (#1A3A5C) with white text (matching the "Primary buttons use Aegean Navy fill" guideline)

### 7. Update Auth Email Hook (`supabase/functions/auth-email-hook/index.ts`)
Update `SITE_NAME` from `"tranquil-stays-core"` to `"Arivia"` and the from address to use "Arivia" as the sender name.

### 8. Update HTML Meta Tags (`index.html`)
- Title: `"Arivia | Live Like a Local"` 
- Description: align with brand voice (warm, personal, Santorini-focused)

---

## Scope Boundaries
- This plan updates **defaults and CSS fallbacks** only. Since the BrandContext dynamically applies colors from the database `brand_settings` table, the admin dashboard will continue to override these defaults if customized. The defaults ensure new/fresh instances match the brand guidelines.
- The dark-mode palette will be recalibrated to use deep Aegean Navy tones instead of the current purple-charcoal.
- No structural/layout changes are included -- only color, typography, and copy alignment.

