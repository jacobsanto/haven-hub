import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RatePlan {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  rate_type: string;
  base_rate: number;
  min_stay: number;
  max_stay: number | null;
  valid_from: string;
  valid_until: string;
  member_tier_required: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property?: { id: string; name: string };
}

export type RatePlanFormData = Omit<RatePlan, 'id' | 'created_at' | 'updated_at' | 'property'>;

export function useAdminRatePlans(propertyId?: string) {
  return useQuery({
    queryKey: ['admin', 'rate-plans', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('rate_plans')
        .select(`
          *,
          property:properties(id, name)
        `)
        .order('property_id', { ascending: true })
        .order('valid_from', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RatePlan[];
    },
  });
}

export function useCreateRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratePlan: RatePlanFormData) => {
      const { data, error } = await supabase
        .from('rate_plans')
        .insert(ratePlan)
        .select()
        .single();

      if (error) throw error;
      return data as RatePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rate-plans'] });
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
    },
  });
}

export function useUpdateRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...ratePlan }: Partial<RatePlan> & { id: string }) => {
      const { property, ...ratePlanData } = ratePlan;
      const { data, error } = await supabase
        .from('rate_plans')
        .update(ratePlanData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as RatePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rate-plans'] });
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
    },
  });
}

export function useDeleteRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rate_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rate-plans'] });
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
    },
  });
}

export function useDuplicateRatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch the original rate plan
      const { data: original, error: fetchError } = await supabase
        .from('rate_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Rate plan not found');

      // Create duplicate with modified name
      const { id: _, created_at, updated_at, ...rest } = original;
      const { data, error } = await supabase
        .from('rate_plans')
        .insert({
          ...rest,
          name: `${original.name} (Copy)`,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RatePlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rate-plans'] });
    },
  });
}
