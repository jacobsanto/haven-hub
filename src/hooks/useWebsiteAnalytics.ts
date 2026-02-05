import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface WebsiteAnalyticsSummary {
  visitors: number;
  pageviews: number;
  pageviewsPerVisit: string;
  bounceRate: string;
  avgSessionDuration: number;
}

export interface DailyTraffic {
  date: string;
  visitors: number;
  pageviews: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  percentage: number;
}

export interface DeviceBreakdown {
  device: string;
  visitors: number;
  percentage: number;
}

export interface CountryVisitors {
  country: string;
  code: string;
  visitors: number;
}

export interface WebsiteAnalyticsData {
  summary: WebsiteAnalyticsSummary;
  daily: DailyTraffic[];
  sources: TrafficSource[];
  pages: TopPage[];
  devices: DeviceBreakdown[];
  countries: CountryVisitors[];
}

export function useWebsiteAnalytics(dateRange: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['website-analytics', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async (): Promise<WebsiteAnalyticsData> => {
      const { data, error } = await supabase.functions.invoke('website-analytics', {
        body: {
          startDate: format(dateRange.start, 'yyyy-MM-dd'),
          endDate: format(dateRange.end, 'yyyy-MM-dd'),
          granularity: 'daily',
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch website analytics');
      }

      return data as WebsiteAnalyticsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Helper to format session duration
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
