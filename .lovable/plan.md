

# AI Content Generator for Admin

## Overview

Create a dedicated AI-powered content generation hub in the Admin Content section that enables automated creation and optimization of written content across all content types: blog posts, destinations, experiences, and properties.

---

## Content Types to Support

| Content Type | Generated Fields |
|--------------|------------------|
| **Blog Posts** | Title, excerpt, full content (markdown), meta description, tags |
| **Destinations** | Short description, long description, highlights, best time to visit, climate info |
| **Experiences** | Short description, long description, what's included list |
| **Properties** | Description, highlights, neighborhood description |

---

## Feature Suggestions

### 1. Content Generation Modes

**Quick Generate** - One-click generation with smart defaults
- Select content type + target item (e.g., "Santorini" destination)
- AI generates all relevant fields based on existing data
- Review and apply with one click

**Custom Prompt** - Full control over generation
- Write custom instructions for specific tone, style, or focus
- Useful for seasonal content or marketing campaigns

**Batch Generation** - Generate content for multiple items
- Select multiple destinations/experiences without descriptions
- Queue AI to generate content for all at once

### 2. Content Templates

Pre-built templates for common content needs:
- "Destination Guide Blog Post" - Auto-generates full article from destination data
- "Experience Spotlight" - Creates engaging experience descriptions
- "Property Welcome Email" - Guest communication copy
- "Seasonal Promotion" - Marketing copy for special offers

### 3. Content Enhancement Tools

- **Improve Existing** - Enhance current descriptions with richer language
- **Translate** - Multi-language content support
- **SEO Optimize** - Add keywords, improve meta descriptions
- **Tone Adjustment** - Shift between luxury/casual/informative

### 4. Content History

- Track all AI-generated content
- Compare versions before/after AI enhancement
- Rollback capability

---

## Recommended Implementation

### Phase 1: Core AI Content Page

**New Files:**
- `src/pages/admin/AdminAIContent.tsx` - Main page with tabs for each content type
- `src/components/admin/AIContentGenerator.tsx` - Reusable generation component
- `src/hooks/useAIContent.ts` - Hook for AI generation logic
- `supabase/functions/generate-content/index.ts` - Edge function using Lovable AI

**Page Structure:**
```text
+------------------------------------------+
|  AI Content Generator                    |
+------------------------------------------+
|  [Blog] [Destinations] [Experiences] [Properties]
+------------------------------------------+
|                                          |
|  Content Type: Destination               |
|  Target: [Select Destination ▼]          |
|                                          |
|  Template: [Destination Guide ▼]         |
|                                          |
|  Custom Instructions (optional):         |
|  [                                    ]  |
|                                          |
|  [Generate Content]                      |
|                                          |
+------------------------------------------+
|  Preview:                                |
|  +------------------------------------+  |
|  | Generated content appears here... |  |
|  +------------------------------------+  |
|                                          |
|  [Copy] [Apply to Destination] [Regenerate]
+------------------------------------------+
```

### Phase 2: Inline AI Buttons

Add "AI Generate" buttons directly in existing form dialogs:
- Blog post form: AI button next to content field
- Destination form: AI button next to descriptions
- Experience form: AI button next to descriptions

### Phase 3: Automation & Scheduling

- Auto-generate blog post drafts weekly
- Content suggestions based on trending topics
- AI-powered content calendar

---

## Technical Architecture

### Edge Function: `generate-content`

Uses Lovable AI (google/gemini-3-flash-preview) with structured prompts:

```typescript
// Prompt templates by content type
const prompts = {
  destination: {
    system: "You are a luxury travel copywriter...",
    fields: ["description", "long_description", "highlights"]
  },
  experience: {
    system: "You are an experience curator...",
    fields: ["description", "long_description", "includes"]
  },
  blog: {
    system: "You are a travel editor...",
    fields: ["title", "excerpt", "content", "tags"]
  }
};
```

### AI Response Format

Use Lovable AI's tool calling for structured output:
- Blog: Returns `{ title, excerpt, content, tags }`
- Destination: Returns `{ description, long_description, highlights }`
- Experience: Returns `{ description, long_description, includes }`

### Admin Sidebar Update

Add to Content section in `AdminLayout.tsx`:
```typescript
{ href: '/admin/ai-content', icon: Sparkles, label: 'AI Generator' }
```

---

## UI/UX Considerations

- **Real-time streaming** - Show AI generating content word-by-word
- **Edit before apply** - Always allow editing generated content
- **Tone selector** - "Luxury", "Warm & Inviting", "Professional"
- **Length control** - Short/Medium/Long content options
- **Copy to clipboard** - Quick copy for external use

---

## Questions for You

Before proceeding with implementation, I'd like to clarify:

1. **Priority content types** - Should we start with blog posts, or focus on destinations/experiences first?

2. **Integration approach** - Do you prefer:
   - A standalone AI Content page (recommended for Phase 1)
   - Inline AI buttons within existing forms
   - Both approaches

3. **Content templates** - Any specific content formats you frequently need? (e.g., seasonal guides, property descriptions, email copy)

4. **Automation** - Is scheduled/automated content generation important, or is manual generation sufficient for now?

