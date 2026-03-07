

## Header & Footer Style Switcher

### Overview
Add 8 selectable header styles and 8 selectable footer styles, controlled from the admin dashboard. The uploaded reference designs will be rebuilt as proper Tailwind components using semantic tokens — no hardcoded fonts or colors.

### Database Migration
Add two columns to `brand_settings`:
```sql
ALTER TABLE brand_settings ADD COLUMN header_style text NOT NULL DEFAULT 'default';
ALTER TABLE brand_settings ADD COLUMN footer_style text NOT NULL DEFAULT 'default';
```

### Header Variants (9 total including current)

| ID | Name | Source |
|---|---|---|
| `default` | Classic Nav | Current `Header.tsx` |
| `floating-glass` | Floating Glass | Header1 — pill-shaped glassmorphic bar |
| `split-center` | Split Center | Header2 — logo centered, nav split L/R |
| `mega-menu` | Mega Menu | Header3 — hover-reveal rich dropdowns |
| `ticker-bar` | Ticker Bar | Header4 — announcement ribbon + nav |
| `command-palette` | Command ⌘K | Header5 — spotlight search overlay |
| `dock-nav` | Dock Nav | Header6 — macOS-style bottom dock |
| `full-overlay` | Full Overlay | Header7 — hamburger → cinematic reveal |
| `contextual-strip` | Context Strip | Header8 — color strip + morphing states |

### Footer Variants (9 total including current)

| ID | Name | Source |
|---|---|---|
| `default` | Classic | Current `Footer.tsx` |
| `bento` | Bento Grid | Footer1 — asymmetric card mosaic |
| `immersive` | Immersive | Footer2 — full-bleed + cinematic CTA |
| `minimal` | Minimal | Footer3 — hover-expand columns |
| `editorial` | Editorial | Footer4 — typography-forward magazine |
| `glassmorphic` | Glassmorphic | Footer5 — frosted overlapping panels |
| `brutalist` | Brutalist | Footer6 — raw terminal anti-design |
| `chat-first` | Chat-First | Footer7 — AI concierge conversation |
| `kinetic` | Kinetic | Footer8 — scrolling ticker typography |

### Key Rules
- All variants use Tailwind classes with semantic tokens (`bg-background`, `text-foreground`, `text-accent`, `font-serif`, `font-sans`, etc.)
- No `@import url(fonts...)` — fonts come from BrandContext
- No hardcoded colors — all via CSS variables / Tailwind tokens
- Every variant pulls nav items from `useNavigationItems`, auth from `useAuth`, brand from `useBrand`
- Newsletter subscription logic reused from current Footer

### File Structure
```
src/components/layout/
├── Header.tsx                  (existing — default variant)
├── headers/
│   ├── HeaderFloatingGlass.tsx
│   ├── HeaderSplitCenter.tsx
│   ├── HeaderMegaMenu.tsx
│   ├── HeaderTickerBar.tsx
│   ├── HeaderCommandPalette.tsx
│   ├── HeaderDockNav.tsx
│   ├── HeaderFullOverlay.tsx
│   └── HeaderContextStrip.tsx
├── HeaderSwitcher.tsx          (reads brand setting, renders variant)
├── Footer.tsx                  (existing — default variant)
├── footers/
│   ├── FooterBento.tsx
│   ├── FooterImmersive.tsx
│   ├── FooterMinimal.tsx
│   ├── FooterEditorial.tsx
│   ├── FooterGlassmorphic.tsx
│   ├── FooterBrutalist.tsx
│   ├── FooterChatFirst.tsx
│   └── FooterKinetic.tsx
├── FooterSwitcher.tsx          (reads brand setting, renders variant)
└── PageLayout.tsx              (updated to use switchers)
```

### Data Flow
1. `brand_settings` stores `header_style` / `footer_style`
2. `BrandContext` exposes `headerStyle` and `footerStyle`
3. `HeaderSwitcher` / `FooterSwitcher` lazy-load the active variant
4. `PageLayout` uses switchers instead of direct imports

### Admin UI
New `SettingsSection` in `AdminSettings.tsx` titled **"Header & Footer Layout"** with visual grid selector cards (same pattern as the Hero Style selector). Each card shows the style name, short description, and an "Active" badge.

### Implementation Order
1. Database migration (add columns)
2. Update `useBrandSettings.ts` + `BrandContext.tsx` with new fields
3. Create all 8 header variant components
4. Create all 8 footer variant components
5. Create `HeaderSwitcher.tsx` and `FooterSwitcher.tsx`
6. Update `PageLayout.tsx` to use switchers
7. Add layout selector UI to `AdminSettings.tsx`

