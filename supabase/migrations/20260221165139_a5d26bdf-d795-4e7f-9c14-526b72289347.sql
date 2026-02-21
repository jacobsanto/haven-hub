
DROP POLICY IF EXISTS "Create checkout holds for booking" ON public.checkout_holds;

CREATE POLICY "Create checkout holds for booking"
  ON public.checkout_holds
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (expires_at > now())
    AND (expires_at < (now() + interval '15 minutes'))
  );
