import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExperienceEnquiry } from '@/types/experiences';

export function useExperienceEnquiries() {
  return useQuery({
    queryKey: ['experience-enquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experience_enquiries')
        .select(`
          *,
          experience:experiences(id, name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ExperienceEnquiry & { experience: { id: string; name: string; slug: string } | null })[];
    },
  });
}

export function useCreateExperienceEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enquiry: {
      experience_id: string;
      name: string;
      email: string;
      phone?: string;
      preferred_date?: string;
      group_size?: number;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('experience_enquiries')
        .insert(enquiry)
        .select()
        .single();

      if (error) throw error;
      return data as ExperienceEnquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-enquiries'] });
    },
  });
}

export function useUpdateExperienceEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'new' | 'contacted' | 'confirmed' | 'cancelled' }) => {
      const { data, error } = await supabase
        .from('experience_enquiries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ExperienceEnquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-enquiries'] });
    },
  });
}

export function useDeleteExperienceEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experience_enquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-enquiries'] });
    },
  });
}
