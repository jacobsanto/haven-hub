

## Improving hero text and search bar legibility

Currently the hero has a blurred background image with a `bg-black/50` overlay. Here are the most effective techniques to boost foreground readability:

### Recommended approach: Layered depth

Apply **three complementary effects** (all in `src/components/home/HeroSection.tsx`):

1. **Increase overlay darkness** — Change `bg-black/50` → `bg-black/60` for stronger contrast behind text.

2. **Add a directional gradient scrim on the left** — A second overlay div with a gradient that's darkest where the text sits and fades toward the card deck side:
   ```
   bg-gradient-to-r from-black/50 via-black/20 to-transparent
   ```
   This keeps the right side (card deck) more vibrant while making the left text area very readable.

3. **Add text shadow to headings** — The `h1` already has a `textShadow` but it uses `foreground` which may be light. Change to a solid dark shadow: `0 2px 20px rgba(0,0,0,0.6)` so the text pops regardless of background brightness.

4. **Search bar backdrop** — The `HeroSearchForm` already uses `backdrop-blur-md` but its background (`bg-foreground/8`) is very faint. Increase to `bg-black/30 backdrop-blur-lg` for a more defined, legible search bar against any hero image.

### Summary of changes

| File | What |
|------|------|
| `HeroSection.tsx` line 153 | `bg-black/50` → `bg-black/60` |
| `HeroSection.tsx` after line 153 | Add gradient scrim div: `bg-gradient-to-r from-black/50 via-black/20 to-transparent` |
| `HeroSection.tsx` line 184 | Update text shadow to use `rgba(0,0,0,0.6)` |
| `HeroSearchForm.tsx` line 25 | `bg-foreground/8` → `bg-black/30 backdrop-blur-lg` |

These four changes together create a layered depth effect: the background is uniformly darker, the text zone is extra-dark via gradient, headings have their own halo, and the search bar has a visible frosted-glass panel.

