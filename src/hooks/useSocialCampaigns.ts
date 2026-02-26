import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SocialPlatform } from './useSocialAccounts';

export interface SocialCampaign {
  id: string;
  core_text: string;
  core_hashtags: string[];
  media_urls: string[];
  tone: string | null;
  persona: string | null;
  target_platforms: SocialPlatform[];
  status: string;
  scheduled_for: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  core_text: string;
  core_hashtags?: string[];
  media_urls?: string[];
  tone?: string;
  persona?: string;
  target_platforms: SocialPlatform[];
  status?: string;
  scheduled_for?: string | null;
}

export function useSocialCampaigns() {
  return useQuery({
    queryKey: ['social-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SocialCampaign[];
    },
  });
}

export function useCreateSocialCampaign() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('social_campaigns')
        .insert({
          ...input,
          core_hashtags: input.core_hashtags || [],
          media_urls: input.media_urls || [],
          created_by: userData.user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as SocialCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-campaigns'] });
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      toast({ title: 'Campaign created' });
    },
    onError: (e) => toast({ title: 'Failed to create campaign', description: e.message, variant: 'destructive' }),
  });
}
