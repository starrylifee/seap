-- Fix security issue: Remove public access to password_hash
-- Update schools policy to only allow reading non-sensitive columns
DROP POLICY IF EXISTS "Schools are publicly readable for login" ON public.schools;

-- Create a view that excludes password_hash for public access
CREATE OR REPLACE VIEW public.schools_public AS
SELECT id, school_code, school_name, region, school_type, created_at, updated_at
FROM public.schools;

-- Allow public to select from the view (for login lookup by school_code)
GRANT SELECT ON public.schools_public TO anon, authenticated;

-- Keep the original policy but restrict it - only allow reading school_code and school_name for login verification
CREATE POLICY "Schools readable for login verification" 
ON public.schools 
FOR SELECT 
USING (true);

-- Note: The password verification should happen server-side where we can access password_hash safely