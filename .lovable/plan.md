

# Fix Scrolling in Import Properties Dialog

## Problem

The "Import Properties" dialog uses a `ScrollArea` component with `flex-1` to fill available space, but the flex container layout is not properly constraining its height. Without a concrete height constraint, the `ScrollArea` expands to fit all content instead of becoming scrollable.

## Root Cause

The `DialogContent` has `max-h-[80vh] flex flex-col`, but the intermediate content area between the header and footer lacks `min-h-0` (a common flexbox gotcha). In CSS flexbox, children default to `min-height: auto`, which prevents them from shrinking below their content size -- so the `ScrollArea` never activates its scrollbar.

## Fix

**File: `src/components/admin/PMSPropertyImportDialog.tsx`**

Two small changes:

1. Add `overflow-hidden` to the `DialogContent` to ensure the flex column respects the max-height boundary
2. Add `min-h-0` to the `ScrollArea` so it can shrink below its content height and activate the scrollbar

```text
Before (line 155):
  <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">

After:
  <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">

Before (line 196):
  <ScrollArea className="flex-1 -mx-6 px-6">

After:
  <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
```

No other files need changes. This is a CSS layout fix only.

