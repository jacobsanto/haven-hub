import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Availability } from '@/types/database';

// Fetch PMS sync health data for admin dashboard
export function useAvailabilitySyncHealth() {
  return useQuery({
    queryKey: ['admin', 'availability-sync-health'],
    queryFn: async () => {
      // Get all properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name, status');
      
      if (propError) throw propError;

      // Get PMS property mappings with sync status
      const { data: mappings, error: mapError } = await supabase
        .from('pms_property_map')
        .select('property_id, sync_enabled, last_availability_sync_at, external_property_name');
      
      if (mapError) throw mapError;

      // Get latest sync run
      const { data: syncRuns, error: syncError } = await supabase
        .from('pms_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1);
      
      if (syncError) throw syncError;

      const totalProperties = properties?.length || 0;
      const propertiesWithSync = mappings?.filter(m => m.sync_enabled).length || 0;
      const lastSync = syncRuns?.[0];
      const propertiesWithErrors = lastSync?.status === 'failed' ? 1 : 0;

      return {
        totalProperties,
        propertiesWithSync,
        propertiesWithErrors,
        lastSyncTime: lastSync?.completed_at || lastSync?.started_at || null,
        lastSyncStatus: lastSync?.status || 'idle',
        mappings: mappings || [],
        properties: properties || [],
      };
    },
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
      return { propertyId, count: dates.length };
    },
    onSuccess: (data) => {
      // Invalidate all availability queries for this property
      queryClient.invalidateQueries({ queryKey: ['availability', data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability-sync-health'] });
    },
  });
}
