-- 1. Drop existing permissive policy on schools
DROP POLICY IF EXISTS "Schools basic info publicly readable" ON public.schools;

-- 2. Create a view for public school info (without password_hash)
CREATE OR REPLACE VIEW public.schools_public AS
SELECT id, school_code, school_name, region, school_type, created_at, updated_at
FROM public.schools;

-- 3. Grant access to the view
GRANT SELECT ON public.schools_public TO anon, authenticated;

-- 4. Create restrictive policy - only authenticated users with roles can see full school data
CREATE POLICY "Only authorized users can view school details"
ON public.schools
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.school_id = schools.id
    AND user_roles.user_id = auth.uid()
  )
);

-- 5. Fix projects policies - restrict UPDATE and DELETE to authorized users only
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.projects;

CREATE POLICY "Authorized users can update projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.school_id = projects.school_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Authorized users can delete projects"
ON public.projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.school_id = projects.school_id
    AND user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 6. Restrict questions modification to authorized users
DROP POLICY IF EXISTS "Anyone can update questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can insert questions" ON public.questions;

CREATE POLICY "Authorized users can insert questions"
ON public.questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = questions.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Authorized users can update questions"
ON public.questions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = questions.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Authorized users can delete questions"
ON public.questions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = questions.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

-- 7. Restrict survey_links modification
DROP POLICY IF EXISTS "Anyone can update survey links" ON public.survey_links;
DROP POLICY IF EXISTS "Anyone can delete survey links" ON public.survey_links;
DROP POLICY IF EXISTS "Anyone can create survey links for valid projects" ON public.survey_links;

CREATE POLICY "Authorized users can create survey links"
ON public.survey_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = survey_links.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Authorized users can update survey links"
ON public.survey_links
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = survey_links.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Authorized users can delete survey links"
ON public.survey_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.user_roles ur ON ur.school_id = p.school_id
    WHERE p.id = survey_links.project_id
    AND ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);