import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { SupportedCurrency } from '@/types/currency';

export interface BrandSettings {
  id: string;
  brand_name: string;
  brand_tagline: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  muted_color: string | null;
  card_color: string | null;
  border_color: string | null;
  destructive_color: string | null;
  ring_color: string | null;
  heading_font: string;
  body_font: string;
  base_currency: SupportedCurrency;
  updated_at: string;
}

export const defaultBrandSettings: Omit<BrandSettings, 'id' | 'updated_at'> = {
  brand_name: 'Arivia Villas',
  brand_tagline: 'Luxury Living, Redefined',
  logo_url: null,
  contact_email: 'hello@ariviavillas.com',
  contact_phone: '+1 (234) 567-890',
  contact_address: '123 Luxury Lane, Paradise City',
  primary_color: '245 51% 19%',
  secondary_color: '243 29% 86%',
  accent_color: '32 48% 66%',
  background_color: '0 0% 100%',
  foreground_color: '244 42% 28%',
  muted_color: '243 29% 86%',
  card_color: '0 0% 100%',
  border_color: '243 29% 86%',
  destructive_color: '0 55% 55%',
  ring_color: '32 48% 66%',
  heading_font: 'Playfair Display',
  body_font: 'Lato',
  base_currency: 'EUR',
};

export function useBrandSettings() {
  return useQuery({
    queryKey: ['brand-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BrandSettings | null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUpdateBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<BrandSettings> & { id: string }) => {
      const { data, error } = await supabase
        .from('brand_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-settings'] });
    },
  });
}
