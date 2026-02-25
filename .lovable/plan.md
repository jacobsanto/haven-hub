

## Sprint: AI Generator Integration -- In-Form Generation + Create New from Content Hub

### Problem
1. **Blog Post Form**: No AI generation inside the create/edit form -- users must leave the form to use the AI Content Hub separately.
2. **AI Content Hub**: Only allows updating existing entities. Cannot create new blog posts, destinations, experiences, or properties from generated content.
3. **Humanize** button needs to be present in both contexts.

### Solution Overview

Two changes across 3 files. No schema changes. No backend changes.

---

### Change 1: Add AI Generator to BlogPostFormDialog

**File**: `src/components/admin/BlogPostFormDialog.tsx`

Add a collapsible "AI Assist" section inside the blog post form (between the excerpt and content fields). This will:

- Use the `useAIContent` hook directly (not the full `AIContentGenerator` component, which is too heavy for inline use)
- Provide a compact inline panel with:
  - Tone selector (Luxury / Warm / Professional)
  - Custom instructions textarea (collapsible)
  - "Generate" button that uses the current form title + excerpt as context
  - Once generated: show preview of title, excerpt, content, tags with "Apply to Form" buttons per field or "Apply All"
  - "Humanize" button appears after generation
- On "Apply", it populates the form fields directly via `form.setValue()`
- Works for both new posts (uses title as seed) and existing posts (uses all existing data as context)

This keeps the form self-contained -- no need to navigate to Content Hub.

---

### Change 2: Add "Create New" to AIContentGenerator

**File**: `src/components/admin/AIContentGenerator.tsx`

Add a special "Create New" option in the item selector dropdown:

- Add a synthetic item with `id: '__new__'` and `name: 'Create New [Entity]'` at the top of the items list
- When "Create New" is selected, show an input field for the entity name (e.g., blog post title, destination name)
- The user types a name/title, then generates content as usual
- The "Apply" button changes label to "Create & Save"

**File**: `src/pages/admin/AdminAIContent.tsx`

Update `handleApply` to detect when `itemId === '__new__'`:

- For blog: INSERT a new `blog_posts` row (status: draft) with the generated content
- For destinations: INSERT a new `destinations` row (status: draft)
- For experiences: INSERT a new `experiences` row (status: draft)
- For properties: INSERT a new `properties` row (status: draft)
- Show success toast with the new entity name
- Invalidate relevant query caches

The AIContentGenerator component needs a new prop `onCreateNew` or the existing `onApplyContent` handles both update and create based on the `__new__` sentinel ID. The parent page (AdminAIContent) will handle the branching logic.

---

### Change 3: Humanize Available Everywhere

The `useAIContent` hook already exposes `humanizeContent`. The AIContentGenerator already has the Humanize button. The only gap is the new inline generator in BlogPostFormDialog, which will also include the Humanize button after generation.

---

### Technical Details

**BlogPostFormDialog inline AI panel**:
- Uses `useAIContent()` hook for `generateContent`, `humanizeContent`, `generatedContent`, `isGenerating`, `isHumanizing`
- Passes `contentType: 'blog'`, `targetName: form.watch('title')`, `existingData: { title, excerpt, tags }`
- "Apply All" sets `form.setValue('title', content.title)`, etc.
- Collapsible via `Collapsible` component, labeled "AI Content Assistant"

**AIContentGenerator "Create New" flow**:
- New state: `newEntityName` (string)
- When `selectedItemId === '__new__'`, render an `Input` for the name
- Pass `newEntityName` as `targetName` to `generateContent`
- New prop: `allowCreateNew?: boolean` (default true)
- New callback prop: `onCreateContent?: (name: string, content: GeneratedContent) => void`

**AdminAIContent create logic** (in `handleApply`):
- When `itemId === '__new__'`, call INSERT instead of UPDATE
- Generate a slug from the name using the same `generateSlug` pattern
- All new entities created as draft status

### Files Modified
- `src/components/admin/BlogPostFormDialog.tsx` -- add inline AI generation panel
- `src/components/admin/AIContentGenerator.tsx` -- add "Create New" option + name input
- `src/pages/admin/AdminAIContent.tsx` -- handle INSERT for new entities

### Validation
- Existing blog post editing still works
- AI generation in Content Hub still updates existing items correctly
- New "Create New" inserts with draft status
- Inline AI in blog form populates fields correctly
- Humanize works in both inline form and Content Hub
- No frontend rendering changes
- No schema changes

