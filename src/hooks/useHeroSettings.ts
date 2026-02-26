import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroSettingRow {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

const DEFAULTS: Record<string, string> = {
  show_search_bar: 'true',
  show_featured_villa: 'true',
  featured_property_id: 'auto',
  show_quick_nav: 'true',
  hero_background_image: '',
};

export function useHeroSettings() {
  const query = useQuery({
    queryKey: ['hero-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = { ...DEFAULTS };
      (data as HeroSettingRow[])?.forEach((row) => {
        map[row.key] = row.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const settings = query.data || DEFAULTS;

  return {
    ...query,
    settings,
    showSearchBar: settings.show_search_bar === 'true',
    showFeaturedVilla: settings.show_featured_villa === 'true',
    featuredPropertyId: settings.featured_property_id,
    showQuickNav: settings.show_quick_nav === 'true',
    heroBackgroundImage: settings.hero_background_image || '',
  };
}

export function useHeroSettingsMutations() {
  const queryClient = useQueryClient();

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('hero_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
    },
  });

  return { updateSetting };
}
