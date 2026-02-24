ALTER TABLE public.brand_settings
  ADD COLUMN IF NOT EXISTS muted_color text,
  ADD COLUMN IF NOT EXISTS card_color text,
  ADD COLUMN IF NOT EXISTS border_color text,
  ADD COLUMN IF NOT EXISTS destructive_color text,
  ADD COLUMN IF NOT EXISTS ring_color text;