-- Fix SECURITY DEFINER view - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.blog_authors_public;

CREATE VIEW public.blog_authors_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, bio, avatar_url, website_url,
  social_twitter, social_linkedin,
  is_active, created_at, updated_at
FROM public.blog_authors
WHERE is_active = true;

-- Grant public read access to the view
GRANT SELECT ON public.blog_authors_public TO anon, authenticated;