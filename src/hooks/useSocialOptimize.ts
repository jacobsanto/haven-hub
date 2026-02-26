import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SocialPlatform } from './useSocialAccounts';

export interface PlatformVariant {
  platform: SocialPlatform;
  content_text: string;
  hashtags: string[];
}

export function useSocialOptimize() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = async (
    coreText: string,
    coreHashtags: string[],
    platforms: SocialPlatform[],
    tone?: string,
  ): Promise<PlatformVariant[]> => {
    setIsOptimizing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-content', {
        body: {
          contentType: 'social_variants',
          targetName: 'Social media campaign',
          existingData: { core_text: coreText, core_hashtags: coreHashtags, platforms },
          tone: tone || 'warm',
        },
      });

      if (fnError) throw fnError;

      if (data?.content?.variants) {
        return data.content.variants as PlatformVariant[];
      }

      // Fallback: return core text adapted per platform if AI doesn't respond as expected
      return platforms.map(platform => ({
        platform,
        content_text: coreText,
        hashtags: coreHashtags,
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to optimize');
      // Return fallback variants so the flow isn't blocked
      return platforms.map(platform => ({
        platform,
        content_text: coreText,
        hashtags: coreHashtags,
      }));
    } finally {
      setIsOptimizing(false);
    }
  };

  return { optimize, isOptimizing, error };
}
