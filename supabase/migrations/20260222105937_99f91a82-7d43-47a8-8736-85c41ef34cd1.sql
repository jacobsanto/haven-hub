
-- Create guesty_widget_settings table for global config
CREATE TABLE public.guesty_widget_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url text NOT NULL,
  widget_id text NOT NULL,
  accent_color text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guesty_widget_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only write
CREATE POLICY "Admin can manage guesty settings"
ON public.guesty_widget_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public read (needed for widget to load on property pages)
CREATE POLICY "Public can read guesty settings"
ON public.guesty_widget_settings
FOR SELECT
USING (true);

-- Updated_at trigger
CREATE TRIGGER update_guesty_widget_settings_updated_at
BEFORE UPDATE ON public.guesty_widget_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add optional per-property Guesty widget ID
ALTER TABLE public.properties
ADD COLUMN guesty_widget_id text;
