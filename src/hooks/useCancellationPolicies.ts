import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CancellationRule {
  daysBeforeCheckIn: number;
  refundPercentage: number;
}

export interface CancellationPolicyDB {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  is_active: boolean;
  rules: CancellationRule[];
  created_at: string;
  updated_at: string;
}

export type CancellationPolicyFormData = {
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  rules: CancellationRule[];
};

export function useCancellationPolicies() {
  return useQuery({
    queryKey: ['cancellation-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Parse rules from JSON
      return (data || []).map(policy => ({
        ...policy,
        rules: (policy.rules as unknown as CancellationRule[]) || [],
      })) as CancellationPolicyDB[];
    },
  });
}

export function useCancellationPolicy(id: string | null) {
  return useQuery({
    queryKey: ['cancellation-policy', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        rules: (data.rules as unknown as CancellationRule[]) || [],
      } as CancellationPolicyDB;
    },
    enabled: !!id,
  });
}

export function useCreateCancellationPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: CancellationPolicyFormData) => {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .insert({
          name: policy.name,
          description: policy.description,
          color: policy.color,
          is_active: policy.is_active,
          is_default: false, // Custom policies are never default
          rules: JSON.parse(JSON.stringify(policy.rules)),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] });
    },
  });
}

export function useUpdateCancellationPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...policy }: CancellationPolicyFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .update({
          name: policy.name,
          description: policy.description,
          color: policy.color,
          is_active: policy.is_active,
          rules: JSON.parse(JSON.stringify(policy.rules)),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] });
    },
  });
}

export function useDeleteCancellationPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if it's a default policy
      const { data: policy } = await supabase
        .from('cancellation_policies')
        .select('is_default')
        .eq('id', id)
        .single();

      if (policy?.is_default) {
        throw new Error('Cannot delete default policies');
      }

      const { error } = await supabase
        .from('cancellation_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] });
    },
  });
}

export function useDuplicateCancellationPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch original policy
      const { data: original, error: fetchError } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Policy not found');

      // Create duplicate
      const { data, error } = await supabase
        .from('cancellation_policies')
        .insert({
          name: `${original.name} (Copy)`,
          description: original.description,
          color: original.color,
          is_active: false,
          is_default: false,
          rules: original.rules,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellation-policies'] });
    },
  });
}
