

## Remove SectionDisplayEditor from AdminPageContent

### Problem
The `SectionDisplayEditor` component embedded at the bottom of each page in the Page Content editor duplicates functionality that already exists in the dedicated Section Display settings. This duplication causes conflicting saves and React warnings in the console.

### Change

**`src/pages/admin/AdminPageContent.tsx`**:
- Remove the `<SectionDisplayEditor pageSlug={schema.pageSlug} />` call from the `PageEditor` component
- Remove the entire `SectionDisplayEditor` function component definition (~80 lines)
- Remove related imports: `useAllSectionDisplaySettings`, `useUpsertSectionDisplay`, `SectionDisplaySettings` from `useSectionDisplay`
- Remove unused imports: `Slider`, `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue`, `LayoutGrid`, `LayoutList`, `Star`, `Play`, and the `SECTION_LABELS`, `LAYOUT_OPTIONS`, `ANIMATION_OPTIONS` constants

This is a pure removal — no new code needed. Section display controls remain available in their proper location.

