import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GeocodeResult {
  display_name: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  postal_code: string;
  address: string;
}

export function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setError('Enter at least 2 characters');
      return [];
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
        body: { query: query.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const r = (data?.results || []) as GeocodeResult[];
      setResults(r);
      return r;
    } catch (err: any) {
      const msg = err.message || 'Geocoding failed';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { lookup, results, loading, error };
}
