import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertySearchParams, PropertyStatus, RoomConfig, NearbyAttraction } from '@/types/database';

// Transform raw database row to Property type
function transformProperty(row: any): Property {
  return {
    ...row,
    display_name: row.display_name || null,
    gallery: row.gallery || [],
    amenities: row.amenities || [],
    highlights: row.highlights || [],
    rooms: (row.rooms || []) as RoomConfig[],
    nearby_attractions: (row.nearby_attractions || []) as NearbyAttraction[],
    house_rules: row.house_rules || [],
  };
}

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

      if (params?.bedrooms !== undefined) {
        query = query.gte('bedrooms', params.bedrooms);
      }

      if (params?.bathrooms !== undefined) {
        query = query.gte('bathrooms', params.bathrooms);
      }

      if (params?.propertyType) {
        query = query.eq('property_type', params.propertyType);
      }

      if (params?.instantBooking) {
        query = query.eq('instant_booking', true);
      }

      if (params?.destinationId) {
        query = query.eq('destination_id', params.destinationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform and filter by amenities if specified
      let filteredData = (data || []).map(transformProperty);
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
      return transformProperty(data);
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
      return (data || []).map(transformProperty);
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
      return (data || []).map(transformProperty);
    },
  });
}

// Prepare property data for Supabase insert/update
function preparePropertyForDb(property: Partial<Property>) {
  return {
    ...property,
    rooms: property.rooms as unknown as any,
    nearby_attractions: property.nearby_attractions as unknown as any,
  };
}

// Admin: Create a new property
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
      const preparedData = preparePropertyForDb(property);
      const { data, error } = await supabase
        .from('properties')
        .insert(preparedData as any)
        .select()
        .single();

      if (error) throw error;
      return transformProperty(data);
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
      const preparedData = preparePropertyForDb(updates);
      const { data, error } = await supabase
        .from('properties')
        .update(preparedData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformProperty(data);
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
