-- Drop the overly permissive insert policy for bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Create a more specific insert policy for bookings
-- This allows anyone to insert but validates the data structure
CREATE POLICY "Public can create bookings with valid data"
    ON public.bookings FOR INSERT
    WITH CHECK (
        guest_name IS NOT NULL 
        AND guest_email IS NOT NULL 
        AND check_in IS NOT NULL 
        AND check_out IS NOT NULL
        AND check_out > check_in
        AND nights > 0
        AND total_price >= 0
    );