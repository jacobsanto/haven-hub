import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  heading_font: string;
  body_font: string;
  updated_at: string;
}

export const defaultBrandSettings: Omit<BrandSettings, 'id' | 'updated_at'> = {
  brand_name: 'Arivia Villas',
  brand_tagline: 'Luxury Living, Redefined',
  logo_url: null,
  contact_email: 'hello@ariviavillas.com',
  contact_phone: '+1 (234) 567-890',
  contact_address: '123 Luxury Lane, Paradise City',
  primary_color: '16 50% 48%',
  secondary_color: '142 25% 55%',
  accent_color: '43 55% 55%',
  background_color: '35 30% 96%',
  foreground_color: '25 30% 15%',
  heading_font: 'Cormorant Garamond',
  body_font: 'Inter',
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
