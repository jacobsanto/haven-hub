import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Experience } from '@/types/experiences';

export function useExperiences() {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Experience[];
    },
  });
}

export function useActiveExperiences() {
  return useQuery({
    queryKey: ['experiences', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Experience[];
    },
  });
}

export function useExperiencesByCategory(category?: string) {
  return useQuery({
    queryKey: ['experiences', 'active', category],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('name');

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Experience[];
    },
    enabled: true,
  });
}

export function useExperience(slug: string) {
  return useQuery({
    queryKey: ['experience', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Experience | null;
    },
    enabled: !!slug,
  });
}

export function useExperienceById(id: string) {
  return useQuery({
    queryKey: ['experience', 'id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Experience | null;
    },
    enabled: !!id,
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (experience: Omit<Experience, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('experiences')
        .insert(experience)
        .select()
        .single();

      if (error) throw error;
      return data as Experience;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Experience> & { id: string }) => {
      const { data, error } = await supabase
        .from('experiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Experience;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['experience', data.slug] });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}
