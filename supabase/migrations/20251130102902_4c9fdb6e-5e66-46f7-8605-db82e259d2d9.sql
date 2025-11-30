-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role_type AS ENUM ('admin', 'manager', 'viewer');
CREATE TYPE respondent_type AS ENUM ('teacher', 'staff', 'parent', 'student');
CREATE TYPE question_type AS ENUM ('rating', 'multiple_choice', 'text', 'priority');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'closed', 'archived');

-- Schools table (multi-tenancy)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  region TEXT,
  school_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table (평가/계획 프로젝트)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation domains (평가 영역)
CREATE TABLE public.evaluation_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evaluation areas (세부 영역)
CREATE TABLE public.evaluation_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES public.evaluation_domains(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indicators (평가 지표)
CREATE TABLE public.indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES public.evaluation_areas(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions (설문 문항)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  indicator_id UUID REFERENCES public.indicators(id) ON DELETE SET NULL,
  respondent_type respondent_type NOT NULL,
  question_type question_type NOT NULL DEFAULT 'rating',
  question_text TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  section_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Responses (응답)
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  respondent_type respondent_type NOT NULL,
  response_value TEXT,
  response_data JSONB,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles for school admins
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

-- Survey links (설문 링크 관리)
CREATE TABLE public.survey_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  respondent_type respondent_type NOT NULL,
  access_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, respondent_type)
);

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools (public read for login, admin write)
CREATE POLICY "Schools are publicly readable for login"
  ON public.schools FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update their school"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.school_id = schools.id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can view their school's projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.school_id = projects.school_id
      AND user_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.school_id = projects.school_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.school_id = projects.school_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.school_id = projects.school_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for evaluation domains/areas/indicators (public read)
CREATE POLICY "Evaluation domains are publicly readable"
  ON public.evaluation_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Evaluation areas are publicly readable"
  ON public.evaluation_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Indicators are publicly readable"
  ON public.indicators FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for questions
CREATE POLICY "Users can view questions for their projects"
  ON public.questions FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = questions.project_id
      AND (
        projects.status = 'active'
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.school_id = projects.school_id
          AND user_roles.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.user_roles ON user_roles.school_id = projects.school_id
      WHERE projects.id = questions.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.user_roles ON user_roles.school_id = projects.school_id
      WHERE projects.id = questions.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.user_roles ON user_roles.school_id = projects.school_id
      WHERE projects.id = questions.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for responses (anyone can submit, admins can view)
CREATE POLICY "Anyone can submit responses"
  ON public.responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = responses.project_id
      AND projects.status = 'active'
    )
  );

CREATE POLICY "Admins can view responses for their projects"
  ON public.responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.user_roles ON user_roles.school_id = projects.school_id
      WHERE projects.id = responses.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager', 'viewer')
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles for their school"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.school_id = user_roles.school_id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- RLS Policies for survey_links
CREATE POLICY "Anyone can view active survey links"
  ON public.survey_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can manage survey links"
  ON public.survey_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.user_roles ON user_roles.school_id = projects.school_id
      WHERE projects.id = survey_links.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager')
    )
  );

-- Create indexes for performance
CREATE INDEX idx_projects_school_id ON public.projects(school_id);
CREATE INDEX idx_questions_project_id ON public.questions(project_id);
CREATE INDEX idx_responses_project_id ON public.responses(project_id);
CREATE INDEX idx_responses_question_id ON public.responses(question_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school_id ON public.user_roles(school_id);
CREATE INDEX idx_survey_links_access_code ON public.survey_links(access_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();