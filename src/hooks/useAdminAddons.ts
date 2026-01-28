import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AddonCatalog {
  id: string;
  property_id: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  price_type: string;
  max_quantity: number | null;
  requires_lead_time_hours: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AddonFormData = {
  property_id: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  price_type: string;
  max_quantity: number | null;
  requires_lead_time_hours: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export function useAdminAddons(propertyId?: string) {
  return useQuery({
    queryKey: ['admin', 'addons', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('addons_catalog')
        .select('*')
        .order('sort_order', { ascending: true });

      if (propertyId) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AddonCatalog[];
    },
  });
}

export function useCreateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addon: AddonFormData) => {
      const { data, error } = await supabase
        .from('addons_catalog')
        .insert(addon)
        .select()
        .single();

      if (error) throw error;
      return data as AddonCatalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useUpdateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...addon }: Partial<AddonCatalog> & { id: string }) => {
      const { data, error } = await supabase
        .from('addons_catalog')
        .update(addon)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AddonCatalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useDeleteAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('addons_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}

export function useReorderAddons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const promises = items.map(item =>
        supabase
          .from('addons_catalog')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
    },
  });
}
