
# Rename to Arivia Villas + Brand Customization Admin

This plan covers two changes:
1. **Rename the brand** from "HavenStay" to "Arivia Villas" across the entire application
2. **Add a Brand Settings admin section** where you can customize brand details, color palette, and fonts

---

## 1. Brand Name Update

All occurrences of "HavenStay" will be replaced with "Arivia Villas":

| Location | Current | New |
|----------|---------|-----|
| Header logo | Haven**Stay** | Arivia **Villas** |
| Admin sidebar logo | Haven**Stay** | Arivia **Villas** |
| Footer copyright | HavenStay | Arivia Villas |
| Footer email | hello@havenstay.com | hello@ariviavillas.com |
| Homepage "Why Choose" section | Why Choose HavenStay | Why Choose Arivia Villas |
| Signup page welcome message | Welcome to HavenStay | Welcome to Arivia Villas |
| Signup tagline | Join HavenStay... | Join Arivia Villas... |
| Login page | Haven**Stay** | Arivia **Villas** |
| HTML page title | Lovable App | Arivia Villas |

---

## 2. Brand Settings Database Table

A new `brand_settings` table will store customizable brand configuration:

```text
brand_settings
-------------------------------
id              (uuid, primary key)
brand_name      (text) - e.g., "Arivia Villas"
brand_tagline   (text) - optional tagline
logo_url        (text) - optional custom logo
contact_email   (text)
contact_phone   (text)
contact_address (text)
primary_color   (text) - HSL value like "16 50% 48%"
secondary_color (text)
accent_color    (text)
heading_font    (text) - e.g., "Cormorant Garamond"
body_font       (text) - e.g., "Inter"
updated_at      (timestamp)
```

**Security:** Only admins can read/update brand settings.

---

## 3. New Admin Page: Brand Settings (/admin/settings)

A new admin section with organized tabs:

### Brand Identity Tab
- Brand name input
- Brand tagline input  
- Logo upload (with preview)
- Contact email, phone, address

### Color Palette Tab
- Primary color picker (with live preview)
- Secondary color picker
- Accent color picker
- Background color picker
- Visual preview swatch panel

### Typography Tab
- Heading font selector (dropdown with Google Fonts options)
- Body font selector
- Font preview section showing sample text

### Preview Panel
- Live preview card showing how changes will look
- "Save Changes" button
- "Reset to Defaults" option

---

## 4. Dynamic Theming System

A React context and hook will apply brand settings dynamically:

```text
BrandProvider (context)
    |
    +-- useBrandSettings() hook
    |       - Fetches settings from database
    |       - Provides brand name, colors, fonts
    |
    +-- CSS Variable Injection
            - Updates :root CSS variables on load
            - Updates font imports dynamically
```

The app will:
1. Load brand settings on startup
2. Apply CSS variables for colors
3. Load custom fonts if specified
4. Use brand name throughout the UI

---

## 5. Updated Admin Navigation

The admin sidebar will include a new "Settings" section:

```text
Dashboard
Properties
Bookings
Availability
-----------
Settings (new)
  - Brand & Theme
```

---

## 6. Files to Create/Modify

**New Files:**
- `src/pages/admin/AdminSettings.tsx` - Brand settings admin page
- `src/hooks/useBrandSettings.ts` - Hook for fetching/updating brand settings
- `src/contexts/BrandContext.tsx` - Context provider for brand theming
- `src/components/admin/settings/BrandIdentityForm.tsx` - Brand identity form
- `src/components/admin/settings/ColorPaletteForm.tsx` - Color picker form
- `src/components/admin/settings/TypographyForm.tsx` - Font selector form
- `src/components/ui/color-picker.tsx` - Custom color picker component

**Modified Files:**
- `src/components/layout/Header.tsx` - Use dynamic brand name
- `src/components/layout/Footer.tsx` - Use dynamic brand name + contact info
- `src/components/admin/AdminLayout.tsx` - Add Settings nav item + dynamic logo
- `src/pages/Index.tsx` - Use dynamic brand name
- `src/pages/Login.tsx` - Use dynamic brand name
- `src/pages/Signup.tsx` - Use dynamic brand name
- `src/App.tsx` - Add BrandProvider wrapper + new route
- `index.html` - Update title to "Arivia Villas"

---

## 7. Technical Details

### Database Migration
Creates the `brand_settings` table with:
- Single-row design (only one brand configuration)
- RLS policies for admin-only access
- Default values matching current "warm organic" theme

### Color Picker
A user-friendly color selection interface that:
- Shows a visual color picker
- Displays HSL values
- Provides preset color swatches for the warm organic palette
- Shows live preview of the selected color

### Font Selection
Dropdown with curated Google Fonts options:
- Heading fonts: Cormorant Garamond, Playfair Display, Lora, Merriweather
- Body fonts: Inter, Open Sans, Lato, Source Sans Pro

### CSS Variable Updates
When settings load, the app will update CSS variables in the document:
```javascript
document.documentElement.style.setProperty('--primary', settings.primary_color);
```

---

## Summary

| Task | Description |
|------|-------------|
| Rename brand | Update all "HavenStay" references to "Arivia Villas" |
| Database table | Create `brand_settings` table with RLS |
| Admin UI | New settings page with 3 tabs (Identity, Colors, Typography) |
| Dynamic theming | Context + hook to apply settings across the app |
| Live preview | Settings changes preview before saving |
