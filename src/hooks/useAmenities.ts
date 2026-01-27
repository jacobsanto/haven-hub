import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Amenity {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AmenityInsert {
  slug: string;
  name: string;
  description?: string | null;
  icon: string;
  category: string;
  is_active?: boolean;
}

export interface AmenityUpdate extends Partial<AmenityInsert> {
  id: string;
}

// Fetch all active amenities (public)
export function useAmenities() {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: async (): Promise<Amenity[]> => {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Amenity[];
    },
  });
}

// Fetch all amenities including inactive (admin)
export function useAdminAmenities() {
  return useQuery({
    queryKey: ['amenities', 'admin'],
    queryFn: async (): Promise<Amenity[]> => {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Amenity[];
    },
  });
}

// Get amenity by slug
export function useAmenityBySlug(slug: string) {
  const { data: amenities } = useAmenities();
  return amenities?.find((a) => a.slug === slug);
}

// Create a map of slugs to amenity data for quick lookups
export function useAmenityMap() {
  const { data: amenities } = useAmenities();
  
  return amenities?.reduce((acc, amenity) => {
    acc[amenity.slug] = amenity;
    return acc;
  }, {} as Record<string, Amenity>) || {};
}

// Get amenities grouped by category
export function useAmenitiesByCategory() {
  const { data: amenities } = useAmenities();
  
  if (!amenities) return {};
  
  return amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);
}

// Create amenity
export function useCreateAmenity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amenity: AmenityInsert): Promise<Amenity> => {
      const { data, error } = await supabase
        .from('amenities')
        .insert(amenity)
        .select()
        .single();

      if (error) throw error;
      return data as Amenity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// Update amenity
export function useUpdateAmenity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AmenityUpdate): Promise<Amenity> => {
      const { data, error } = await supabase
        .from('amenities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Amenity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// Delete amenity (soft delete by setting is_active to false)
export function useDeleteAmenity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('amenities')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// Toggle amenity active status
export function useToggleAmenityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }): Promise<void> => {
      const { error } = await supabase
        .from('amenities')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// Get available categories
export function useAmenityCategories() {
  const { data: amenities } = useAdminAmenities();
  
  if (!amenities) return [];
  
  const categories = [...new Set(amenities.map((a) => a.category))];
  return categories.sort();
}
