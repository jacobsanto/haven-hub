-- Brand settings table for customizable theming
CREATE TABLE public.brand_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name text NOT NULL DEFAULT 'Arivia Villas',
    brand_tagline text DEFAULT 'Luxury Living, Redefined',
    logo_url text,
    contact_email text DEFAULT 'hello@ariviavillas.com',
    contact_phone text DEFAULT '+1 (234) 567-890',
    contact_address text DEFAULT '123 Luxury Lane, Paradise City',
    primary_color text DEFAULT '16 50% 48%',
    secondary_color text DEFAULT '142 25% 55%',
    accent_color text DEFAULT '43 55% 55%',
    background_color text DEFAULT '35 30% 96%',
    foreground_color text DEFAULT '25 30% 15%',
    heading_font text DEFAULT 'Cormorant Garamond',
    body_font text DEFAULT 'Inter',
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read brand settings (needed for theming)
CREATE POLICY "Anyone can view brand settings"
ON public.brand_settings
FOR SELECT
USING (true);

-- Only admins can update brand settings
CREATE POLICY "Admins can update brand settings"
ON public.brand_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert brand settings
CREATE POLICY "Admins can insert brand settings"
ON public.brand_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default brand settings
INSERT INTO public.brand_settings (id) VALUES (gen_random_uuid());