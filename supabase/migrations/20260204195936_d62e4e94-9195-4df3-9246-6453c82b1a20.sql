-- Create exchange rates cache table
CREATE TABLE public.exchange_rates_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency text NOT NULL DEFAULT 'EUR',
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.exchange_rates_cache IS 'Caches exchange rates from external API to reduce API calls';

-- Enable RLS
ALTER TABLE public.exchange_rates_cache ENABLE ROW LEVEL SECURITY;

-- Public can read rates (no auth required for display)
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates_cache
  FOR SELECT
  USING (true);

-- Only edge functions (via service role) can insert/update
-- No insert/update policies for anon users