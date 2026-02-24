

# Auto-Matching Icons for CMS Page Content Fields

## Problem

Several front-end sections display icons alongside CMS-managed text (trust badges, "Why Book Direct" features, About page values). But the icons are **hardcoded** in the React components -- admins can change titles and descriptions in the CMS, but the icons never update to match. For example, if you change "Best Price Guarantee" to "Eco-Friendly Stays", the Shield icon stays even though a Leaf would be more appropriate.

Affected sections:
- **Homepage**: Trust Badges (3 icons), Why Book Direct features (4 icons)
- **About page**: Values section (4 icons)

## Solution

### 1. Add `icon` fields to the CMS content schema

Add a new field type `icon` to the content schema for each item that displays an icon. Admins will see an icon picker in the CMS editor for these fields.

Example new fields in `PAGE_CONTENT_SCHEMAS`:
- `badge_1_icon`, `badge_2_icon`, `badge_3_icon` (trust badges)
- `feature_1_icon` through `feature_4_icon` (why book direct)
- `value_1_icon` through `value_4_icon` (about page values)

Default values will match the current hardcoded icons (e.g., `"Star"`, `"Shield"`, `"Heart"`).

### 2. Add `icon` field type to the CMS editor

Update `AdminPageContent.tsx` to render an `IconPicker` when `field.type === 'icon'`. The existing `IconPicker` component already handles icon selection with search -- it just needs to be wired into the CMS field rendering loop.

### 3. Add AI auto-suggest button for icon fields

Next to each icon picker, add a "Suggest" button (sparkles icon). When clicked, it sends the sibling title and description fields for that item to a backend function that returns the best-matching Lucide icon name from the allowed list.

This uses the same pattern as the AI Content Generator -- advisory only, admin always confirms.

**Backend function**: `supabase/functions/suggest-icon/index.ts`
- Input: `{ title, description, availableIcons[] }`
- Uses `google/gemini-2.5-flash-lite` (fast, cheap, sufficient for single-word matching)
- Returns: `{ icon: "Leaf" }`
- Constrained to only return icons from the `AMENITY_ICONS` list

**New hook**: `src/hooks/useIconSuggestion.ts`
- Wraps the edge function call with loading/error state

### 4. Wire icons into front-end pages

Update `Index.tsx` and `About.tsx` to read icon values from the CMS instead of hardcoded imports:
- Look up the icon name string from page content (e.g., `"Shield"`)
- Resolve it to the actual Lucide component using a dynamic lookup from `lucide-react`
- Fall back to the current hardcoded icon if no CMS value exists

## Technical Details

### Content field type addition

```typescript
// In usePageContent.ts - ContentField type update
export interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'icon';  // add 'icon'
  defaultValue: string;
}
```

### CMS editor rendering (AdminPageContent.tsx)

```typescript
) : field.type === 'icon' ? (
  <div className="flex items-center gap-2">
    <IconPicker
      value={currentValue}
      onChange={(icon) => handleChange(section.sectionKey, field.key, icon)}
    />
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSuggestIcon(section, field)}
      disabled={isSuggesting}
    >
      <Sparkles className="h-4 w-4" />
      Suggest
    </Button>
  </div>
) : ...
```

### Dynamic icon resolution on front-end pages

```typescript
// Utility function in src/utils/icon-resolver.ts
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  return (typeof icon === 'function' ? icon : fallback) as LucideIcon;
}
```

### Schema additions (example for homepage trust badges)

```typescript
{
  sectionKey: 'trust_badges',
  title: 'Trust Badges',
  fields: [
    { key: 'badge_1_icon', label: 'Badge 1 Icon', type: 'icon', defaultValue: 'Star' },
    { key: 'badge_1_title', label: 'Badge 1 Title', type: 'text', defaultValue: 'Handpicked Excellence' },
    { key: 'badge_1_description', label: 'Badge 1 Description', type: 'text', defaultValue: '...' },
    // ... same pattern for badges 2, 3
  ],
}
```

## Files to Create

- `supabase/functions/suggest-icon/index.ts` -- AI icon suggestion endpoint
- `src/hooks/useIconSuggestion.ts` -- Hook wrapping the edge function
- `src/utils/icon-resolver.ts` -- Dynamic Lucide icon lookup utility

## Files to Modify

- `src/hooks/usePageContent.ts` -- Add `'icon'` to ContentField type, add icon fields to schemas
- `src/pages/admin/AdminPageContent.tsx` -- Render IconPicker + Suggest button for icon fields
- `src/components/admin/IconPicker.tsx` -- Export `AMENITY_ICONS` array
- `src/pages/Index.tsx` -- Read icon values from CMS, use `resolveIcon()` for badges and features
- `src/pages/About.tsx` -- Read icon values from CMS, use `resolveIcon()` for values section

## No Database Changes

Icon values are stored as plain strings (e.g., `"Shield"`) in the existing `page_content` table, same as any other text content.

