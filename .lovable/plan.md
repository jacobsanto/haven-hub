
# Expand Font Options to 25 Per Category

## Overview

Increase the font selection options from the current 6 heading fonts and 7 body fonts to **25 fonts each**, giving users extensive typography customization options.

---

## Current State

| Category | Count |
|----------|-------|
| Heading Fonts | 6 |
| Body Fonts | 7 |
| **Total** | **13** |

---

## New Font Lists

### Heading Fonts (25 Serif/Display Fonts)

| # | Font Name | Style |
|---|-----------|-------|
| 1 | Playfair Display | Transitional serif |
| 2 | Cormorant Garamond | Elegant serif |
| 3 | Lora | Contemporary serif |
| 4 | Merriweather | Screen-optimized serif |
| 5 | Crimson Text | Old-style serif |
| 6 | Libre Baskerville | Classic serif |
| 7 | Georgia | System serif |
| 8 | DM Serif Display | Modern display |
| 9 | Spectral | Elegant serif |
| 10 | Fraunces | Variable display |
| 11 | Abril Fatface | Bold display |
| 12 | Josefin Slab | Slab serif |
| 13 | EB Garamond | Classic Garamond |
| 14 | Sorts Mill Goudy | Old-style serif |
| 15 | Bitter | Slab serif |
| 16 | Vollkorn | Baroque serif |
| 17 | Cardo | Classical serif |
| 18 | Neuton | Contemporary serif |
| 19 | Alegreya | Calligraphic serif |
| 20 | Gentium Book Plus | Humanist serif |
| 21 | Source Serif Pro | Adobe serif |
| 22 | PT Serif | ParaType serif |
| 23 | Noto Serif | Google serif |
| 24 | IBM Plex Serif | IBM design |
| 25 | Zilla Slab | Mozilla slab |

### Body Fonts (25 Sans-Serif Fonts)

| # | Font Name | Style |
|---|-----------|-------|
| 1 | Lato | Humanist sans |
| 2 | Montserrat | Geometric sans |
| 3 | Inter | UI-optimized |
| 4 | Open Sans | Humanist sans |
| 5 | Source Sans Pro | Adobe sans |
| 6 | Nunito | Rounded sans |
| 7 | Roboto | Neo-grotesque |
| 8 | Work Sans | Geometric sans |
| 9 | Poppins | Geometric sans |
| 10 | Raleway | Elegant sans |
| 11 | Karla | Grotesque sans |
| 12 | Cabin | Humanist sans |
| 13 | Rubik | Rounded sans |
| 14 | DM Sans | Geometric sans |
| 15 | Plus Jakarta Sans | Modern sans |
| 16 | Outfit | Modern sans |
| 17 | Mulish | Minimalist sans |
| 18 | Quicksand | Rounded sans |
| 19 | Barlow | Rounded grotesque |
| 20 | Manrope | Modern sans |
| 21 | Sora | Geometric sans |
| 22 | Space Grotesk | Display sans |
| 23 | Albert Sans | Geometric sans |
| 24 | Red Hat Display | Red Hat design |
| 25 | Figtree | Modern sans |

---

## Implementation

### File to Modify
`src/pages/admin/AdminSettings.tsx`

### Changes

**Update HEADING_FONTS array (lines 15-22):**
Replace 6 fonts with 25 serif/display fonts.

**Update BODY_FONTS array (lines 24-32):**
Replace 7 fonts with 25 sans-serif fonts.

---

## Technical Details

### Google Fonts Compatibility
All 50 fonts are available on Google Fonts and will be dynamically loaded by the existing `loadGoogleFont()` function in `BrandContext.tsx` when selected.

### Files Changed
- `src/pages/admin/AdminSettings.tsx` (1 file)

### Final Count

| Category | Before | After |
|----------|--------|-------|
| Heading Fonts | 6 | 25 |
| Body Fonts | 7 | 25 |
| **Total** | **13** | **50** |
