
-- Create page_content table for editable CMS content
CREATE TABLE public.page_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug text NOT NULL,
  section_key text NOT NULL,
  content_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key, content_key)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Public can read all page content
CREATE POLICY "Anyone can read page content"
  ON public.page_content FOR SELECT
  USING (true);

-- Admin can manage page content
CREATE POLICY "Admin can manage page content"
  ON public.page_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add social link columns to brand_settings
ALTER TABLE public.brand_settings
  ADD COLUMN IF NOT EXISTS social_instagram text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_facebook text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_twitter text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_youtube text DEFAULT NULL;
