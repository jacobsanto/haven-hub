import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PromotionalCampaign } from './useActivePromotion';

export interface CampaignFormData {
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  discount_method: 'coupon' | 'automatic';
  coupon_id?: string;
  auto_discount_percent?: number;
  starts_at: string;
  ends_at: string;
  trigger_type: 'entry' | 'exit' | 'both' | 'timed';
  trigger_delay_seconds?: number;
  show_on_mobile?: boolean;
  applicable_pages?: string[];
  applicable_properties?: string[];
  priority?: number;
  max_impressions?: number;
  is_active?: boolean;
}

export function usePromotionalCampaigns() {
  return useQuery({
    queryKey: ['promotional-campaigns'],
    queryFn: async (): Promise<PromotionalCampaign[]> => {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .select(`
          *,
          coupon:coupons_promos!coupon_id (
            code,
            discount_type,
            discount_value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotional campaigns:', error);
        throw error;
      }

      return (data || []) as unknown as PromotionalCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CampaignFormData) => {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .insert({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          image_url: formData.image_url || null,
          cta_text: formData.cta_text || 'Claim Offer',
          cta_link: formData.cta_link || null,
          discount_method: formData.discount_method,
          coupon_id: formData.discount_method === 'coupon' ? formData.coupon_id : null,
          auto_discount_percent: formData.discount_method === 'automatic' ? formData.auto_discount_percent : null,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
          trigger_type: formData.trigger_type,
          trigger_delay_seconds: formData.trigger_delay_seconds || 0,
          show_on_mobile: formData.show_on_mobile ?? true,
          applicable_pages: formData.applicable_pages || [],
          applicable_properties: formData.applicable_properties || [],
          priority: formData.priority || 0,
          max_impressions: formData.max_impressions || null,
          is_active: formData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotion'] });
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: CampaignFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('promotional_campaigns')
        .update({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          image_url: formData.image_url || null,
          cta_text: formData.cta_text || 'Claim Offer',
          cta_link: formData.cta_link || null,
          discount_method: formData.discount_method,
          coupon_id: formData.discount_method === 'coupon' ? formData.coupon_id : null,
          auto_discount_percent: formData.discount_method === 'automatic' ? formData.auto_discount_percent : null,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
          trigger_type: formData.trigger_type,
          trigger_delay_seconds: formData.trigger_delay_seconds || 0,
          show_on_mobile: formData.show_on_mobile ?? true,
          applicable_pages: formData.applicable_pages || [],
          applicable_properties: formData.applicable_properties || [],
          priority: formData.priority || 0,
          max_impressions: formData.max_impressions || null,
          is_active: formData.is_active ?? true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotion'] });
      toast.success('Campaign updated successfully');
    },
    onError: (error) => {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotional_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotion'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    },
  });
}

export function useToggleCampaignActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promotional_campaigns')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['promotional-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['active-promotion'] });
      toast.success(`Campaign ${is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign status');
    },
  });
}
