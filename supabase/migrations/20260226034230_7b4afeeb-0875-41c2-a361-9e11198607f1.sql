
-- Create social_campaigns table
CREATE TABLE public.social_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  core_text text NOT NULL DEFAULT '',
  core_hashtags text[] NOT NULL DEFAULT '{}',
  media_urls jsonb NOT NULL DEFAULT '[]',
  tone text,
  persona text,
  target_platforms text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add campaign_id and core_content to social_posts
ALTER TABLE public.social_posts 
  ADD COLUMN campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN core_content text;

-- Enable RLS on social_campaigns
ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin-only RLS for social_campaigns
CREATE POLICY "Admin can manage social campaigns"
  ON public.social_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for social_campaigns
CREATE TRIGGER update_social_campaigns_updated_at
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
