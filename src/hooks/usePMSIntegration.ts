import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { pmsAdapter } from '@/integrations/pms';
import { PMSSyncResult } from '@/integrations/pms/types';

// Fetch PMS connection status
export function usePMSConnection() {
  return useQuery({
    queryKey: ['pms-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

// Test PMS connection
export function useTestPMSConnection() {
  return useMutation({
    mutationFn: async () => {
      const isConnected = await pmsAdapter.testConnection();
      return { success: isConnected };
    },
  });
}

// Fetch recent sync runs
export function usePMSSyncRuns(connectionId?: string, limit = 10) {
  return useQuery({
    queryKey: ['pms-sync-runs', connectionId, limit],
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
      return data;
    },
    enabled: !!connectionId,
  });
}

// Trigger a full sync
export function useTriggerPMSSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string): Promise<PMSSyncResult> => {
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
            error_summary: result.errors?.join('; '),
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
      queryClient.invalidateQueries({ queryKey: ['pms-sync-runs'] });
      queryClient.invalidateQueries({ queryKey: ['pms-connection'] });
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
    },
  });
}

// Fetch PMS property mappings
export function usePMSPropertyMappings(connectionId?: string) {
  return useQuery({
    queryKey: ['pms-property-mappings', connectionId],
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
      return data;
    },
    enabled: !!connectionId,
  });
}

// Fetch recent PMS events (for debugging)
export function usePMSRawEvents(limit = 50) {
  return useQuery({
    queryKey: ['pms-raw-events', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pms_raw_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

// Store a PMS webhook event
export function useStorePMSWebhookEvent() {
  return useMutation({
    mutationFn: async ({
      connectionId,
      eventType,
      payload,
    }: {
      connectionId: string;
      eventType: string;
      payload: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('pms_raw_events')
        .insert({
          pms_connection_id: connectionId,
          event_type: eventType,
          source: 'webhook' as const,
          payload: JSON.parse(JSON.stringify(payload)),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
