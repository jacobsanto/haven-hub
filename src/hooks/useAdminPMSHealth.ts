import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pmsAdapter } from '@/integrations/pms';

export interface PMSConnection {
  id: string;
  pms_name: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  sync_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PMSSyncRun {
  id: string;
  pms_connection_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number | null;
  records_failed: number | null;
  error_summary: string | null;
}

export interface PMSPropertyMapping {
  id: string;
  pms_connection_id: string;
  property_id: string;
  external_property_id: string;
  external_property_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  property?: { id: string; name: string; slug: string };
}

export interface PMSRawEvent {
  id: string;
  pms_connection_id: string | null;
  event_type: string;
  source: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function usePMSConnectionStatus() {
  return useQuery({
    queryKey: ['admin', 'pms', 'connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as PMSConnection | null;
    },
  });
}

export function useTestPMSConnection() {
  return useMutation({
    mutationFn: async () => {
      const isConnected = await pmsAdapter.testConnection();
      return { success: isConnected };
    },
  });
}

export function usePMSSyncHistory(connectionId?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['admin', 'pms', 'sync-history', connectionId, limit],
    queryFn: async () => {
      let query = supabase
        .from('pms_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (connectionId) {
        query = query.eq('pms_connection_id', connectionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PMSSyncRun[];
    },
    enabled: !!connectionId,
  });
}

export function usePMSPropertyMappings(connectionId?: string) {
  return useQuery({
    queryKey: ['admin', 'pms', 'property-mappings', connectionId],
    queryFn: async () => {
      let query = supabase
        .from('pms_property_map')
        .select(`
          *,
          property:properties(id, name, slug)
        `);

      if (connectionId) {
        query = query.eq('pms_connection_id', connectionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PMSPropertyMapping[];
    },
    enabled: !!connectionId,
  });
}

export function usePMSRawEvents(limit: number = 50) {
  return useQuery({
    queryKey: ['admin', 'pms', 'raw-events', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_raw_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PMSRawEvent[];
    },
  });
}

export function useTriggerManualSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      // Create sync run record
      const { data: syncRun, error: createError } = await supabase
        .from('pms_sync_runs')
        .insert({
          pms_connection_id: connectionId,
          sync_type: 'full',
          status: 'running',
        })
        .select()
        .single();

      if (createError) throw createError;

      try {
        // Trigger sync via adapter
        const result = await pmsAdapter.syncAll();

        // Update sync run with results
        await supabase
          .from('pms_sync_runs')
          .update({
            status: result.success ? 'success' : 'failed',
            completed_at: new Date().toISOString(),
            records_processed: result.recordsProcessed,
            records_failed: result.recordsFailed,
            error_summary: result.errors?.join('; ') || null,
          })
          .eq('id', syncRun.id);

        // Update connection last sync
        await supabase
          .from('pms_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            sync_status: result.success ? 'success' : 'error',
          })
          .eq('id', connectionId);

        return result;
      } catch (error) {
        // Update sync run as failed
        await supabase
          .from('pms_sync_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_summary: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', syncRun.id);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useTogglePropertySync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mappingId, enabled }: { mappingId: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('pms_property_map')
        .update({ sync_enabled: enabled })
        .eq('id', mappingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms', 'property-mappings'] });
    },
  });
}

export function useSyncPropertyNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, externalPropertyId }: { connectionId: string; externalPropertyId: string }) => {
      // Create sync run record
      const { data: syncRun, error: createError } = await supabase
        .from('pms_sync_runs')
        .insert({
          pms_connection_id: connectionId,
          sync_type: 'property',
          status: 'running',
        })
        .select()
        .single();

      if (createError) throw createError;

      try {
        // Sync both availability and rates
        const [availResult, ratesResult] = await Promise.all([
          pmsAdapter.syncAvailability(externalPropertyId),
          pmsAdapter.syncRates(externalPropertyId),
        ]);

        const success = availResult.success && ratesResult.success;
        const recordsProcessed = (availResult.recordsProcessed || 0) + (ratesResult.recordsProcessed || 0);
        const recordsFailed = (availResult.recordsFailed || 0) + (ratesResult.recordsFailed || 0);

        // Update sync run
        await supabase
          .from('pms_sync_runs')
          .update({
            status: success ? 'success' : 'failed',
            completed_at: new Date().toISOString(),
            records_processed: recordsProcessed,
            records_failed: recordsFailed,
          })
          .eq('id', syncRun.id);

        return { success, recordsProcessed, recordsFailed };
      } catch (error) {
        await supabase
          .from('pms_sync_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_summary: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', syncRun.id);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function usePushBookingToPMS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Fetch booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, name, slug)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Get property mapping
      const { data: mapping } = await supabase
        .from('pms_property_map')
        .select('external_property_id')
        .eq('property_id', booking.property_id)
        .maybeSingle();

      if (!mapping) {
        throw new Error('Property not mapped to PMS');
      }

      // Push to PMS
      const result = await pmsAdapter.createBooking({
        propertyId: booking.property_id,
        externalPropertyId: mapping.external_property_id,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        guests: booking.guests,
        guestInfo: {
          firstName: booking.guest_name.split(' ')[0],
          lastName: booking.guest_name.split(' ').slice(1).join(' ') || '',
          email: booking.guest_email,
          phone: booking.guest_phone || undefined,
        },
        totalAmount: Number(booking.total_price),
        currency: 'EUR',
      });

      // Log to audit
      await supabase.from('audit_log').insert([{
        entity_type: 'booking',
        entity_id: bookingId,
        action: 'pms_push',
        new_values: JSON.parse(JSON.stringify(result)),
      }]);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });
}
