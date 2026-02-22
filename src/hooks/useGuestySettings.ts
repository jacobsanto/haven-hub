import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GuestyWidgetSettings {
  id: string;
  site_url: string;
  widget_id: string;
  accent_color: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useGuestySettings() {
  return useQuery({
    queryKey: ['guesty-widget-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('guesty_widget_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as GuestyWidgetSettings | null;
    },
  });
}

export function useUpsertGuestySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<GuestyWidgetSettings> & { site_url: string; widget_id: string }) => {
      const sb = supabase as any;
      const { data: existing } = await sb
        .from('guesty_widget_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await sb
          .from('guesty_widget_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await sb
          .from('guesty_widget_settings')
          .insert(settings)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guesty-widget-settings'] });
    },
  });
}
