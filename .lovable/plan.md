

# Social Media Content Manager

## Overview
Add a social media content creation, scheduling, and analytics system to the Content Hub. This enables creating and scheduling posts for Instagram, LinkedIn, TikTok, and Google My Business -- integrated with the existing Content Calendar and Analytics page.

## What Gets Built

### 1. Database Tables

**`social_accounts`** -- Stores connected social media account credentials and metadata
- id, platform (instagram, linkedin, tiktok, google_business), account_name, account_id, access_token (encrypted), refresh_token, token_expires_at, is_active, avatar_url, created_at, updated_at
- Admin-only RLS

**`social_posts`** -- Individual social media posts (draft, scheduled, published, failed)
- id, account_id (FK to social_accounts), content_text, media_urls (jsonb array), hashtags (text[]), platform, status (draft/scheduled/publishing/published/failed), scheduled_for, published_at, external_post_id, error_message, created_by, created_at, updated_at
- Admin-only RLS

**`social_post_analytics`** -- Performance metrics per published post
- id, social_post_id (FK to social_posts), impressions, reach, likes, comments, shares, saves, clicks, engagement_rate, fetched_at
- Admin-only RLS

### 2. New Admin Pages & Components

**Social Accounts Manager** (`src/pages/admin/AdminSocialAccounts.tsx`)
- List connected accounts with platform icons, status badges
- "Connect Account" dialog per platform with instructions on obtaining API credentials
- Each account shows last sync status, follower count

**Social Post Composer** (`src/components/admin/SocialPostComposer.tsx`)
- Multi-platform post creation dialog
- Text editor with character count per platform (Instagram 2200, LinkedIn 3000, TikTok 2200, GMB 1500)
- Media upload area (images/video thumbnails)
- Hashtag suggestions
- Platform preview tabs showing how the post will look
- AI content generation button (reuses existing AI content system with a new `social` content type)
- Schedule date/time picker or "Post Now" option
- Multi-select which connected accounts to post to

**Social Post Form Dialog** (`src/components/admin/SocialPostFormDialog.tsx`)
- Create/edit dialog for social posts with all composer fields
- Platform-specific validation (character limits, media requirements)

### 3. Content Calendar Integration

Extend the existing `ContentCalendar` component and `useContentCalendarData` hook:
- Add social posts to the calendar grid alongside blog posts
- Color-code by platform (Instagram purple, LinkedIn blue, TikTok dark, GMB blue-green)
- New legend entries for each platform
- Calendar day click can create either blog or social post

### 4. Analytics Integration

Add a **"Social Media"** tab (5th tab) to `AdminAnalytics.tsx`:
- Overview cards: total posts, total reach, total engagement, avg engagement rate
- Per-platform breakdown table with sortable columns
- Top performing posts list with engagement metrics
- Trend chart showing engagement over time

### 5. Content Hub Tab

Add a "Social Media" tab to the Content Hub navigation alongside Blog Posts, Authors, Categories, AI Generator, and Calendar.

### 6. AI Content Generation for Social

Extend `useAIContent.ts`:
- Add `social` as a new ContentType
- Add `SocialContent` interface (caption, hashtags, platform_variants)
- Update the `generate-content` edge function with social media prompt templates

### 7. Edge Function for Social Posting

**`supabase/functions/social-publish/index.ts`**
- Receives post ID, fetches content and account credentials
- Publishes to the appropriate platform API
- Updates post status to published/failed
- Stores external_post_id for analytics fetching

**`supabase/functions/social-analytics-sync/index.ts`**
- Fetches engagement metrics for published posts
- Updates social_post_analytics table

### 8. Hooks

- `useSocialAccounts()` -- CRUD for connected accounts
- `useSocialPosts()` -- CRUD + scheduling for posts
- `useSocialAnalytics()` -- Fetch aggregated social analytics

## Technical Details

### File Changes (Existing)
- `src/App.tsx` -- Add route for `/admin/social-accounts`
- `src/pages/admin/AdminContentHub.tsx` -- Add "Social Media" tab
- `src/pages/admin/AdminAnalytics.tsx` -- Add 5th "Social" tab
- `src/components/admin/ContentCalendar.tsx` -- Include social posts in calendar grid
- `src/hooks/useScheduledPosts.ts` -- Extend `useContentCalendarData` to also fetch social_posts
- `src/hooks/useAIContent.ts` -- Add `social` content type and `SocialContent` interface
- `supabase/functions/generate-content/index.ts` -- Add social media prompt templates
- `src/components/admin/AdminLayout.tsx` -- Add Social Media nav item under Content section

### New Files
- `supabase/migrations/xxx_social_media_tables.sql`
- `src/pages/admin/AdminSocialAccounts.tsx`
- `src/components/admin/SocialPostComposer.tsx`
- `src/components/admin/SocialPostFormDialog.tsx`
- `src/hooks/useSocialAccounts.ts`
- `src/hooks/useSocialPosts.ts`
- `src/hooks/useSocialAnalytics.ts`
- `supabase/functions/social-publish/index.ts`
- `supabase/functions/social-analytics-sync/index.ts`

### Account Connection Flow
Since each social platform has its own OAuth flow that requires redirect URIs and app registration, the initial implementation will use a **manual API token** approach:
1. Admin enters platform API credentials (access token, account ID) via the Social Accounts manager
2. Tokens are stored securely in the database (admin-only RLS)
3. Edge functions use these tokens to publish and fetch analytics
4. Future enhancement: Add OAuth flows per platform

### Platform API Requirements
Each platform will need API keys/tokens configured as secrets:
- **Instagram**: Meta Graph API (requires Facebook App + Instagram Business Account)
- **LinkedIn**: LinkedIn Marketing API (requires LinkedIn App)
- **TikTok**: TikTok for Business API
- **Google My Business**: Google Business Profile API

The system will be built API-ready but will initially work in "draft/schedule" mode without requiring live API connections -- admins can use it as a planning tool and manually post, then mark as published.

## Sequencing
1. Database migration (tables + RLS)
2. Hooks (useSocialAccounts, useSocialPosts, useSocialAnalytics)
3. Social Accounts page + Social Post Composer
4. Content Calendar integration
5. Analytics tab integration
6. Content Hub tab addition
7. AI content generation extension
8. Edge functions for publishing (API-ready, manual mode first)

