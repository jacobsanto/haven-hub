-- Create scheduled_blog_posts table
CREATE TABLE public.scheduled_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Topic & content settings
  topic TEXT NOT NULL,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL,
  
  -- AI generation settings (stored as JSON)
  generation_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Schedule
  scheduled_for TIMESTAMPTZ NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  
  -- Result
  generated_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Add scheduled_publish_at to blog_posts for future publishing
ALTER TABLE public.blog_posts 
ADD COLUMN scheduled_publish_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.scheduled_blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_blog_posts
CREATE POLICY "Admin can manage scheduled posts"
ON public.scheduled_blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_scheduled_blog_posts_updated_at
BEFORE UPDATE ON public.scheduled_blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for cron job queries
CREATE INDEX idx_scheduled_blog_posts_status_scheduled 
ON public.scheduled_blog_posts(status, scheduled_for) 
WHERE status = 'pending';