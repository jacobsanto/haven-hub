CREATE OR REPLACE FUNCTION public.validate_checkout_hold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_holds_count INTEGER;
BEGIN
  -- Check for rate limiting: max 3 active holds per session in last 30 minutes
  -- Only count holds that are NOT released AND NOT expired
  SELECT COUNT(*) INTO recent_holds_count
  FROM public.checkout_holds
  WHERE session_id = NEW.session_id
    AND created_at > (now() - INTERVAL '30 minutes')
    AND released = false
    AND expires_at > now();
  
  IF recent_holds_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many active holds for this session';
  END IF;
  
  -- Validate session_id format (must be non-empty, reasonable length)
  IF NEW.session_id IS NULL OR LENGTH(NEW.session_id) < 10 OR LENGTH(NEW.session_id) > 100 THEN
    RAISE EXCEPTION 'Invalid session_id format';
  END IF;
  
  RETURN NEW;
END;
$function$;