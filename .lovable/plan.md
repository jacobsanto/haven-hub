

# Add Responsive Gallery Editor with Drag-and-Drop Reorder

## Problem

The property gallery editor in the admin form (`AdminPropertyForm.tsx`) only supports adding and removing images. There is no way to reorder gallery images, which means the display order on the public property page is fixed to upload order. For a luxury hospitality platform, image ordering is critical -- the first few images drive booking decisions.

## Solution

Build a drag-and-drop gallery editor component using the **HTML5 Drag and Drop API** (no new dependencies needed). This keeps the bundle lean and avoids adding a library for a single use case.

### Features

- Drag-and-drop reorder on desktop (grab handle on each image)
- Touch-friendly reorder on mobile via up/down arrow buttons
- Visual drag feedback (opacity change, drop zone highlight)
- "Set as Hero" button to promote any gallery image to the hero slot
- Image count indicator
- Fully responsive grid (2 columns mobile, 4 columns desktop)

## Technical Approach

### New Component: `src/components/admin/GalleryEditor.tsx`

A self-contained component that receives `gallery` (string array) and callbacks:

```text
Props:
  gallery: string[]
  onReorder: (newGallery: string[]) => void
  onRemove: (index: number) => void
  onSetAsHero?: (url: string) => void
```

Internal state:
- `dragIndex`: the index of the item being dragged
- `dragOverIndex`: the index of the current drop target

Drag events:
- `onDragStart` -- store the dragged index, set opacity
- `onDragOver` -- prevent default, update dragOverIndex for visual feedback
- `onDrop` -- reorder the array by splicing, call `onReorder`
- `onDragEnd` -- reset visual state

Mobile fallback:
- Each image card shows small up/down arrow buttons (visible on touch devices or always visible)
- Clicking moves the image one position in the array

### Integration in `AdminPropertyForm.tsx`

Replace the current gallery grid (lines 781-817) with the new `<GalleryEditor>` component, keeping the `ImageUploadWithOptimizer` "Add Image" button at the end.

## Files to Create

- `src/components/admin/GalleryEditor.tsx` -- Drag-and-drop gallery reorder component

## Files to Modify

- `src/pages/admin/AdminPropertyForm.tsx` -- Replace the static gallery grid with `<GalleryEditor>`, wire up reorder callback that updates `formData.gallery`

## No Database Changes Required

Gallery order is already stored as a JSON array (`gallery: text[]`) in the `properties` table. Reordering simply changes the array order before saving.

