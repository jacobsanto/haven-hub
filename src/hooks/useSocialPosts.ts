import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SocialPlatform } from './useSocialAccounts';

export type SocialPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface SocialPost {
  id: string;
  account_id: string | null;
  content_text: string;
  media_urls: string[];
  hashtags: string[];
  platform: SocialPlatform;
  status: SocialPostStatus;
  scheduled_for: string | null;
  published_at: string | null;
  external_post_id: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  account?: { id: string; account_name: string; platform: string } | null;
}

export interface CreateSocialPostInput {
  account_id?: string | null;
  content_text: string;
  media_urls?: string[];
  hashtags?: string[];
  platform: SocialPlatform;
  status?: SocialPostStatus;
  scheduled_for?: string | null;
}

export function useSocialPosts(filters?: { platform?: SocialPlatform; status?: SocialPostStatus }) {
  return useQuery({
    queryKey: ['social-posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('social_posts')
        .select('*, account:social_accounts(id, account_name, platform)')
        .order('created_at', { ascending: false });

      if (filters?.platform) query = query.eq('platform', filters.platform);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SocialPost[];
    },
  });
}

export function useCreateSocialPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateSocialPostInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          ...input,
          media_urls: input.media_urls || [],
          hashtags: input.hashtags || [],
          created_by: userData.user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      toast({ title: 'Social post created' });
    },
    onError: (e) => toast({ title: 'Failed to create post', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateSocialPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateSocialPostInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('social_posts')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      toast({ title: 'Social post updated' });
    },
    onError: (e) => toast({ title: 'Failed to update post', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteSocialPost() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-posts'] });
      qc.invalidateQueries({ queryKey: ['content-calendar'] });
      toast({ title: 'Social post deleted' });
    },
    onError: (e) => toast({ title: 'Failed to delete post', description: e.message, variant: 'destructive' }),
  });
}
