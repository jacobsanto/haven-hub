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
  heading_weight: number | null;
  body_weight: number | null;
  heading_letter_spacing: string | null;
  base_currency: SupportedCurrency;
  dark_palette: Record<string, string> | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  updated_at: string;
}

export const defaultBrandSettings: Omit<BrandSettings, 'id' | 'updated_at'> = {
  brand_name: 'Arivia',
  brand_tagline: 'Live Like a Local',
  logo_url: null,
  contact_email: 'hello@ariviavillas.com',
  contact_phone: '+1 (234) 567-890',
  contact_address: '123 Luxury Lane, Paradise City',
  primary_color: '209 55% 23%',
  secondary_color: '30 33% 94%',
  accent_color: '26 42% 59%',
  background_color: '0 0% 100%',
  foreground_color: '210 29% 24%',
  muted_color: '192 15% 94%',
  card_color: '0 0% 100%',
  border_color: '192 15% 94%',
  destructive_color: '28 80% 52%',
  ring_color: '199 57% 39%',
  heading_font: 'Montserrat',
  body_font: 'Nunito Sans',
  heading_weight: 600,
  body_weight: 400,
  heading_letter_spacing: 'normal',
  base_currency: 'EUR',
  dark_palette: null,
  social_instagram: null,
  social_facebook: null,
  social_twitter: null,
  social_youtube: null,
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
