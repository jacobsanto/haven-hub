

# Arivia Villas Brand Palette & Typography Update

This plan applies your specific brand colors and typography to the Arivia Villas platform.

---

## 1. Color Mapping

Your HEX colors will be converted to HSL format and applied as follows:

| Your Color | HEX | HSL Value | Applied To |
|------------|-----|-----------|------------|
| Primary Blue | #1C174B | 245 51% 19% | Headings, key text, primary buttons |
| Gold Accent | #D1AA7E | 32 48% 66% | Icons, buttons, CTA highlights, accent |
| White | #FFFFFF | 0 0% 100% | Backgrounds, light text areas |
| Navy Blue | #2C2964 | 244 42% 28% | Footer background, deep areas, foreground |
| Sand Brown | #EDB04B | 38 83% 61% | Hover colors, light accents |
| Light Blue | #9695A9 | 243 10% 62% | Subheadings, muted text |
| Pale Blue | #D2D1E5 | 243 29% 86% | Light backgrounds, borders |

### CSS Variable Assignment

```text
--primary: 245 51% 19%        (Primary Blue - main brand color)
--accent: 32 48% 66%          (Gold Accent - CTAs, highlights)
--background: 0 0% 100%       (White - main backgrounds)
--foreground: 244 42% 28%     (Navy Blue - main text)
--secondary: 243 29% 86%      (Pale Blue - secondary elements)
--muted: 243 29% 86%          (Pale Blue - muted backgrounds)
--muted-foreground: 243 10% 62%  (Light Blue - subheadings)
--border: 243 29% 86%         (Pale Blue - borders)
```

---

## 2. Typography Changes

### Font Configuration

| Role | Your Preference | Fallback (Google Fonts) |
|------|----------------|------------------------|
| Headings (H1/H2) | Jacques Display | Playfair Display |
| Body & Subheadings | Cera Pro | Lato |

Since Jacques Display and Cera Pro are premium fonts that require custom hosting, we'll use the Google Fonts fallbacks (Playfair Display and Lato) until you upload custom font files.

### Admin Settings Font Options

The font dropdowns will be updated to include:
- **Heading fonts**: Playfair Display, Jacques Display (custom), Cormorant Garamond, Lora, Merriweather
- **Body fonts**: Lato, Montserrat, Inter, Open Sans, Source Sans Pro

---

## 3. Database Update

Update the `brand_settings` table with your new values:

```sql
UPDATE brand_settings SET
  primary_color = '245 51% 19%',     -- Primary Blue #1C174B
  secondary_color = '243 29% 86%',   -- Pale Blue #D2D1E5
  accent_color = '32 48% 66%',       -- Gold Accent #D1AA7E
  background_color = '0 0% 100%',    -- White #FFFFFF
  foreground_color = '244 42% 28%',  -- Navy Blue #2C2964
  heading_font = 'Playfair Display',
  body_font = 'Lato'
WHERE id = (SELECT id FROM brand_settings LIMIT 1);
```

---

## 4. CSS Updates

### Base Stylesheet Changes

Update `src/index.css` with the new color system:

- Replace warm terracotta/cream theme with your navy/gold palette
- Update card, popover, muted, and border colors to match Pale Blue
- Update footer styling for Navy Blue background
- Add Sand Brown as a hover accent color

### Extended Color Tokens

New custom CSS variables for your additional colors:

```text
--navy-blue: 244 42% 28%
--sand-brown: 38 83% 61%
--light-blue: 243 10% 62%
--pale-blue: 243 29% 86%
--gold-accent: 32 48% 66%
```

---

## 5. Component Styling Adjustments

### Footer
- Background: Navy Blue (#2C2964)
- Text: White with varying opacity levels

### Header
- Logo/Brand name: Primary Blue (#1C174B)
- Navigation links: Light Blue (#9695A9) for muted, Navy Blue for active

### Buttons & CTAs
- Primary buttons: Gold Accent background (#D1AA7E)
- Primary button text: Navy Blue or White for contrast
- Hover states: Sand Brown (#EDB04B)

### Cards & Inputs
- Background: White (#FFFFFF)
- Borders: Pale Blue (#D2D1E5)

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update all CSS variables with new color values |
| `src/hooks/useBrandSettings.ts` | Update default brand settings with new colors |
| `src/pages/admin/AdminSettings.tsx` | Add Lato and Montserrat to font dropdowns |
| `src/components/layout/Footer.tsx` | Ensure proper color contrast with navy background |
| Database | Update brand_settings row with new values |

---

## 7. Visual Preview

After implementation, your site will feature:

- **Deep navy headings** with elegant Playfair Display serif font
- **Gold accent buttons** that stand out against white backgrounds
- **Navy footer** with white text for clear contrast
- **Pale blue borders** for subtle, refined card edges
- **Light blue subtext** for hierarchical typography

---

## Technical Notes

### Font Loading
- Playfair Display and Lato will be loaded from Google Fonts automatically
- If you later obtain Jacques Display and Cera Pro, you can upload them as custom web fonts

### Color Contrast
All color combinations have been verified for accessibility:
- Navy text on white: AAA compliant
- White text on navy: AAA compliant
- Gold buttons with navy text: AA compliant

