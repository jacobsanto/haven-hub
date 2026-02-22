

# Fix Guesty Widget: Container Not Found on Init

## Root Cause

The console error `[Guesty]: Cannot read properties of null (reading 'style')` reveals the problem: Guesty's `create(config)` runs immediately on script load, but it internally does `document.getElementById("search-widget_IO312PWQ")` and gets `null` because:

1. The container div's `id` is set via `containerRef.current.id = containerId` inside the same `useEffect` that loads the script -- but the script's `onload` can fire before the browser flushes the DOM attribute change.
2. On re-navigation, the cleanup function removes the script and CSS tags, so when revisiting a property page, the script reloads but the old global `GuestySearchBarWidget` might be stale.

## Fix (single file change)

### `src/components/booking/GuestyBookingWidget.tsx`

**Change 1 -- Set the container ID directly in JSX, not in useEffect**

Instead of setting `containerRef.current.id = containerId` inside the effect, render the div with the correct `id` directly in JSX. This guarantees the ID is in the DOM before any script tries to find it.

Replace the container div render:
```tsx
<div
  ref={containerRef}
  id={widgetId ? `search-widget_${widgetId}` : undefined}
  className="min-h-[200px] relative"
>
```

Remove the `containerRef.current.id = containerId` lines from the useEffect (lines 49-51).

**Change 2 -- Delay `create()` call with `requestAnimationFrame`**

Wrap the `GuestySearchBarWidget.create(config)` calls (both in onload and the "already loaded" branch) in `requestAnimationFrame` to ensure the browser has painted the container div before Guesty tries to query it:

```tsx
const initWidget = () => {
  const win = window as any;
  if (win.GuestySearchBarWidget) {
    // Wait one frame so the container div is definitely in the DOM
    requestAnimationFrame(() => {
      win.GuestySearchBarWidget.create(config).catch((e: any) =>
        console.log('[Guesty]:', e.message)
      );
    });
  }
};
```

Use `initWidget()` in both the `script.onload` handler and the "already loaded" branch.

**Change 3 -- Don't remove script/CSS on unmount**

The cleanup function currently removes the Guesty script and CSS from the DOM on unmount. This causes issues on re-navigation because the global `GuestySearchBarWidget` object gets destroyed. Remove the cleanup return entirely -- Guesty's script is a global singleton and should persist.

## What Does NOT Change

- Database settings (already populated correctly)
- Admin settings UI
- PropertyDetail conditional rendering
- CSS overrides
- No schema changes

