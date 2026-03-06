

## Plan: Make Showcase Variants Full-Width & Remove Section Backgrounds

### Problem
When a showcase style is selected, the section still renders inside a constrained `max-w-[1200px] mx-auto` container with `rounded-2xl` and section background colors (`bg-background`, `bg-muted`). The user wants showcase variants to cover the **entire section width edge-to-edge** with no visible section background.

### Changes

**1. `SectionShowcase.tsx` — Remove container constraints**
- Line 62: Remove `rounded-2xl` from the inner container
- Make height more impactful: `h-[500px] md:h-[600px]`
- The showcase already uses `w-full`, so it will fill whatever parent it's in

**2. All 4 homepage sections — Full-bleed when showcase mode is active**
When `isShowcase` is true:
- Remove the `container mx-auto px-4` wrapper
- Remove section background classes (`bg-background`, `bg-muted`)
- Remove `max-w-[1200px] mx-auto` wrapper around `SectionShowcase`
- Move the section header **inside** a container div so text stays readable, but the showcase itself goes edge-to-edge
- Remove `border-t`, `border-b` borders from the section

Files affected:
- `src/components/home/DestinationsShowcase.tsx`
- `src/components/home/DiscoverVillasSection.tsx`
- `src/components/home/FeaturedVacationSection.tsx`
- `src/components/home/LiveExperiencesSection.tsx`
- `src/components/ui/SectionShowcase.tsx`

### Result
Showcase variants will span the full viewport width with no padding, rounded corners, or background colors — creating an immersive, edge-to-edge cinematic section. Card layouts (grid/carousel/list/featured) remain unchanged in their contained layout.

