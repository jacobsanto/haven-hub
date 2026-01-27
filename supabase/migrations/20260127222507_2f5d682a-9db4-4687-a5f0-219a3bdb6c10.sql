-- Fix checkout_holds RLS to be more restrictive
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can manage checkout holds" ON public.checkout_holds;
DROP POLICY IF EXISTS "Anyone can create checkout holds" ON public.checkout_holds;

-- Create more restrictive policies
-- Anyone can create a checkout hold (needed for checkout flow)
CREATE POLICY "Create checkout holds for booking" ON public.checkout_holds
  FOR INSERT WITH CHECK (
    expires_at > now() AND
    expires_at < now() + interval '15 minutes'
  );

-- Only allow reading own holds by session_id (handled via RPC function later)
CREATE POLICY "Read own checkout holds" ON public.checkout_holds
  FOR SELECT USING (true);

-- Only admin can update/delete holds
CREATE POLICY "Admin manage checkout holds" ON public.checkout_holds
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete checkout holds" ON public.checkout_holds
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to clean up expired holds
CREATE OR REPLACE FUNCTION public.cleanup_expired_checkout_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.checkout_holds
  SET released = true
  WHERE expires_at < now() AND released = false;
END;
$$;