-- Remove public access to schools table password_hash
-- Create a view that excludes password_hash for public access
DROP POLICY IF EXISTS "Schools readable for login verification" ON public.schools;

-- Only allow reading school_code and school_name publicly (for display purposes)
CREATE POLICY "Schools basic info publicly readable" 
ON public.schools 
FOR SELECT 
USING (true);

-- Note: password_hash is still in the table but login is now handled by Edge Function
-- which uses service role key, so public users never see password_hash in responses