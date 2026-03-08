

# Full Semantic Color Token Enforcement

## Problem
Many public-facing components use hardcoded Tailwind colors (blue-600, green-400, rose-500, violet-700, etc.) that do NOT respond to admin dashboard palette changes. When you change colors in settings, these elements stay the same.

## Scope

**Will fix** (public-facing, guest-visible components — ~20 files):

| Category | Files | Current Problem | Fix |
|----------|-------|----------------|-----|
| Blog article badges | `ArticleStyleBadge.tsx` | 10 different hardcoded colors per style (rose, violet, teal, amber, blue, green, orange, red) | All use `bg-primary/10 text-primary` or `bg-accent/10 text-accent` |
| Blog layout headers | 8 layout files (`DetailedCaseStudyLayout`, `ThingsToDoAfterLayout`, `ProductShowdownLayout`, `HowTheyDidItLayout`, `BeginnersGuideLayout`, `MythDebunkerLayout`, `ClassicListPostLayout`, `TravelTipsLayout`) | Each has hardcoded colored badges, borders, backgrounds | Convert to `primary`/`accent`/`muted` tokens |
| Blog callouts | `TipCallout.tsx` | 6 callout types with hardcoded colors (amber, blue, emerald, purple, teal) | Map to semantic: tip→accent, info→primary, location→primary, highlight→primary, timing→muted, recommendation→accent |
| Blog tip card | `TipCard.tsx` | Likely hardcoded colors | Convert to semantic tokens |
| Property cards | `AtAGlanceCards.tsx` | `bg-green-100 text-green-600` for instant booking | `bg-accent/10 text-accent` |
| Image overlays | `HeroSection.tsx`, `SectionShowcase.tsx`, `BlogPostCard.tsx`, `VillaCardGrid.tsx`, `QuickBookCard.tsx`, `VillaDetailModal.tsx`, `PromotionalPopup.tsx` | `bg-black/*` and `text-white` | `bg-foreground/*` and `text-background` |

**Will NOT change** (correct to leave as-is):
- **UI primitives** (dialog.tsx, sheet.tsx, drawer.tsx, alert-dialog.tsx) — standard shadcn overlays, internal framework
- **Admin pages** — status colors (green=success, red=error, blue=info) are functional UX conventions, not brand colors
- **Admin internal components** — ContentCalendar, BookingDetailDialog, PMSConnectionWizard status indicators

## Result
After this change, adjusting the palette in Admin Settings will propagate to every guest-facing element — headers, footers, cards, blog posts, callouts, badges, overlays, popups. No more orphaned colors.

