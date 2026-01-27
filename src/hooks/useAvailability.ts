import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Availability } from '@/types/database';

// Fetch availability for a property
export function usePropertyAvailability(propertyId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['availability', propertyId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('availability')
        .select('*')
        .eq('property_id', propertyId)
        .order('date', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!propertyId,
  });
}

// Check if dates are available for booking
export function useCheckAvailability(propertyId: string, checkIn: string, checkOut: string) {
  return useQuery({
    queryKey: ['check-availability', propertyId, checkIn, checkOut],
    queryFn: async () => {
      // Get blocked dates in the range
      const { data: blockedDates, error } = await supabase
        .from('availability')
        .select('date')
        .eq('property_id', propertyId)
        .eq('available', false)
        .gte('date', checkIn)
        .lt('date', checkOut);

      if (error) throw error;

      // Get existing confirmed bookings that overlap
      const { data: existingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .or(`check_in.lt.${checkOut},check_out.gt.${checkIn}`);

      if (bookingError) throw bookingError;

      const isAvailable = (blockedDates?.length === 0) && (existingBookings?.length === 0);

      return {
        isAvailable,
        blockedDates: blockedDates?.map((d) => d.date) || [],
        existingBookings: existingBookings || [],
      };
    },
    enabled: !!propertyId && !!checkIn && !!checkOut,
  });
}

// Admin: Toggle availability for a date
export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      date,
      available,
    }: {
      propertyId: string;
      date: string;
      available: boolean;
    }) => {
      // Upsert availability
      const { data, error } = await supabase
        .from('availability')
        .upsert(
          {
            property_id: propertyId,
            date,
            available,
          },
          {
            onConflict: 'property_id,date',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as Availability;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.property_id] });
    },
  });
}

// Admin: Bulk update availability
export function useBulkUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      dates,
      available,
    }: {
      propertyId: string;
      dates: string[];
      available: boolean;
    }) => {
      const updates = dates.map((date) => ({
        property_id: propertyId,
        date,
        available,
      }));

      const { error } = await supabase
        .from('availability')
        .upsert(updates, {
          onConflict: 'property_id,date',
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability', variables.propertyId] });
    },
  });
}
