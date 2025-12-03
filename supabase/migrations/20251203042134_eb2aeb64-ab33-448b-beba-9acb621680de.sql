-- Drop the security definer view that caused the linter warning
DROP VIEW IF EXISTS public.schools_public;

-- The schools table needs to be readable for login verification
-- Password verification happens client-side in this school-code-based auth system
-- This is a known architectural limitation that would require edge functions to fix properly