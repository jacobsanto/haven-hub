import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
  is_day: boolean;
  label: string;
  icon: 'sunny' | 'partly-cloudy' | 'cloudy' | 'foggy' | 'rainy' | 'snowy' | 'stormy';
}

export function useDestinationWeather(latitude?: number | null, longitude?: number | null) {
  return useQuery({
    queryKey: ['destination-weather', latitude, longitude],
    queryFn: async (): Promise<WeatherData> => {
      const { data, error } = await supabase.functions.invoke('destination-weather', {
        body: { latitude, longitude },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as WeatherData;
    },
    enabled: typeof latitude === 'number' && typeof longitude === 'number',
    staleTime: 15 * 60 * 1000, // 15 min
    retry: 1,
  });
}
