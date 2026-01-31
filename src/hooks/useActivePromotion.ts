import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PromotionalCampaign {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  discount_method: 'coupon' | 'automatic';
  coupon_id: string | null;
  auto_discount_percent: number | null;
  starts_at: string;
  ends_at: string;
  trigger_type: 'entry' | 'exit' | 'both' | 'timed';
  trigger_delay_seconds: number;
  show_on_mobile: boolean;
  applicable_pages: string[];
  applicable_properties: string[];
  priority: number;
  max_impressions: number | null;
  impressions_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  coupon?: {
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

interface UseActivePromotionOptions {
  currentPage?: string;
  triggerType?: 'entry' | 'exit' | 'both' | 'timed';
}

export function useActivePromotion(options: UseActivePromotionOptions = {}) {
  const { currentPage, triggerType } = options;

  return useQuery({
    queryKey: ['active-promotion', currentPage, triggerType],
    queryFn: async (): Promise<PromotionalCampaign | null> => {
      let query = supabase
        .from('promotional_campaigns')
        .select(`
          *,
          coupon:coupons_promos!coupon_id (
            code,
            discount_type,
            discount_value
          )
        `)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(1);

      // Filter by trigger type if specified
      if (triggerType && triggerType !== 'both') {
        query = query.or(`trigger_type.eq.${triggerType},trigger_type.eq.both`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching active promotion:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const campaign = data[0] as unknown as PromotionalCampaign;

      // Check page targeting if applicable
      if (currentPage && campaign.applicable_pages && campaign.applicable_pages.length > 0) {
        const matchesPage = campaign.applicable_pages.some(page => 
          currentPage.includes(page) || page === '*'
        );
        if (!matchesPage) return null;
      }

      // Check impression limit
      if (campaign.max_impressions && campaign.impressions_count >= campaign.max_impressions) {
        return null;
      }

      return campaign;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
}

export async function incrementCampaignImpression(campaignId: string) {
  try {
    // Get current count and increment
    const { data: current } = await supabase
      .from('promotional_campaigns')
      .select('impressions_count')
      .eq('id', campaignId)
      .single();

    if (current) {
      await supabase
        .from('promotional_campaigns')
        .update({ impressions_count: (current.impressions_count || 0) + 1 })
        .eq('id', campaignId);
    }
  } catch (error) {
    console.error('Failed to increment impression:', error);
  }
}
