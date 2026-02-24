import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type NavigationPlacement = 'header' | 'hero_quicknav' | 'footer_explore' | 'footer_company';

export interface NavigationItem {
  id: string;
  placement: string;
  label: string;
  path: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  show_on_mobile: boolean;
  priority: boolean;
  created_at: string;
  updated_at: string;
}

// Default fallbacks matching the original hardcoded values
const FALLBACK_ITEMS: Record<NavigationPlacement, Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'>[]> = {
  header: [
    { placement: 'header', label: 'Properties', path: '/properties', icon: null, sort_order: 0, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'header', label: 'Destinations', path: '/destinations', icon: null, sort_order: 1, is_visible: true, show_on_mobile: true, priority: false },
    { placement: 'header', label: 'Experiences', path: '/experiences', icon: null, sort_order: 2, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'header', label: 'Blog', path: '/blog', icon: null, sort_order: 3, is_visible: true, show_on_mobile: true, priority: false },
    { placement: 'header', label: 'About', path: '/about', icon: null, sort_order: 4, is_visible: true, show_on_mobile: true, priority: true },
  ],
  hero_quicknav: [
    { placement: 'hero_quicknav', label: 'Destinations', path: '/destinations', icon: 'MapPin', sort_order: 0, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'hero_quicknav', label: 'Properties', path: '/properties', icon: 'Home', sort_order: 1, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'hero_quicknav', label: 'Experiences', path: '/experiences', icon: 'Sparkles', sort_order: 2, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'hero_quicknav', label: 'Stories', path: '/blog', icon: 'BookOpen', sort_order: 3, is_visible: true, show_on_mobile: true, priority: true },
  ],
  footer_explore: [
    { placement: 'footer_explore', label: 'All Properties', path: '/properties', icon: null, sort_order: 0, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_explore', label: 'Destinations', path: '/destinations', icon: null, sort_order: 1, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_explore', label: 'Experiences', path: '/experiences', icon: null, sort_order: 2, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_explore', label: 'Blog', path: '/blog', icon: null, sort_order: 3, is_visible: true, show_on_mobile: true, priority: true },
  ],
  footer_company: [
    { placement: 'footer_company', label: 'About Us', path: '/about', icon: null, sort_order: 0, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_company', label: 'Contact', path: '/contact', icon: null, sort_order: 1, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_company', label: 'Privacy Policy', path: '/privacy', icon: null, sort_order: 2, is_visible: true, show_on_mobile: true, priority: true },
    { placement: 'footer_company', label: 'Terms of Service', path: '/terms', icon: null, sort_order: 3, is_visible: true, show_on_mobile: true, priority: true },
  ],
};

export function useNavigationItems(placement: NavigationPlacement) {
  return useQuery({
    queryKey: ['navigation-items', placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('placement', placement)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data as NavigationItem[]) || [];
    },
    select: (data) => data.length > 0 ? data : FALLBACK_ITEMS[placement] as NavigationItem[],
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminNavigationItems(placement?: NavigationPlacement) {
  return useQuery({
    queryKey: ['admin-navigation-items', placement],
    queryFn: async () => {
      let query = supabase
        .from('navigation_items')
        .select('*')
        .order('placement')
        .order('sort_order', { ascending: true });

      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as NavigationItem[]) || [];
    },
  });
}

export function useNavigationMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
    queryClient.invalidateQueries({ queryKey: ['admin-navigation-items'] });
  };

  const createItem = useMutation({
    mutationFn: async (item: Omit<NavigationItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('navigation_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NavigationItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('navigation_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createItem, updateItem, deleteItem };
}
