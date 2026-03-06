ALTER TABLE public.brand_settings 
ADD COLUMN IF NOT EXISTS heading_weight integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS body_weight integer DEFAULT 400,
ADD COLUMN IF NOT EXISTS heading_letter_spacing text DEFAULT 'normal';