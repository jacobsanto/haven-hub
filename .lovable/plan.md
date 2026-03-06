

## Problem

The homepage destinations showcase displays **all active destinations** (up to 8), regardless of their "Featured" toggle. The admin's featured switch only adds a "Featured" badge but doesn't control which destinations appear in the slider. The user expects: toggle featured on/off in admin = destination appears/disappears from the homepage showcase.

## Solution

Update `DestinationsShowcase.tsx` to use `useFeaturedDestinations()` instead of `useActiveDestinations()` for the showcase items. This way, only destinations marked as featured in the admin panel will appear in the homepage slider.

### Changes

**`src/components/home/DestinationsShowcase.tsx`**
- Replace `useActiveDestinations()` with `useFeaturedDestinations()` from the existing hooks
- Remove the `.slice(0, 8)` limit (or keep as a safety cap) since featured count is admin-controlled
- Remove the `badge: dest.is_featured ? 'Featured' : undefined` since all items will be featured
- Update the non-showcase card layout branch to also use the featured destinations data

This is a one-file change. The `useFeaturedDestinations` hook already exists and queries `destinations` where `status = 'active'` AND `is_featured = true`.

