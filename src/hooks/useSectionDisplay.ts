import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SectionDisplaySettings {
  id?: string;
  page_slug: string;
  section_key: string;
  layout_mode: 'grid' | 'carousel' | 'list' | 'featured' | 'parallax-depth' | 'split-reveal' | 'morph-tiles' | 'cinematic' | 'vertical-curtain' | 'card-deck' | 'bright-minimalist';
  columns: number;
  animation: 'fade-up' | 'scale-in' | 'slide-in' | 'none';
  autoplay: boolean;
  autoplay_interval: number;
  items_per_view: number;
  show_navigation: boolean;
  show_dots: boolean;
}

const DEFAULTS: Omit<SectionDisplaySettings, 'page_slug' | 'section_key'> = {
  layout_mode: 'grid',
  columns: 3,
  animation: 'fade-up',
  autoplay: false,
  autoplay_interval: 5,
  items_per_view: 3,
  show_navigation: true,
  show_dots: false,
};

export function useSectionDisplay(pageSlug: string, sectionKey: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['section-display', pageSlug, sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_display_settings')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('section_key', sectionKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...DEFAULTS,
    page_slug: pageSlug,
    section_key: sectionKey,
    ...(data || {}),
    isLoading,
  } as SectionDisplaySettings & { isLoading: boolean };
}

export function useAllSectionDisplaySettings() {
  return useQuery({
    queryKey: ['section-display-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_display_settings')
        .select('*')
        .order('page_slug')
        .order('section_key');

      if (error) throw error;
      return (data || []) as SectionDisplaySettings[];
    },
  });
}

export function useUpsertSectionDisplay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SectionDisplaySettings> & { page_slug: string; section_key: string }) => {
      const { data: existing } = await supabase
        .from('section_display_settings')
        .select('id')
        .eq('page_slug', settings.page_slug)
        .eq('section_key', settings.section_key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('section_display_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('section_display_settings')
          .insert(settings);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-display'] });
      queryClient.invalidateQueries({ queryKey: ['section-display-all'] });
    },
  });
}
