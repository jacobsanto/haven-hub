-- Fix profiles enumeration vulnerability
-- Remove the OR condition that allows admins to view all profiles via public access
-- Admins should use service role or a separate admin policy

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Separate admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));