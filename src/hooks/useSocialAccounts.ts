import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SocialPlatform = 'instagram' | 'linkedin' | 'tiktok' | 'google_business' | 'twitter' | 'reddit' | 'pinterest' | 'facebook';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  is_active: boolean;
  avatar_url: string | null;
  follower_count: number;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSocialAccountInput {
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  access_token?: string;
  refresh_token?: string;
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  google_business: 'Google Business',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  facebook: 'Facebook',
};

export const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
  google_business: 1500,
  twitter: 280,
  reddit: 40000,
  pinterest: 500,
  facebook: 63206,
};

export const getPlatformLabel = (p: SocialPlatform) => PLATFORM_LABELS[p] || p;

export function useSocialAccounts() {
  return useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('id, platform, account_name, account_id, is_active, avatar_url, follower_count, last_sync_at, created_at, updated_at')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as SocialAccount[];
    },
  });
}

export function useCreateSocialAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateSocialAccountInput) => {
      const { data, error } = await supabase
        .from('social_accounts')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({ title: 'Account connected' });
    },
    onError: (e) => toast({ title: 'Failed to connect account', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateSocialAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateSocialAccountInput> & { id: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('social_accounts')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({ title: 'Account updated' });
    },
    onError: (e) => toast({ title: 'Failed to update account', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteSocialAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({ title: 'Account removed' });
    },
    onError: (e) => toast({ title: 'Failed to remove account', description: e.message, variant: 'destructive' }),
  });
}
