import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback rates if API fails
const FALLBACK_RATES = {
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
  AUD: 1.65,
  CAD: 1.47,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for cached rates first (less than 1 hour old)
    const { data: cachedData } = await supabase
      .from('exchange_rates_cache')
      .select('rates, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedData) {
      const fetchedAt = new Date(cachedData.fetched_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (fetchedAt > hourAgo) {
        console.log('Returning cached exchange rates');
        return new Response(
          JSON.stringify({ rates: cachedData.rates, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch fresh rates from Frankfurter API (free, no key required)
    console.log('Fetching fresh exchange rates from Frankfurter API');
    const apiResponse = await fetch(
      'https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,CHF,AUD,CAD'
    );

    if (!apiResponse.ok) {
      throw new Error(`Frankfurter API error: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const rates = apiData.rates;

    // Cache the new rates
    const { error: insertError } = await supabase
      .from('exchange_rates_cache')
      .insert({
        base_currency: 'EUR',
        rates,
        fetched_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to cache exchange rates:', insertError);
    } else {
      console.log('Exchange rates cached successfully');
    }

    return new Response(
      JSON.stringify({ rates, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Exchange rates error:', error);
    
    // Return fallback rates on error
    return new Response(
      JSON.stringify({ 
        rates: FALLBACK_RATES, 
        cached: false, 
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
