-- Fix overly permissive RLS policy
DROP POLICY IF EXISTS "Public can insert price breakdown with booking" ON public.booking_price_breakdown;

-- Create a more restrictive policy that requires a valid booking_id
CREATE POLICY "Public can insert price breakdown with valid booking"
ON public.booking_price_breakdown
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings WHERE id = booking_id
  )
);