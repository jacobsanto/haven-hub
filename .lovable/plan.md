

## Plan: Remove all `font-bold` from public-facing components and pages

### Scope

There are ~140 remaining `font-bold` instances in 15 non-admin component/page files. All will be replaced with `font-medium` (or `font-semibold` for specific cases like price totals and counters where slightly heavier weight aids readability).

### Files to update

**Pages (2 files):**
- `src/pages/NotFound.tsx` — 404 heading
- `src/pages/Checkout.tsx` — payment step label

**Blog layouts (8 files):**
- `ClassicListPostLayout.tsx` — h1 title, numbered circles, prose headings
- `BeginnersGuideLayout.tsx` — h1 title, step numbers, prose headings
- `DetailedCaseStudyLayout.tsx` — h1 title, prose headings
- `ThingsToDoAfterLayout.tsx` — h1 title, checklist numbers, prose headings
- `ProductShowdownLayout.tsx` — h1 title, prose headings
- `HowTheyDidItLayout.tsx` — h1 title, prose headings
- `MythDebunkerLayout.tsx` — h1 title, prose headings
- `DestinationGuideLayout.tsx` — h1 title, prose headings
- `LifestyleLayout.tsx` — h1 title, prose headings
- `TravelTipsLayout.tsx` — h1 title, prose headings

**Blog components (1 file):**
- `MarkdownRenderer.tsx` — section numbers rendered as `font-bold`

**Property components (1 file):**
- `SearchResultCard.tsx` — price display

**Experience components (1 file):**
- `ExperienceCard.tsx` — name and price

**Promotions (1 file):**
- `PromotionalPopup.tsx` — title and coupon code

### Replacement rules

| Current | Replacement | Where |
|---------|------------|-------|
| `font-bold` on headings (h1, h2, h3) | `font-medium` | All blog layouts, pages |
| `font-bold` on small numbered indicators | `font-medium` | Blog TOC circles |
| `font-bold` on prices | `font-semibold` | SearchResultCard, ExperienceCard |
| `font-bold` on coupon codes | `font-semibold` | PromotionalPopup |
| `prose-headings:font-bold` | `prose-headings:font-medium` | All blog layout prose containers |
| `font-bold` on 404 | `font-medium` | NotFound page |
| `font-bold` on checkout step | `font-semibold` | Checkout page |

This covers every remaining `font-bold` instance in all public-facing files. Admin pages are excluded as they are internal tooling.

