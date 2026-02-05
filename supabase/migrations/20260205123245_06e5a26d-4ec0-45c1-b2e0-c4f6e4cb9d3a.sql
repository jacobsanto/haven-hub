-- Create page_views table for analytics tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  page_title text,
  referrer text,
  device_type text,
  browser text,
  country_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_path ON public.page_views(path);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts (no auth required for tracking)
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics data
CREATE POLICY "Admins can view page views"
ON public.page_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete page views (for cleanup)
CREATE POLICY "Admins can delete page views"
ON public.page_views
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));