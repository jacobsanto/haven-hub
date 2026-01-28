import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeeTax {
  id: string;
  property_id: string | null;
  name: string;
  fee_type: string;
  amount: number;
  is_tax: boolean;
  is_mandatory: boolean;
  applies_to: string;
  is_active: boolean;
  created_at: string;
}

export type FeeFormData = Omit<FeeTax, 'id' | 'created_at'>;

export function useAdminFees(propertyId?: string) {
  return useQuery({
    queryKey: ['admin', 'fees', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('fees_taxes')
        .select('*')
        .order('is_tax', { ascending: true })
        .order('name', { ascending: true });

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeeTax[];
    },
  });
}

export function useCreateFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fee: FeeFormData) => {
      const { data, error } = await supabase
        .from('fees_taxes')
        .insert(fee)
        .select()
        .single();

      if (error) throw error;
      return data as FeeTax;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

export function useUpdateFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...fee }: Partial<FeeTax> & { id: string }) => {
      const { data, error } = await supabase
        .from('fees_taxes')
        .update(fee)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FeeTax;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

export function useDeleteFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fees_taxes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

// Helper to calculate fee amount based on type
export function calculateFeeAmount(
  fee: FeeTax,
  baseAmount: number,
  nights: number,
  guests: number
): number {
  switch (fee.fee_type) {
    case 'fixed':
      return fee.amount;
    case 'percentage':
      return (baseAmount * fee.amount) / 100;
    case 'per_night':
      return fee.amount * nights;
    case 'per_guest':
      return fee.amount * guests;
    case 'per_guest_per_night':
      return fee.amount * guests * nights;
    default:
      return fee.amount;
  }
}
