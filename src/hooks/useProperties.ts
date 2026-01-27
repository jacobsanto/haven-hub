import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertySearchParams, PropertyStatus } from '@/types/database';

// Fetch all active properties
export function useProperties(params?: PropertySearchParams) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (params?.location) {
        query = query.or(`city.ilike.%${params.location}%,country.ilike.%${params.location}%,region.ilike.%${params.location}%`);
      }

      if (params?.guests) {
        query = query.gte('max_guests', params.guests);
      }

      if (params?.minPrice !== undefined) {
        query = query.gte('base_price', params.minPrice);
      }

      if (params?.maxPrice !== undefined) {
        query = query.lte('base_price', params.maxPrice);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by amenities if specified
      let filteredData = data as Property[];
      if (params?.amenities && params.amenities.length > 0) {
        filteredData = filteredData.filter((property) =>
          params.amenities!.every((amenity) => property.amenities.includes(amenity))
        );
      }

      return filteredData;
    },
  });
}

// Fetch a single property by slug
export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data as Property;
    },
    enabled: !!slug,
  });
}

// Fetch featured properties (limit 6)
export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Property[];
    },
  });
}

// Admin: Fetch all properties (including draft/archived)
export function useAdminProperties() {
  return useQuery({
    queryKey: ['admin', 'properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });
}

// Admin: Create a new property
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single();

      if (error) throw error;
      return data as Property;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
  });
}

// Admin: Update a property
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Property;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', data.slug] });
    },
  });
}

// Admin: Delete a property
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
  });
}

// Get unique locations from properties
export function usePropertyLocations() {
  return useQuery({
    queryKey: ['property-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('city, country')
        .eq('status', 'active');

      if (error) throw error;

      // Get unique locations
      const locations = new Set<string>();
      data.forEach((p) => {
        locations.add(p.city);
        locations.add(p.country);
      });

      return Array.from(locations).sort();
    },
  });
}
