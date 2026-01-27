import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SeasonalRate } from '@/types/database';

export function useSeasonalRates(propertyId: string) {
  return useQuery({
    queryKey: ['seasonal-rates', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_rates')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as SeasonalRate[];
    },
    enabled: !!propertyId,
  });
}

export function useCreateSeasonalRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<SeasonalRate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('seasonal_rates')
        .insert(rate)
        .select()
        .single();

      if (error) throw error;
      return data as SeasonalRate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasonal-rates', data.property_id] });
    },
  });
}

export function useUpdateSeasonalRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SeasonalRate> & { id: string }) => {
      const { data, error } = await supabase
        .from('seasonal_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SeasonalRate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasonal-rates', data.property_id] });
    },
  });
}

export function useDeleteSeasonalRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from('seasonal_rates').delete().eq('id', id);
      if (error) throw error;
      return propertyId;
    },
    onSuccess: (propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['seasonal-rates', propertyId] });
    },
  });
}

// Calculate price for a specific date based on seasonal rates
export function calculatePriceForDate(
  basePrice: number,
  date: Date,
  seasonalRates: SeasonalRate[]
): number {
  const dateStr = date.toISOString().split('T')[0];

  const matchingRate = seasonalRates.find(
    (rate) => dateStr >= rate.start_date && dateStr <= rate.end_date
  );

  if (matchingRate) {
    if (matchingRate.nightly_rate) {
      return matchingRate.nightly_rate;
    }
    return basePrice * matchingRate.price_multiplier;
  }

  return basePrice;
}
