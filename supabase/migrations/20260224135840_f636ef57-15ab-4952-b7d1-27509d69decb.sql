
-- Table to track Guesty OAuth token requests for quota monitoring
CREATE TABLE public.guesty_token_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true,
  response_status integer,
  error_message text,
  token_expires_at timestamptz,
  retry_after_seconds integer
);

-- Index for fast lookups of recent requests
CREATE INDEX idx_guesty_token_usage_requested_at ON public.guesty_token_usage(requested_at DESC);

-- RLS: only admins can read, edge functions write via service role
ALTER TABLE public.guesty_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view token usage"
  ON public.guesty_token_usage
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup: keep only last 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_guesty_token_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.guesty_token_usage WHERE requested_at < now() - interval '30 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_guesty_token_usage
  AFTER INSERT ON public.guesty_token_usage
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_guesty_token_usage();
