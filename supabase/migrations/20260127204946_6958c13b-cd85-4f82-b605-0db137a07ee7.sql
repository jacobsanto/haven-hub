-- Create blog_authors table
CREATE TABLE public.blog_authors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    avatar_url text,
    bio text,
    email text,
    website_url text,
    social_twitter text,
    social_linkedin text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active authors"
ON public.blog_authors
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all authors"
ON public.blog_authors
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert authors"
ON public.blog_authors
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update authors"
ON public.blog_authors
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete authors"
ON public.blog_authors
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_blog_authors_updated_at
BEFORE UPDATE ON public.blog_authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop existing foreign key on blog_posts.author_id (it points to profiles)
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Add new foreign key to blog_authors with ON DELETE SET NULL
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.blog_authors(id) ON DELETE SET NULL;

-- Seed default author
INSERT INTO public.blog_authors (name, slug, bio, is_active)
VALUES (
    'Arivia Editorial',
    'arivia-editorial',
    'Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration.',
    true
);