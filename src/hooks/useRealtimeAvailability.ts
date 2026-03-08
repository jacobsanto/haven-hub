import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for real-time availability updates on a specific property.
 * Subscribes to changes in availability, bookings, and checkout_holds tables.
 * When any change occurs, it instantly invalidates relevant queries.
 */
export function useRealtimeAvailability(propertyId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`availability-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
          queryClient.invalidateQueries({ queryKey: ['check-availability'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkout_holds',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar', propertyId] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
          queryClient.invalidateQueries({ queryKey: ['checkout-holds'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);
}

/**
 * Hook for real-time availability updates across all properties.
 * Useful for admin dashboards and availability calendars.
 */
export function useRealtimeAvailabilityGlobal() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('availability-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability'] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability'] });
          queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
