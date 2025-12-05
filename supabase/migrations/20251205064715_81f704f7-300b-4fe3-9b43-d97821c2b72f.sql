-- Fix projects table public exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;

-- Create proper policy: only authenticated users from the same school can view projects
CREATE POLICY "School members can view their projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.school_id = projects.school_id 
    AND user_roles.user_id = auth.uid()
  )
  OR
  -- Also allow access via session-based auth (for non-Supabase auth users)
  school_id::text = current_setting('app.current_school_id', true)
);