
ALTER TABLE public.addons_catalog
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'booking',
  ADD COLUMN IF NOT EXISTS internal_cost numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmation_type text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS availability_mode text NOT NULL DEFAULT 'unlimited',
  ADD COLUMN IF NOT EXISTS daily_capacity integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS season_start date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS season_end date DEFAULT NULL;

COMMENT ON COLUMN public.addons_catalog.visibility IS 'booking, post_booking, or both';
COMMENT ON COLUMN public.addons_catalog.confirmation_type IS 'auto or manual';
COMMENT ON COLUMN public.addons_catalog.availability_mode IS 'unlimited or limited';
