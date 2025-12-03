-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage survey links" ON public.survey_links;

-- Create new policy that allows anyone to insert survey links for valid projects
CREATE POLICY "Anyone can create survey links for valid projects" 
ON public.survey_links 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = survey_links.project_id
));

-- Allow anyone to update survey links
CREATE POLICY "Anyone can update survey links" 
ON public.survey_links 
FOR UPDATE 
USING (true);

-- Allow anyone to delete survey links
CREATE POLICY "Anyone can delete survey links" 
ON public.survey_links 
FOR DELETE 
USING (true);