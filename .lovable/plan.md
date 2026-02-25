

## Fix: Apply consistent hover effect to gold gradient buttons

### Problem
The `btn-gold-gradient` CSS class in `index.css` defines its own hover behavior (gradient flip + shadow) but does NOT include the `scale-[1.03]` transform that all other buttons get from the base `buttonVariants` in `button.tsx`. Because the CSS class uses `@apply shadow-lg` on hover, it may also conflict with the base `hover:shadow-md`.

### Solution
Add `hover:scale-[1.03]` to the `.btn-gold-gradient:hover` rule in `index.css` so gold gradient buttons match the universal hover behavior.

### Changes

**File: `src/index.css`** (lines 144-146)

Update the `.btn-gold-gradient:hover` rule to include the scale transform:

```css
.btn-gold-gradient:hover {
  background: linear-gradient(135deg, hsl(var(--accent-hover)), hsl(var(--accent)));
  @apply shadow-lg scale-[1.03];
}
```

This is a single-line change that ensures gold/gradient buttons have the same lift effect as every other button on the site.
