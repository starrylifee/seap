-- Fix SECURITY DEFINER view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.schools_public;

CREATE VIEW public.schools_public 
WITH (security_invoker = true)
AS
SELECT id, school_code, school_name, region, school_type, created_at, updated_at
FROM public.schools;

-- Grant access to the view
GRANT SELECT ON public.schools_public TO anon, authenticated;