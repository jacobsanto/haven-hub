

# Embed Guesty Booking Engine Widget Into Haven Hub

## What This Does

Brings Guesty's external booking engine widget into your Haven Hub site, wrapped in your brand design so it looks like a native part of your platform. Guests see your fonts, colors, and layout -- but the booking calendar, availability, and checkout are powered by Guesty behind the scenes.

## How Guesty's Widget Works

Guesty provides a script snippet like this:

```text
<div id="search-widget_XXXX"></div>
<script>
  !function(e,t,a,n,c,r){ ... }(
    window, document, "GuestySearchBarWidget",
    "https://s3.amazonaws.com/.../search-bar-production.css",
    "https://s3.amazonaws.com/.../search-bar-production.js",
    { "siteUrl": "yoursite.guestybookings.com", "color": "#e2c2a1" }
  );
</script>
```

We load this inside your site, then apply CSS overrides to make it match your "Midday Clarity" design language.

## What Gets Built

### 1. Database: Store Guesty Widget Config

A new `guesty_widget_settings` table stores the global Guesty embed configuration:

- `id` (uuid, primary key)
- `site_url` (text) -- e.g. "yoursite.guestybookings.com"
- `widget_id` (text) -- the Guesty widget container ID suffix
- `accent_color` (text, nullable) -- override color passed to Guesty
- `enabled` (boolean, default true)
- `created_at` / `updated_at` timestamps

Plus an optional `guesty_widget_id` column on the `properties` table for per-property widget overrides.

RLS: admin-only read/write.

### 2. New Component: `GuestyBookingWidget`

**New file: `src/components/booking/GuestyBookingWidget.tsx`**

A React component that:
- Fetches the Guesty widget settings from the database
- Dynamically injects the Guesty script and CSS into the DOM via `useEffect`
- Renders a container `div` with the correct widget ID
- Wraps the widget in a styled Card that matches your brand (rounded corners, shadows, typography)
- Applies CSS overrides via a `<style>` tag to restyle Guesty's elements (fonts, button colors, input styles) to match your brand settings from `BrandContext`
- Shows a loading skeleton while the script loads
- Shows an error state if the widget fails to load or is not configured

Props:
- `propertyId` (optional) -- for property-specific widget overrides
- `variant` -- `"inline"` (embedded in page) or `"compact"` (sidebar widget)
- `className` (optional)

### 3. CSS Override Layer

**New file: `src/components/booking/guesty-overrides.css`**

A dedicated CSS file that overrides Guesty's default styling:
- Font family overrides to use your brand heading and body fonts
- Button styling to match your primary color and border radius
- Input field styling to match your design system
- Calendar cell styling for consistency
- Responsive adjustments for mobile

These overrides use high-specificity selectors targeting Guesty's known class names, loaded after Guesty's own stylesheet.

### 4. Admin Settings: Guesty Widget Tab

**Modified file: `src/pages/admin/AdminSettings.tsx`**

Add a new "Integrations" tab (with a Plug icon) to the existing settings tabs. This tab contains:
- **Site URL** field -- your Guesty Booking Engine URL (e.g. "yoursite.guestybookings.com")
- **Widget ID** field -- the unique widget identifier from Guesty
- **Enable/Disable** toggle
- **Accent Color** override (optional, defaults to your brand primary)
- **Preview** button that renders a live preview of the widget below the form
- Instructions on where to find these values in the Guesty dashboard

### 5. Property Form: Guesty Widget Override

**Modified file: `src/pages/admin/AdminPropertyForm.tsx`**

Add a collapsible "Guesty Booking Widget" section (below the existing iCal section) that lets you optionally set a per-property Guesty widget ID. If left empty, it uses the global widget settings.

### 6. Integration Points

**Modified file: `src/pages/PropertyDetail.tsx`**

Add the `GuestyBookingWidget` alongside or as an alternative to the existing booking widget. A simple toggle based on whether Guesty widget settings exist:
- If Guesty is configured: show the `GuestyBookingWidget` (which wraps Guesty in your design)
- If not configured: show the existing native `BookingWidget` (current behavior, unchanged)

This ensures backward compatibility -- nothing breaks if Guesty is not set up.

## What Does NOT Change

- The existing native booking flow (dates, addons, guest, review, payment) remains fully functional
- PMS sync logic is untouched
- No changes to availability checks or pricing engine
- The Guesty widget handles its own availability and checkout -- this is purely an embedding integration
- All existing admin settings tabs remain unchanged

## Technical Approach

- The Guesty script is loaded dynamically (not bundled) to avoid build conflicts
- CSS overrides use your brand CSS variables (`--primary`, `--font-heading`, etc.) so they stay in sync with admin color/font changes
- The widget container uses `position: relative` with `overflow: hidden` and your brand border-radius to "mask" the external widget
- Script cleanup on unmount prevents memory leaks
- The component is behind a feature flag (the `enabled` toggle in settings) so you can turn it on/off without code changes

