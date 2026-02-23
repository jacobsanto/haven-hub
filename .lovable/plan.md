

# Add `short_description` to AI Content Generator

## What Changes

The recently added `short_description` field for properties needs to be wired into the AI content generation pipeline so that when you generate property content, it also produces a compelling short intro paragraph.

## Changes Required

### 1. Edge Function (`supabase/functions/generate-content/index.ts`)

- Add `short_description` to the property tool definition schema with description: *"A compelling 1-2 sentence editorial hook that is always visible to guests"*
- Add `short_description` to the property fields list so the AI is required to generate it
- Update the property system prompt to instruct the AI to produce a short editorial intro separately from the full description

### 2. TypeScript Types (`src/hooks/useAIContent.ts`)

- Add `short_description: string` to the `PropertyContent` interface

### 3. AI Content Generator UI (`src/components/admin/AIContentGenerator.tsx`)

- Add `short_description` to the property field labels map so it displays as "Short Description (Intro)" in the generated content preview

### 4. Apply Handler (`src/pages/admin/AdminAIContent.tsx`)

- Include `short_description` in the `handleApplyProperty` database update so it saves to the properties table

### 5. Property Items Data (`src/pages/admin/AdminAIContent.tsx`)

- Include existing `short_description` in the `propertyItems` existingData so the AI can reference it when regenerating

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-content/index.ts` | Add `short_description` to property schema, fields list, and prompt |
| `src/hooks/useAIContent.ts` | Add `short_description` to `PropertyContent` interface |
| `src/components/admin/AIContentGenerator.tsx` | Add field label for `short_description` |
| `src/pages/admin/AdminAIContent.tsx` | Include in apply handler and existingData |

