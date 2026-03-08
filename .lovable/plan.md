

# Footer Brand Compliance — Final Fix

## Status

Almost all footers are already compliant. There is **one remaining violation**:

**`FooterEditorial.tsx` line 89** — uses `font-semibold` on the newsletter heading ("The Arivia Letter"). Per typography standards, this should be `font-medium`.

All other footers (Bento, Glassmorphic, Brutalist, ChatFirst, Immersive, Kinetic, Minimal) already use correct `font-medium` weights, semantic color tokens, and no hardcoded hex values.

## Change

| File | Line | Change |
|------|------|--------|
| `src/components/layout/footers/FooterEditorial.tsx` | 89 | `font-semibold` → `font-medium` |

One-line fix. No other footer files need changes.

