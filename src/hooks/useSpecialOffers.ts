import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpecialOffer } from '@/types/database';

export function useSpecialOffers(propertyId: string) {
  return useQuery({
    queryKey: ['special-offers', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('property_id', propertyId)
        .order('valid_from', { ascending: true });

      if (error) throw error;
      return data as SpecialOffer[];
    },
    enabled: !!propertyId,
  });
}

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

export function useAllActiveOffers() {
  return useQuery({
    queryKey: ['special-offers', 'all-active'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('special_offers')
        .select(`
          *,
          property:properties(id, name, slug, hero_image_url, city, country)
        `)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_until', today)
        .order('discount_percent', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: Omit<SpecialOffer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('special_offers')
        .insert(offer)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialOffer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['special-offers', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['special-offers', 'all-active'] });
    },
  });
}

export function useUpdateSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpecialOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('special_offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SpecialOffer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['special-offers', data.property_id] });
      queryClient.invalidateQueries({ queryKey: ['special-offers', 'all-active'] });
    },
  });
}

export function useDeleteSpecialOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from('special_offers').delete().eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['special-offers', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['special-offers', 'all-active'] });
    },
  });
}
