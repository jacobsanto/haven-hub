

# Fix Guesty Widget: Correct URLs and API + Pre-populate Settings

## What's Wrong

Two bugs prevent the widget from working:

1. **Wrong CDN URLs** -- Code uses `guesty-assets/search-bar/` but the real path from your snippet is `guesty-frontend-production/`
2. **Wrong initialization API** -- Code calls `GuestySearchBarWidget(containerId, config)` but the actual Guesty API is `GuestySearchBarWidget.create(config)` -- the widget finds its own container div automatically by the `search-widget_XXX` ID

## Changes

### 1. Fix GuestyBookingWidget.tsx

Update the `loadWidget` function:
- CSS URL: `guesty-frontend-production/search-bar-production.css`
- JS URL: `guesty-frontend-production/search-bar-production.js`
- Change both initialization calls from `win.GuestySearchBarWidget(containerId, config)` to `win.GuestySearchBarWidget.create(config)`

### 2. Pre-populate your Guesty settings in the database

Insert your actual configuration so the widget works immediately without manual setup:
- **Widget ID**: `IO312PWQ`
- **Site URL**: `ariviavillas.guestybookings.com`
- **Accent Color**: `#d1aa7e`
- **Enabled**: `true`

## What Does NOT Change

- Admin Integrations tab UI stays the same
- Per-property override logic stays the same
- CSS brand overrides stay the same
- PropertyDetail conditional rendering stays the same
- No schema changes needed

