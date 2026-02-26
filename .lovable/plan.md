

# Add Humanize Button to Social Media Posts & Campaigns

## Overview
Add the existing "Humanize" AI capability to social media content, allowing admins to refine AI-generated social posts to sound more natural and authentic. This adds a "Humanize" button alongside the existing "Rewrite" button in both the Campaign Composer (Step 3) and the Single Post Dialog.

## What Changes

### 1. Edge Function: `generate-content/index.ts`
Add a `social_humanize` handler that:
- Accepts `content_text` and `hashtags` from a social post
- Uses the existing `humanizeSystemPrompt` with social-specific instructions
- Returns humanized `content_text` and `hashtags` in the same structure
- Uses the `rewrite_social_content` tool schema for structured output

### 2. Campaign Composer: `AdminSocialComposer.tsx` (Step 1 + Step 3)
- **Step 1**: Add a "Humanize" button next to the core text area (visible when core text exists). Calls `social_humanize` to refine the core message.
- **Step 3**: Add a "Humanize" button on each platform variant card, next to the existing "Rewrite" button. Refines that variant's text to sound more natural while keeping it platform-appropriate.
- Track `humanizingPlatform` state (similar to existing `rewritingPlatform`).

### 3. Single Post Dialog: `SocialPostFormDialog.tsx`
- Add a "Humanize" button below the content textarea (visible when content exists).
- Calls `social_humanize` with the current `content_text` and platform.
- Replaces content and hashtags in place.
- Track `isHumanizing` state with loading indicator.

## Technical Details

### Edge Function Addition (in `generate-content/index.ts`)
Add a new handler block for `social_humanize` content type, placed after the existing `social_rewrite` block:
- Receives `{ contentType: 'social_humanize', existingData: { platform, content_text, hashtags } }`
- System prompt combines the existing `humanizeSystemPrompt` philosophy with social-specific guidance (keep platform tone, preserve hashtag relevance)
- Returns `{ content_text, hashtags }` via the `rewrite_social_content` tool

### UI Changes

**AdminSocialComposer.tsx:**
- Add `humanizingPlatform` state (type `SocialPlatform | 'core' | null`)
- Step 1: "Humanize" button with User icon, visible when `coreText` is non-empty, calls `social_humanize` with platform set to "general"
- Step 3: "Humanize" button per variant card (next to Rewrite), calls `social_humanize` with the variant's platform

**SocialPostFormDialog.tsx:**
- Add `isHumanizing` state
- Add a "Humanize" button next to or below the content textarea
- Visible only when `contentText` is non-empty
- Calls `social_humanize` and updates `contentText` and `hashtags`

### No Database Changes Required
All changes are UI and edge function logic only.

## Sequencing
1. Update `generate-content` edge function with `social_humanize` handler
2. Add Humanize button to `AdminSocialComposer.tsx` (Step 1 core text + Step 3 variants)
3. Add Humanize button to `SocialPostFormDialog.tsx`

