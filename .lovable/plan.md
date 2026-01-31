

# AI Disclaimer Badge & Humanize Post-Processing

## Overview

Add two features to enhance the AI Content Generator:
1. **AI Assisted Badge** - Optional disclaimer that can be appended to generated content
2. **Humanize Post-Processing** - A refinement step that makes AI output sound more natural and less formulaic

---

## Feature 1: AI Assisted Badge/Disclaimer

### Options to Offer

| Badge Style | Output |
|-------------|--------|
| **None** | No disclaimer (default) |
| **Subtle Footer** | `*Content created with AI assistance*` |
| **Badge Text** | `[AI Assisted]` prefix on content |
| **Full Disclosure** | `This content was generated with AI assistance and reviewed by our editorial team.` |

### Implementation

**UI Changes (`AIContentGenerator.tsx`)**:
- Add a "Disclosure Options" section in the settings
- Checkbox: "Add AI disclosure"
- Dropdown: Select disclosure style
- Preview: Show how disclaimer will appear

**Content Modification**:
- When applying content, the selected disclaimer is appended based on style:
  - For **blog posts**: Added as a footer note in the markdown content
  - For **descriptions**: Added as a final sentence or omitted for short-form content

---

## Feature 2: Humanize Post-Processing

### How It Works

After initial content generation, the user can click a "Humanize" button that sends the generated content back through the AI with specific instructions to:

1. **Remove AI-typical patterns** - Eliminate phrases like "nestled in", "boasts", "immerse yourself", "unforgettable"
2. **Add natural variation** - Vary sentence structure and length
3. **Inject personality** - Add subtle imperfections and conversational elements
4. **Reduce superlatives** - Tone down "amazing", "incredible", "unparalleled"
5. **Add specific details** - Replace generic phrases with concrete observations

### Humanization Prompt

The edge function will use a refinement prompt like:

```text
Refine the following marketing content to sound more naturally written by a human:

1. Replace cliché travel writing phrases with fresh alternatives
2. Vary sentence structure - mix short punchy sentences with longer flowing ones
3. Add subtle imperfections that feel human (contractions, casual asides)
4. Remove excessive superlatives and replace with specific, tangible details
5. Keep the same meaning and tone, just make it feel less AI-generated

Content to refine:
[Generated content here]
```

### UI Flow

```text
+------------------------------------------+
|  Generated Content                       |
|  +------------------------------------+  |
|  | AI-generated text appears here... |  |
|  +------------------------------------+  |
|                                          |
|  [Regenerate] [Humanize ✨] [Apply]      |
|                                          |
|  ☐ Add AI disclosure  [Subtle Footer ▼] |
+------------------------------------------+
```

When "Humanize" is clicked:
1. Content is sent back to the edge function with `humanize: true`
2. Edge function runs the refinement prompt
3. Updated content replaces the preview
4. User can compare/toggle between original and humanized versions

---

## Technical Implementation

### File Changes

**1. `src/hooks/useAIContent.ts`**
- Add `humanize` function that takes generated content and refines it
- Add `humanizeContent` mutation state
- Export disclosure options

**2. `src/components/admin/AIContentGenerator.tsx`**
- Add disclosure checkbox and style dropdown
- Add "Humanize" button next to Regenerate
- Track original vs humanized content for comparison
- Apply disclaimer when content is applied

**3. `supabase/functions/generate-content/index.ts`**
- Add `humanize` mode that accepts existing content
- Add humanization system prompt
- Return refined content with same structure

### New Request Type

```typescript
interface GenerateRequest {
  // Existing fields...
  humanize?: boolean;          // If true, refine existing content
  contentToHumanize?: object;  // The content to refine
}
```

### Disclosure Types

```typescript
type DisclosureType = 'none' | 'subtle' | 'badge' | 'full';

const disclosureTexts = {
  none: '',
  subtle: '*Content created with AI assistance*',
  badge: '[AI Assisted] ',
  full: '\n\n---\n*This content was generated with AI assistance and reviewed by our editorial team.*',
};
```

---

## User Experience

1. **Generate content** as normal
2. **Review output** - if it sounds too formulaic, click "Humanize"
3. **Toggle comparison** - see original vs humanized side-by-side (optional)
4. **Add disclosure** - check box and select style if desired
5. **Apply** - content with optional disclaimer is saved to database

---

## Benefits

- **Transparency option** - Users who want to disclose AI involvement can do so easily
- **Better quality** - Humanized content sounds more authentic
- **Flexible workflow** - Use humanization only when needed
- **Professional output** - Final content reads like it was human-written

