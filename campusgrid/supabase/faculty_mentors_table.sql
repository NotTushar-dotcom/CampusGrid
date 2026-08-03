-- ============================================================
-- CAMPUSGRID DATABASE MIGRATION: faculty_mentors & users sync
-- Run this script in: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- 1. Ensure all columns exist on public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sih_themes TEXT[] DEFAULT '{}';

-- 2. Create faculty_mentors table if not exists
CREATE TABLE IF NOT EXISTS public.faculty_mentors (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id             UUID,
  full_name           TEXT,
  email               TEXT,
  designation         TEXT,
  department          TEXT,
  contact_number      TEXT,
  sih_themes          TEXT[] DEFAULT '{}',
  areas_of_expertise  TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist on faculty_mentors (fixes column missing errors)
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS sih_themes TEXT[] DEFAULT '{}';
ALTER TABLE public.faculty_mentors ADD COLUMN IF NOT EXISTS areas_of_expertise TEXT[] DEFAULT '{}';

-- Enable Row Level Security (RLS)
ALTER TABLE public.faculty_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for faculty_mentors
DROP POLICY IF EXISTS "FacultyMentors: select all authenticated" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: select all authenticated"
  ON public.faculty_mentors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "FacultyMentors: insert own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: insert own profile"
  ON public.faculty_mentors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "FacultyMentors: update own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: update own profile"
  ON public.faculty_mentors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "FacultyMentors: delete own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: delete own profile"
  ON public.faculty_mentors FOR DELETE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id);

-- 4. Automatic DB Trigger: Sync faculty_mentors to public.users with role 'faculty'
CREATE OR REPLACE FUNCTION public.sync_faculty_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.id, NEW.user_id);
  IF target_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert stub row into public.users if not exists
  INSERT INTO public.users (id, role)
  VALUES (target_id, 'faculty')
  ON CONFLICT (id) DO UPDATE SET role = 'faculty';

  -- Update all profile fields
  UPDATE public.users SET
    full_name      = COALESCE(NEW.full_name, full_name),
    email          = COALESCE(NEW.email, email),
    designation    = COALESCE(NEW.designation, designation),
    department     = COALESCE(NEW.department, department),
    contact_number = COALESCE(NEW.contact_number, contact_number),
    sih_themes     = COALESCE(NEW.sih_themes, sih_themes)
  WHERE id = target_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_faculty_mentor_upsert ON public.faculty_mentors;
CREATE TRIGGER on_faculty_mentor_upsert
  AFTER INSERT OR UPDATE ON public.faculty_mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_faculty_to_users();

-- 5. Backfill/Sync any existing rows from faculty_mentors into public.users
INSERT INTO public.users (id, role)
SELECT COALESCE(id, user_id), 'faculty'
FROM public.faculty_mentors
WHERE COALESCE(id, user_id) IS NOT NULL
ON CONFLICT (id) DO UPDATE SET role = 'faculty';

UPDATE public.users u
SET
  full_name      = COALESCE(fm.full_name, u.full_name),
  email          = COALESCE(fm.email, u.email),
  designation    = COALESCE(fm.designation, u.designation),
  department     = COALESCE(fm.department, u.department),
  contact_number = COALESCE(fm.contact_number, u.contact_number),
  sih_themes     = COALESCE(fm.sih_themes, u.sih_themes)
FROM public.faculty_mentors fm
WHERE u.id = fm.id OR u.id = fm.user_id;
