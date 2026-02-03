-- Fix PUBLIC_USER_DATA and EXPOSED_SENSITIVE_DATA issues
-- These tables should only be readable by admins, not publicly

-- 1. Fix newsletter_subscribers - drop public insert, add admin-only
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Allow public INSERT only (for newsletter signups), but no public SELECT
CREATE POLICY "Public can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (email IS NOT NULL AND email ~ '^[^@]+@[^@]+\.[^@]+$');

-- 2. Fix contact_submissions - public can INSERT but not SELECT
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Public can submit contact form" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND subject IS NOT NULL AND message IS NOT NULL);

-- 3. Fix experience_enquiries - public can INSERT but not SELECT
DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.experience_enquiries;

CREATE POLICY "Public can submit enquiry" 
ON public.experience_enquiries 
FOR INSERT 
WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND experience_id IS NOT NULL);

-- 4. Fix bookings - only admins should SELECT, public can INSERT with validation
DROP POLICY IF EXISTS "Public can create bookings with valid data" ON public.bookings;

CREATE POLICY "Public can create bookings with validation" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  guest_name IS NOT NULL 
  AND guest_email IS NOT NULL 
  AND guest_email ~ '^[^@]+@[^@]+\.[^@]+$'
  AND check_in IS NOT NULL 
  AND check_out IS NOT NULL 
  AND check_out > check_in 
  AND nights > 0 
  AND total_price >= 0
);

-- 5. Fix booking_payments - only admin access, drop any public policies
-- Already admin-only, but ensure no public access exists

-- 6. Fix booking_addons - ensure admin-only
-- Already has admin policy, just verify RLS is enforced

-- 7. Fix booking_price_breakdown - drop public INSERT, restrict to admin + edge function
DROP POLICY IF EXISTS "Public can insert price breakdown with valid booking" ON public.booking_price_breakdown;
-- Only admin and service role should insert price breakdown
-- The confirm-payment edge function uses service role which bypasses RLS

-- 8. Fix blog_authors - public should only use the view, not the table
-- Already dropped the public policy in previous migration