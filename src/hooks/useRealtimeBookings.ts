import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeBookings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'booking-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkout_holds',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'analytics', 'checkout-holds'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['availability'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pms_sync_runs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Hook for real-time updates on specific booking
export function useRealtimeBooking(bookingId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);
}
