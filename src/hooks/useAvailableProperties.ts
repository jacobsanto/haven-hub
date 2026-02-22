import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertySearchParams, RoomConfig, NearbyAttraction } from '@/types/database';

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
    address: row.address || null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    postal_code: row.postal_code || null,
  };
}

/**
 * Fetches properties filtered by real-time availability for the given date range.
 * Only returns properties where ALL dates between checkIn and checkOut are available
 * (no blocked dates in availability table, no overlapping bookings or active holds).
 */
export function useAvailableProperties(params: PropertySearchParams) {
  const { checkIn, checkOut, ...rest } = params;

  return useQuery({
    queryKey: ['available-properties', params],
    queryFn: async () => {
      // 1. Fetch properties matching base filters
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('base_price', { ascending: true });

      if (rest.location) {
        query = query.or(
          `city.ilike.%${rest.location}%,country.ilike.%${rest.location}%,region.ilike.%${rest.location}%`
        );
      }
      if (rest.guests) query = query.gte('max_guests', rest.guests);
      if (rest.minPrice !== undefined) query = query.gte('base_price', rest.minPrice);
      if (rest.maxPrice !== undefined) query = query.lte('base_price', rest.maxPrice);
      if (rest.bedrooms !== undefined) query = query.gte('bedrooms', rest.bedrooms);
      if (rest.bathrooms !== undefined) query = query.gte('bathrooms', rest.bathrooms);
      if (rest.propertyType) query = query.eq('property_type', rest.propertyType);
      if (rest.instantBooking) query = query.eq('instant_booking', true);
      if (rest.destinationId) query = query.eq('destination_id', rest.destinationId);

      const { data: properties, error: propError } = await query;
      if (propError) throw propError;
      if (!properties || properties.length === 0) return [];

      // Filter amenities client-side
      let filtered = (properties || []).map(transformProperty);
      if (rest.amenities && rest.amenities.length > 0) {
        filtered = filtered.filter((p) =>
          rest.amenities!.every((a) => (p.amenities || []).includes(a))
        );
      }

      // If no dates, return all matching properties (no availability check)
      if (!checkIn || !checkOut) return filtered;

      const propertyIds = filtered.map((p) => p.id);

      // 2. Fetch blocked dates in range for these properties
      const { data: blockedDates, error: blockError } = await supabase
        .from('availability')
        .select('property_id, date')
        .in('property_id', propertyIds)
        .eq('available', false)
        .gte('date', checkIn)
        .lt('date', checkOut);

      if (blockError) throw blockError;

      // 3. Fetch overlapping confirmed/pending bookings
      const { data: overlappingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('property_id')
        .in('property_id', propertyIds)
        .in('status', ['pending', 'confirmed'])
        .lt('check_in', checkOut)
        .gt('check_out', checkIn);

      if (bookingError) throw bookingError;

      // 4. Fetch active checkout holds (not expired, not released)
      const { data: activeHolds, error: holdError } = await supabase
        .from('checkout_holds')
        .select('property_id')
        .in('property_id', propertyIds)
        .eq('released', false)
        .gt('expires_at', new Date().toISOString())
        .lt('check_in', checkOut)
        .gt('check_out', checkIn);

      if (holdError) throw holdError;

      // Build sets of unavailable property IDs
      const blockedPropertyIds = new Set(blockedDates?.map((d) => d.property_id) || []);
      const bookedPropertyIds = new Set(overlappingBookings?.map((b) => b.property_id) || []);
      const heldPropertyIds = new Set(activeHolds?.map((h) => h.property_id) || []);

      // 5. Filter to only available properties
      return filtered.filter(
        (p) =>
          !blockedPropertyIds.has(p.id) &&
          !bookedPropertyIds.has(p.id) &&
          !heldPropertyIds.has(p.id)
      );
    },
    enabled: true,
  });
}
