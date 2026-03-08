-- Revert to SECURITY DEFINER (intentional: hides email column from public while allowing read of non-sensitive fields)
DROP VIEW IF EXISTS public.blog_authors_public;

CREATE VIEW public.blog_authors_public
WITH (security_invoker = false)
AS
SELECT
  id, name, slug, bio, avatar_url, website_url,
  social_twitter, social_linkedin,
  is_active, created_at, updated_at
FROM public.blog_authors
WHERE is_active = true;

GRANT SELECT ON public.blog_authors_public TO anon, authenticated;