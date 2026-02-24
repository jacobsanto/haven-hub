import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const GUESTY_MAX_TOKENS_PER_24H = 3;

export interface GuestyQuotaStatus {
  used: number;
  remaining: number;
  max: number;
  oldestRequestAt: string | null;
  nextResetAt: string | null;
  recentRequests: Array<{
    id: string;
    requested_at: string;
    success: boolean;
    response_status: number | null;
    error_message: string | null;
    retry_after_seconds: number | null;
  }>;
  status: 'ok' | 'warning' | 'exhausted' | 'unknown';
}

export function useGuestyQuota() {
  return useQuery({
    queryKey: ['guesty-token-quota'],
    queryFn: async (): Promise<GuestyQuotaStatus> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('guesty_token_usage')
        .select('id, requested_at, success, response_status, error_message, retry_after_seconds')
        .gte('requested_at', since)
        .order('requested_at', { ascending: true });

      if (error) {
        console.warn('Failed to fetch Guesty quota:', error);
        return {
          used: 0,
          remaining: GUESTY_MAX_TOKENS_PER_24H,
          max: GUESTY_MAX_TOKENS_PER_24H,
          oldestRequestAt: null,
          nextResetAt: null,
          recentRequests: [],
          status: 'unknown',
        };
      }

      const requests = data || [];
      const used = requests.length;
      const remaining = Math.max(0, GUESTY_MAX_TOKENS_PER_24H - used);
      const oldestRequestAt = requests.length > 0 ? requests[0].requested_at : null;
      const nextResetAt = oldestRequestAt
        ? new Date(new Date(oldestRequestAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      let status: GuestyQuotaStatus['status'] = 'ok';
      if (remaining === 0) status = 'exhausted';
      else if (remaining === 1) status = 'warning';

      return {
        used,
        remaining,
        max: GUESTY_MAX_TOKENS_PER_24H,
        oldestRequestAt,
        nextResetAt,
        recentRequests: requests,
        status,
      };
    },
    refetchInterval: 60_000, // refresh every minute
  });
}
