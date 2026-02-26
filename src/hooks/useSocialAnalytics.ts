import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SocialPlatform } from './useSocialAccounts';

export interface SocialAnalyticsSummary {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  platformBreakdown: {
    platform: SocialPlatform;
    posts: number;
    reach: number;
    engagement: number;
    avgEngagementRate: number;
  }[];
  topPosts: {
    id: string;
    content_text: string;
    platform: SocialPlatform;
    published_at: string | null;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
  }[];
}

export function useSocialAnalytics() {
  return useQuery({
    queryKey: ['social-analytics'],
    queryFn: async (): Promise<SocialAnalyticsSummary> => {
      // Fetch published posts with their analytics
      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('id, content_text, platform, published_at, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (postsError) throw postsError;

      const postIds = (posts || []).map(p => p.id);

      let analyticsData: any[] = [];
      if (postIds.length > 0) {
        const { data, error } = await supabase
          .from('social_post_analytics')
          .select('*')
          .in('social_post_id', postIds);
        if (error) throw error;
        analyticsData = data || [];
      }

      // Build analytics map (latest per post)
      const analyticsMap = new Map<string, any>();
      for (const a of analyticsData) {
        const existing = analyticsMap.get(a.social_post_id);
        if (!existing || new Date(a.fetched_at) > new Date(existing.fetched_at)) {
          analyticsMap.set(a.social_post_id, a);
        }
      }

      // Aggregate
      const platforms = ['instagram', 'linkedin', 'tiktok', 'google_business'] as SocialPlatform[];
      let totalReach = 0;
      let totalEngagement = 0;
      let engRateSum = 0;
      let engRateCount = 0;

      const platformMap = new Map<SocialPlatform, { posts: number; reach: number; engagement: number; engRateSum: number }>();
      platforms.forEach(p => platformMap.set(p, { posts: 0, reach: 0, engagement: 0, engRateSum: 0 }));

      const topPosts: SocialAnalyticsSummary['topPosts'] = [];

      for (const post of posts || []) {
        const a = analyticsMap.get(post.id);
        const reach = a?.reach || 0;
        const engagement = (a?.likes || 0) + (a?.comments || 0) + (a?.shares || 0) + (a?.saves || 0);
        const engRate = a?.engagement_rate || 0;

        totalReach += reach;
        totalEngagement += engagement;
        if (engRate > 0) { engRateSum += engRate; engRateCount++; }

        const pm = platformMap.get(post.platform as SocialPlatform);
        if (pm) {
          pm.posts++;
          pm.reach += reach;
          pm.engagement += engagement;
          pm.engRateSum += engRate;
        }

        topPosts.push({
          id: post.id,
          content_text: post.content_text,
          platform: post.platform as SocialPlatform,
          published_at: post.published_at,
          impressions: a?.impressions || 0,
          reach,
          likes: a?.likes || 0,
          comments: a?.comments || 0,
          shares: a?.shares || 0,
          engagement_rate: engRate,
        });
      }

      // Sort top posts by engagement
      topPosts.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));

      return {
        totalPosts: (posts || []).length,
        totalReach,
        totalEngagement,
        avgEngagementRate: engRateCount > 0 ? engRateSum / engRateCount : 0,
        platformBreakdown: platforms
          .map(p => {
            const pm = platformMap.get(p)!;
            return {
              platform: p,
              posts: pm.posts,
              reach: pm.reach,
              engagement: pm.engagement,
              avgEngagementRate: pm.posts > 0 ? pm.engRateSum / pm.posts : 0,
            };
          })
          .filter(p => p.posts > 0),
        topPosts: topPosts.slice(0, 10),
      };
    },
  });
}
