import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Destination } from '@/types/destinations';

export function useDestinations() {
  return useQuery({
    queryKey: ['destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Destination[];
    },
  });
}

export function useActiveDestinations() {
  return useQuery({
    queryKey: ['destinations', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Destination[];
    },
  });
}

export function useFeaturedDestinations() {
  return useQuery({
    queryKey: ['destinations', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('featured_sort_order', { ascending: true })
        .order('name');

      if (error) throw error;
      return data as Destination[];
    },
  });
}

export function useDestination(slug: string) {
  return useQuery({
    queryKey: ['destination', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Destination | null;
    },
    enabled: !!slug,
  });
}

export function useDestinationById(id: string) {
  return useQuery({
    queryKey: ['destination', 'id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Destination | null;
    },
    enabled: !!id,
  });
}

export function useCreateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('destinations')
        .insert(destination)
        .select()
        .single();

      if (error) throw error;
      return data as Destination;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    },
  });
}

export function useUpdateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Destination> & { id: string }) => {
      const { data, error } = await supabase
        .from('destinations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Destination;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      queryClient.invalidateQueries({ queryKey: ['destination', data.slug] });
    },
  });
}

export function useDeleteDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    },
  });
}
