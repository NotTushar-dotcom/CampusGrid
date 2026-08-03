-- ============================================================
-- TABLE: faculty_mentors
-- Separate profile table for Faculty Mentors in Supabase
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.faculty_mentors (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  designation         TEXT,
  department          TEXT,
  contact_number      TEXT,
  sih_themes          TEXT[] DEFAULT '{}',
  areas_of_expertise  TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.faculty_mentors ENABLE ROW LEVEL SECURITY;

-- 1. SELECT policy: authenticated users can view faculty mentors
DROP POLICY IF EXISTS "FacultyMentors: select all authenticated" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: select all authenticated"
  ON public.faculty_mentors FOR SELECT
  TO authenticated
  USING (true);

-- 2. INSERT policy: authenticated user can insert their own profile
DROP POLICY IF EXISTS "FacultyMentors: insert own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: insert own profile"
  ON public.faculty_mentors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. UPDATE policy: authenticated user can update their own profile
DROP POLICY IF EXISTS "FacultyMentors: update own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: update own profile"
  ON public.faculty_mentors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. DELETE policy: authenticated user can delete their own profile
DROP POLICY IF EXISTS "FacultyMentors: delete own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: delete own profile"
  ON public.faculty_mentors FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
