

## Reduce Blur on Top Pick Card

The visible blur on the Top Pick card comes from the **outer card container** (line 179), which has `backdrop-blur-md` (12px). The content area at line 200 is already at just 1px.

### Change

Reduce the outer card's `backdrop-blur-md` (12px) by 30% to approximately `8.4px`:

- **File**: `src/pages/Index.tsx`, line 179
- **From**: `backdrop-blur-md`
- **To**: `backdrop-blur-[8.4px]`

This is a single-line change that will make the card background less blurred while keeping the frosted glass aesthetic.

