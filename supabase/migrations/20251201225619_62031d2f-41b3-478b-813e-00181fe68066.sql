-- 기존 projects 테이블의 RLS 정책 삭제
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view their school's projects" ON projects;

-- 새로운 간단한 RLS 정책 생성 (개발 단계용)
-- 프로젝트는 누구나 생성 가능 (학교 ID가 있으면)
CREATE POLICY "Anyone can create projects with valid school_id"
ON projects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM schools 
    WHERE schools.id = projects.school_id
  )
);

-- 프로젝트는 같은 학교의 프로젝트만 조회 가능
CREATE POLICY "Anyone can view projects"
ON projects FOR SELECT
USING (true);

-- 프로젝트는 누구나 수정 가능 (개발 단계용)
CREATE POLICY "Anyone can update projects"
ON projects FOR UPDATE
USING (true);

-- 프로젝트는 누구나 삭제 가능 (개발 단계용)
CREATE POLICY "Anyone can delete projects"
ON projects FOR DELETE
USING (true);

-- questions 테이블의 RLS 정책도 간단하게 수정
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
DROP POLICY IF EXISTS "Users can view questions for their projects" ON questions;

CREATE POLICY "Anyone can insert questions"
ON questions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view questions"
ON questions FOR SELECT
USING (true);

CREATE POLICY "Anyone can update questions"
ON questions FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete questions"
ON questions FOR DELETE
USING (true);