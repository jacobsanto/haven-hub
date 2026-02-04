import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExchangeRates } from '@/types/currency';

// Default fallback rates in case API fails
const FALLBACK_RATES: ExchangeRates = {
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
  AUD: 1.65,
  CAD: 1.47,
};

interface CachedRates {
  rates: ExchangeRates;
  fetched_at: string;
}

async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    // First, try to get cached rates from database (less than 1 hour old)
    const { data: cachedData, error: cacheError } = await supabase
      .from('exchange_rates_cache')
      .select('rates, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cachedData) {
      const fetchedAt = new Date(cachedData.fetched_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // If cache is fresh (less than 1 hour old), use it
      if (fetchedAt > hourAgo) {
        return cachedData.rates as unknown as ExchangeRates;
      }
    }

    // Cache is stale or missing - fetch fresh rates via edge function
    const { data, error } = await supabase.functions.invoke('exchange-rates');
    
    if (error) {
      console.warn('Failed to fetch exchange rates from edge function:', error);
      // Return stale cache if available, otherwise fallback
      if (cachedData?.rates) {
        return cachedData.rates as unknown as ExchangeRates;
      }
      return FALLBACK_RATES;
    }

    return data.rates as ExchangeRates;
  } catch (error) {
    console.warn('Error fetching exchange rates:', error);
    return FALLBACK_RATES;
  }
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchExchangeRates,
    staleTime: 30 * 60 * 1000, // Consider fresh for 30 minutes
    gcTime: 60 * 60 * 1000,    // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
