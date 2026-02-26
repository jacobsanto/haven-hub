

# Unified Social Media Post Creator

## Overview
Replace the current per-platform post creation flow with a **unified multi-step composer**. The admin writes core content once, then the system auto-generates optimized variants for all selected platforms using AI. An approval/edit step lets the admin review and tweak each variant before scheduling.

## New Platforms
Expand from 4 to 8 platforms, adding travel-friendly channels:
- **Existing**: Instagram, LinkedIn, TikTok, Google Business
- **New**: Twitter/X, Reddit, Pinterest, Facebook

## How It Works (User Flow)

```text
Step 1: COMPOSE CORE           Step 2: SELECT PLATFORMS         Step 3: REVIEW VARIANTS
+----------------------+       +----------------------+        +----------------------+
| Topic / Theme        |       | [x] Instagram        |        | Instagram  [2200 ch] |
| Core Message (text)  | --->  | [x] LinkedIn         | --->   | LinkedIn   [3000 ch] |
| Media uploads        |       | [x] Twitter/X        |        | Twitter/X  [280 ch]  |
| Hashtag seeds        |       | [ ] Reddit           |        | Reddit     [editable]|
| Tone / Persona       |       | [ ] Pinterest        |        |                      |
| AI Generate button   |       | [x] Facebook         |        | [Approve All]        |
+----------------------+       +----------------------+        | [Schedule]  [Save]   |
                                                               +----------------------+
```

1. **Step 1 -- Core Content**: Write a single message, upload media, set tone/persona, optionally click "AI Generate" to draft the core text.
2. **Step 2 -- Platform Selection**: Pick which platforms to publish to. Each shows connected accounts (if any).
3. **Step 3 -- Review Variants**: AI auto-optimizes the core content for each selected platform (character limits, hashtag style, tone adjustments). Admin can edit each variant individually, approve all, and schedule.

## Database Changes

**Modify `social_posts` table** -- Add two columns:
- `campaign_id` (uuid, nullable) -- Groups posts that originated from the same core content
- `core_content` (text, nullable) -- Stores the original unoptimized text

**New `social_campaigns` table** -- Represents a unified content creation session:
- `id` (uuid, PK)
- `core_text` (text) -- Original message
- `core_hashtags` (text[]) -- Seed hashtags
- `media_urls` (jsonb) -- Shared media
- `tone` (text, nullable) -- Tone setting used
- `persona` (text, nullable) -- Target persona
- `target_platforms` (text[]) -- Which platforms were selected
- `status` (text, default 'draft') -- draft, ready, scheduled, published
- `scheduled_for` (timestamptz, nullable)
- `created_by` (uuid, nullable)
- `created_at`, `updated_at` (timestamptz)
- Admin-only RLS

**Modify `social_accounts` platform column** -- Allow new platform values: `twitter`, `reddit`, `pinterest`, `facebook`

## File Changes

### New Files

**`src/pages/admin/AdminSocialComposer.tsx`** -- Full-page multi-step composer
- Step 1: Core content editor with AI generation
- Step 2: Platform selector with account linking
- Step 3: Per-platform variant review with inline editing
- Save creates one `social_campaigns` row + one `social_posts` row per platform

**`src/hooks/useSocialCampaigns.ts`** -- CRUD for social_campaigns table

**`src/hooks/useSocialOptimize.ts`** -- Calls AI to generate platform-specific variants from core content. Uses `generate-content` edge function with a new `social_variants` content type.

### Modified Files

**`src/hooks/useSocialAccounts.ts`**
- Expand `SocialPlatform` type to include `twitter`, `reddit`, `pinterest`, `facebook`
- Add labels and platform metadata for all 8 platforms

**`src/hooks/useSocialPosts.ts`**
- Add `campaign_id` and `core_content` to `SocialPost` interface
- Add `CreateSocialPostInput` fields for campaign linking

**`src/pages/admin/AdminSocialPosts.tsx`**
- Update platform icons map for new platforms
- Add "New Campaign" button that navigates to the composer page
- Group posts by campaign_id in the table view (expandable rows)

**`src/components/admin/SocialPostFormDialog.tsx`**
- Add new platform options to the dropdown
- Keep as single-post quick-edit for individual variant tweaks

**`src/App.tsx`**
- Add route `/admin/social-composer` for the new composer page

**`src/components/admin/AdminLayout.tsx`**
- Add "Create Post" nav item under Social Media section

**`src/components/admin/ContentCalendar.tsx`**
- Add icons for new platforms (Twitter, Reddit, Pinterest, Facebook)
- Color-code new platforms in calendar

**`src/components/admin/SocialAnalyticsTab.tsx`**
- Add new platforms to analytics breakdown

**`supabase/functions/generate-content/index.ts`**
- Add `social_variants` content type that takes core text + list of platforms and returns optimized text per platform with:
  - Platform-specific character limits
  - Hashtag formatting (e.g., Twitter uses fewer, Reddit uses none)
  - Tone adjustments (LinkedIn more professional, Reddit more conversational)
  - CTA style differences

### Platform Optimization Rules (Built into AI Prompt)

| Platform | Char Limit | Hashtag Style | Tone | Notes |
|----------|-----------|---------------|------|-------|
| Instagram | 2,200 | 15-30 hashtags, separate block | Visual, lifestyle | Emoji-friendly |
| LinkedIn | 3,000 | 3-5 hashtags inline | Professional | Thought-leadership |
| Twitter/X | 280 | 1-3 hashtags inline | Concise, punchy | Thread-ready |
| TikTok | 2,200 | 5-10 trending tags | Casual, Gen-Z | Video-first caption |
| Reddit | 40,000 | No hashtags | Conversational, value-first | Subreddit context |
| Pinterest | 500 | Keywords as tags | Aspirational, searchable | SEO-focused |
| Facebook | 63,206 | 1-3 hashtags | Warm, community | Engagement-focused |
| Google Business | 1,500 | No hashtags | Informative, local | Update/offer format |

## Sequencing
1. Database migration (social_campaigns table + new columns on social_posts + platform expansion)
2. Update hooks (useSocialAccounts platform expansion, useSocialCampaigns, useSocialOptimize)
3. Update generate-content edge function with social_variants type
4. Build AdminSocialComposer page (3-step flow)
5. Update AdminSocialPosts to show campaigns + new platforms
6. Update calendar and analytics for new platforms
7. Wire up routing and navigation

