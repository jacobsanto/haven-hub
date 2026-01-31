
# Side-by-Side Content Comparison Toggle

## Overview

Add a comparison mode that allows users to view the original AI-generated content alongside the humanized version, making it easy to see what changes were made during the humanization process.

---

## User Experience

### How It Works

1. **Generate content** - User generates AI content as normal
2. **Humanize** - User clicks "Humanize" to refine the content
3. **Compare toggle appears** - A toggle becomes visible after humanization
4. **Side-by-side view** - Toggle enables a two-column layout showing both versions
5. **Differences highlighted** - Original on left, humanized on right

### Visual Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│  Generated Content                         [Compare: ON/OFF]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐  │
│  │  ORIGINAL               │   │  HUMANIZED ✨               │  │
│  │  ─────────              │   │  ────────────               │  │
│  │                         │   │                             │  │
│  │  Description            │   │  Description                │  │
│  │  ──────────             │   │  ──────────                 │  │
│  │  Nestled in the heart   │   │  Right in the middle of     │  │
│  │  of Tuscany, this       │   │  Tuscany, you'll find a     │  │
│  │  magnificent estate     │   │  beautiful estate that      │  │
│  │  boasts breathtaking... │   │  offers stunning views...   │  │
│  │                         │   │                             │  │
│  └─────────────────────────┘   └─────────────────────────────┘  │
│                                                                 │
│  [Regenerate] [Humanize ✨] [Use Original] [Use Humanized]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### State Changes

Add new state variables to track both content versions:

```typescript
// New state in AIContentGenerator
const [originalContent, setOriginalContent] = useState<GeneratedContent | null>(null);
const [showComparison, setShowComparison] = useState(false);
const [hasBeenHumanized, setHasBeenHumanized] = useState(false);
```

### Workflow Logic

1. **On Generate**: 
   - Store result in `generatedContent` (existing)
   - Clear `originalContent` 
   - Reset `hasBeenHumanized` to false

2. **On Humanize**:
   - Save current `generatedContent` to `originalContent`
   - Store humanized result in `generatedContent`
   - Set `hasBeenHumanized` to true
   - Optionally auto-enable comparison view

3. **Toggle Comparison**:
   - Only visible when `hasBeenHumanized` is true
   - Switches between single-column and two-column layout

4. **Choose Version**:
   - "Use Original" button restores `originalContent` to `generatedContent`
   - "Use Humanized" keeps current `generatedContent`
   - Both dismiss comparison mode

---

## File Changes

### `src/components/admin/AIContentGenerator.tsx`

**New state variables:**
- `originalContent` - Stores the pre-humanized content
- `showComparison` - Toggle for comparison view
- `hasBeenHumanized` - Tracks if humanization occurred

**Updated handlers:**
- `handleGenerate` - Reset comparison state on new generation
- `handleHumanize` - Save original before humanizing, enable comparison

**New UI elements:**
- Toggle switch for comparison mode (appears after humanization)
- Two-column layout component for side-by-side view
- "Use Original" / "Use Humanized" action buttons
- Column headers with version labels

**New render function:**
- `renderComparisonView()` - Side-by-side layout showing both versions

---

## Visual Details

### Comparison Toggle

Located in the card header, only visible after humanization:

```text
[Toggle] Compare versions
```

### Column Styling

| Element | Original Column | Humanized Column |
|---------|-----------------|------------------|
| Header | "Original" | "Humanized ✨" |
| Background | Neutral gray | Subtle green tint |
| Border | Standard | Primary accent |

### Responsive Behavior

- **Desktop**: True side-by-side columns
- **Tablet**: Stacked with tabs to switch
- **Mobile**: Stacked with accordion-style toggle

---

## Benefits

- **Transparency** - See exactly what the humanization changed
- **Control** - Choose which version to use
- **Learning** - Understand how humanization improves content
- **Confidence** - Make informed decisions about content quality
