import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PMSConnection {
  id: string;
  pms_name: string;
  is_active: boolean;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  last_sync_at: string | null;
  sync_status: string | null;
}

interface PMSSyncRun {
  id: string;
  pms_connection_id: string;
  sync_type: string;
  status: string;
  trigger_type: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number | null;
  records_failed: number | null;
  error_summary: string | null;
}

interface PMSSyncStatus {
  connection: PMSConnection | null;
  lastRun: PMSSyncRun | null;
  recentRuns: PMSSyncRun[];
  isHealthy: boolean;
  errorCount: number;
}

/**
 * Hook to monitor PMS sync status for admin dashboard.
 */
export function usePMSSyncStatus() {
  return useQuery({
    queryKey: ['admin', 'pms-sync-status'],
    queryFn: async (): Promise<PMSSyncStatus> => {
      // Get active PMS connection
      const { data: connection, error: connError } = await supabase
        .from('pms_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (connError) throw connError;

      if (!connection) {
        return {
          connection: null,
          lastRun: null,
          recentRuns: [],
          isHealthy: false,
          errorCount: 0,
        };
      }

      // Get recent sync runs (last 10)
      const { data: recentRuns, error: runsError } = await supabase
        .from('pms_sync_runs')
        .select('*')
        .eq('pms_connection_id', connection.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (runsError) throw runsError;

      const lastRun = recentRuns?.[0] || null;
      
      // Count errors in last 10 runs
      const errorCount = recentRuns?.filter(
        (run) => run.status === 'failed' || (run.records_failed && run.records_failed > 0)
      ).length || 0;

      // Determine health: healthy if last run was successful and completed
      const isHealthy = lastRun
        ? lastRun.status === 'success' && lastRun.records_failed === 0
        : false;

      return {
        connection: connection as PMSConnection,
        lastRun: lastRun as PMSSyncRun | null,
        recentRuns: (recentRuns || []) as PMSSyncRun[],
        isHealthy,
        errorCount,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to trigger a manual PMS sync.
 */
export function useTriggerPMSSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('pms-sync-cron', {
        body: {
          action: 'sync-all-availability',
          triggerType: 'manual',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate sync status and availability queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'pms-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
