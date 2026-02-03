-- Phase 1.1: Remove overly permissive blog_authors policy
-- Public should use the blog_authors_public view which excludes email
DROP POLICY IF EXISTS "Public can view active authors without sensitive data" ON public.blog_authors;

-- Phase 1.3: Add checkout_holds validation function with rate limiting
CREATE OR REPLACE FUNCTION public.validate_checkout_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_holds_count INTEGER;
BEGIN
  -- Check for rate limiting: max 3 active holds per session in last 30 minutes
  SELECT COUNT(*) INTO recent_holds_count
  FROM public.checkout_holds
  WHERE session_id = NEW.session_id
    AND created_at > (now() - INTERVAL '30 minutes')
    AND released = false;
  
  IF recent_holds_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many active holds for this session';
  END IF;
  
  -- Validate session_id format (must be non-empty, reasonable length)
  IF NEW.session_id IS NULL OR LENGTH(NEW.session_id) < 10 OR LENGTH(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'Invalid session_id format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for checkout hold validation
DROP TRIGGER IF EXISTS validate_checkout_hold_trigger ON public.checkout_holds;
CREATE TRIGGER validate_checkout_hold_trigger
  BEFORE INSERT ON public.checkout_holds
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_checkout_hold();