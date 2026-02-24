import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// pmsAdapter import removed — all PMS calls now route dynamically per-connection
import { getEdgeFunctionForProvider } from '@/lib/pms-providers';

/**
 * Resolve the edge function name for a given PMS connection.
 */
async function resolveEdgeFunctionForConnection(connectionId: string): Promise<string> {
  const { data: connection } = await supabase
    .from('pms_connections')
    .select('config')
    .eq('id', connectionId)
    .maybeSingle();

  const config = connection?.config as { provider?: string } | null;
  return getEdgeFunctionForProvider(config?.provider || 'advancecm');
}

export interface PMSConnection {
  id: string;
  pms_name: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  sync_status: string | null;
  created_at: string;
  updated_at: string;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
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
  trigger_type: string;
}

export interface PMSPropertyMapping {
  id: string;
  pms_connection_id: string;
  property_id: string;
  external_property_id: string;
  external_property_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_availability_sync_at: string | null;
  ical_url: string | null;
  last_ical_sync_at: string | null;
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

/**
 * Fetch ALL active PMS connections (multi-PMS support).
 */
export function useAllPMSConnections() {
  return useQuery({
    queryKey: ['admin', 'pms', 'all-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_connections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PMSConnection[];
    },
  });
}

export function useTestPMSConnection() {
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      // Check for auth session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in as an admin to test the PMS connection');
      }

      // If a connectionId is provided, resolve its edge function; otherwise test default
      let edgeFunction = 'advancecm-sync';
      if (connectionId) {
        edgeFunction = await resolveEdgeFunctionForConnection(connectionId);
      }

      const response = await supabase.functions.invoke(edgeFunction, {
        body: { action: 'test' },
      });

      return { success: response.data?.success ?? false };
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
      // Trigger the pms-sync-cron edge function with manual trigger for this connection
      const response = await supabase.functions.invoke('pms-sync-cron', {
        body: {
          action: 'sync-all-availability',
          triggerType: 'manual',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Sync failed');
      }

      return {
        success: response.data?.success ?? false,
        recordsProcessed: response.data?.synced ?? 0,
        recordsFailed: response.data?.failed ?? 0,
        errors: response.data?.errors ?? [],
      };
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
      // Get property ID from mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('pms_property_map')
        .select('property_id')
        .eq('pms_connection_id', connectionId)
        .eq('external_property_id', externalPropertyId)
        .maybeSingle();

      if (mappingError || !mapping) {
        throw new Error('Property mapping not found');
      }

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
        // Resolve the correct edge function for this connection
        const edgeFunction = await resolveEdgeFunctionForConnection(connectionId);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Authentication required');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunction}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'sync-availability',
              propertyId: mapping.property_id,
            }),
          }
        );

        const result = await response.json();
        const success = response.ok && result.success;

        // Update sync run
        await supabase
          .from('pms_sync_runs')
          .update({
            status: success ? 'success' : 'failed',
            completed_at: new Date().toISOString(),
            records_processed: result.daysProcessed || 0,
            records_failed: success ? 0 : 1,
            error_summary: result.error || null,
          })
          .eq('id', syncRun.id);

        return { success, recordsProcessed: result.daysProcessed || 0, blockedDaysFound: result.blockedDaysFound || 0 };
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
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
    },
  });
}

// Sync availability for all mapped properties
export function useSyncAllPropertyAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      // Get all mappings for this connection
      const { data: mappings, error: mappingsError } = await supabase
        .from('pms_property_map')
        .select('property_id, external_property_id')
        .eq('pms_connection_id', connectionId)
        .eq('sync_enabled', true);

      if (mappingsError) throw mappingsError;
      if (!mappings || mappings.length === 0) {
        return { success: true, total: 0, synced: 0, failed: 0 };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      // Resolve the correct edge function for this connection
      const edgeFunction = await resolveEdgeFunctionForConnection(connectionId);

      let synced = 0;
      let failed = 0;

      for (const mapping of mappings) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunction}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'sync-availability',
                propertyId: mapping.property_id,
              }),
            }
          );

          const result = await response.json();
          if (response.ok && result.success) {
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      // Update connection last sync
      await supabase
        .from('pms_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: failed === 0 ? 'success' : (synced > 0 ? 'partial' : 'error'),
        })
        .eq('id', connectionId);

      return { success: failed === 0, total: mappings.length, synced, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
    },
  });
}

