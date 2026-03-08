-- 1. Recreate view with SECURITY INVOKER
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

GRANT SELECT ON public.blog_authors_public TO anon, authenticated;

-- 2. Add public SELECT policy on underlying table so SECURITY INVOKER view works
CREATE POLICY "Public can read active authors"
  ON public.blog_authors
  FOR SELECT
  USING (is_active = true);