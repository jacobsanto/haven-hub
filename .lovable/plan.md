

# AI Copywriter for Social Media Campaigns & Posts

## Overview
Add an AI-powered copywriting assistant directly into the Social Media Composer (campaign flow) and the individual Social Post Form Dialog. The AI can generate core content from a topic/prompt in Step 1 of the composer, and can also generate or rewrite content for individual posts in the single-post dialog.

## What Gets Built

### 1. AI Generate in Campaign Composer (Step 1)

Add an "AI Write" panel to the core content step of `AdminSocialComposer.tsx`:
- A text input for a **topic/prompt** (e.g., "Promote our new Bali villa for summer season")
- An "AI Generate" button with sparkles icon
- When clicked, calls `generate-content` with a new `social_core` content type
- AI returns a polished core message + suggested hashtags
- Content fills into the existing core text and hashtag fields
- Admin can then edit before proceeding to platform selection

### 2. AI Rewrite per Variant (Step 3)

Add a small "Rewrite with AI" button on each platform variant card in Step 3:
- Sends just that variant's text back to AI with platform-specific instructions
- Returns a refreshed version optimized for that specific platform
- Replaces the variant text in place (admin can undo by going back)

### 3. AI Generate in Single Post Dialog

Add an "AI Assist" section to `SocialPostFormDialog.tsx`:
- A collapsible panel with a topic input and "Generate" button
- Generates platform-specific content based on the selected platform
- Fills the content textarea and suggests hashtags

### 4. Edge Function Update

Extend `generate-content/index.ts` with two new modes:
- **`social_core`**: Generates a core social media message + hashtags from a topic. Returns `{ core_text, hashtags }`.
- **`social_rewrite`**: Takes existing text + platform and rewrites it optimized for that specific platform. Returns `{ content_text, hashtags }`.

## Technical Details

### Modified Files

**`supabase/functions/generate-content/index.ts`**
- Add `social_core` and `social_rewrite` to the ContentType union
- Add handler blocks for each:
  - `social_core`: System prompt for luxury travel social media copywriting. Tool returns `{ core_text: string, hashtags: string[] }`.
  - `social_rewrite`: Takes `platform` and `content_text` from `existingData`, rewrites with platform-specific rules. Tool returns `{ content_text: string, hashtags: string[] }`.

**`src/pages/admin/AdminSocialComposer.tsx`**
- Add state: `aiTopic`, `isAIGenerating`
- Add an AI panel in Step 1 with topic input and generate button
- On generate: call `supabase.functions.invoke('generate-content', { body: { contentType: 'social_core', targetName: aiTopic, tone } })`
- Fill `coreText` and `coreHashtags` from response
- In Step 3: add a small "Rewrite" button per variant card that calls `generate-content` with `social_rewrite` mode

**`src/components/admin/SocialPostFormDialog.tsx`**
- Add a collapsible AI assist section above the content textarea
- Topic input + "Generate" button
- Calls `generate-content` with `social_rewrite` mode using current platform
- Fills `contentText` and `hashtags` fields

### No Database Changes Required
All changes are UI and edge function logic only.

## Sequencing
1. Update `generate-content` edge function with `social_core` and `social_rewrite` handlers
2. Add AI copywriter panel to `AdminSocialComposer.tsx` (Step 1 + Step 3 rewrite buttons)
3. Add AI assist to `SocialPostFormDialog.tsx`