// Deactivate (soft-delete) a PMS connection
export function useDeactivatePMSConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      // Disable all property mappings for this connection
      const { error: mapError } = await supabase
        .from('pms_property_map')
        .update({ sync_enabled: false })
        .eq('pms_connection_id', connectionId);

      if (mapError) throw mapError;

      // Soft-delete the connection
      const { error } = await supabase
        .from('pms_connections')
        .update({ is_active: false })
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Update auto-sync settings
export function useUpdateAutoSyncSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      connectionId,
      autoSyncEnabled,
      syncIntervalMinutes,
    }: {
      connectionId: string;
      autoSyncEnabled?: boolean;
      syncIntervalMinutes?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      if (autoSyncEnabled !== undefined) updates.auto_sync_enabled = autoSyncEnabled;
      if (syncIntervalMinutes !== undefined) updates.sync_interval_minutes = syncIntervalMinutes;

      const { data, error } = await supabase
        .from('pms_connections')
        .update(updates)
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms', 'connection'] });
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

      // Get property mapping with connection info
      const { data: mapping } = await supabase
        .from('pms_property_map')
        .select('external_property_id, pms_connection_id')
        .eq('property_id', booking.property_id)
        .eq('sync_enabled', true)
        .maybeSingle();

      if (!mapping) {
        throw new Error('Property not mapped to PMS');
      }

      // Resolve the correct edge function for this property's PMS
      const edgeFunction = await resolveEdgeFunctionForConnection(mapping.pms_connection_id);

      const nameParts = booking.guest_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Push to PMS via the correct edge function
      const response = await supabase.functions.invoke(edgeFunction, {
        body: {
          action: 'create-booking',
          externalPropertyId: mapping.external_property_id,
          bookingReference: booking.booking_reference,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guests: booking.guests,
          adults: booking.adults || booking.guests,
          children: booking.children || 0,
          guestInfo: {
            firstName,
            lastName,
            email: booking.guest_email,
            phone: booking.guest_phone,
            country: booking.guest_country,
          },
          totalPrice: booking.total_price,
          currency: 'EUR',
          priceBreakdownNotes: 'Pushed from admin dashboard',
        },
      });

      if (response.data?.success) {
        await supabase
          .from('bookings')
          .update({
            pms_sync_status: 'synced',
            pms_synced_at: new Date().toISOString(),
            external_booking_id: response.data.externalBookingId,
          })
          .eq('id', bookingId);
      } else {
        await supabase
          .from('bookings')
          .update({
            pms_sync_status: 'failed',
            pms_last_error: response.data?.error || 'Unknown error',
          })
          .eq('id', bookingId);
        throw new Error(response.data?.error || 'PMS push failed');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });
}

// Test webhook endpoint - currently disabled (edge function not implemented)
export function useTestWebhookEndpoint() {
  return useMutation({
    mutationFn: async (_params: { event: string; data: Record<string, unknown> }) => {
      throw new Error('Webhook testing is not currently available. The test-pms-webhook edge function has not been implemented.');
    },
  });
}

/**
 * Generic hook to ensure a PMS connection exists for any provider.
 * Creates a new connection or activates an existing one.
 */
export function useEnsurePMSConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId, providerName }: { providerId: string; providerName: string }) => {
      // Check if a connection for this provider already exists
      const { data: existing, error: fetchError } = await supabase
        .from('pms_connections')
        .select('*')
        .eq('pms_name', providerName)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Activate if not already active
        if (!existing.is_active) {
          await supabase
            .from('pms_connections')
            .update({ is_active: true, config: { provider: providerId } })
            .eq('id', existing.id);
        }
        return existing as PMSConnection;
      }

      // Create new connection
      const { data: newConnection, error: createError } = await supabase
        .from('pms_connections')
        .insert({
          pms_name: providerName,
          is_active: true,
          config: { provider: providerId },
        })
        .select()
        .single();

      if (createError) throw createError;
      return newConnection as PMSConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms'] });
    },
  });
}
