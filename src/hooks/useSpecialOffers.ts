import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpecialOffer } from '@/types/database';

export function useActiveSpecialOffer(propertyId: string) {
  return useQuery({
    queryKey: ['special-offers', propertyId, 'active'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .order('discount_percent', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SpecialOffer | null;
    },
    enabled: !!propertyId,
  });
}
