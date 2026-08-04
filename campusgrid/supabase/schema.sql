-- =============================================================
-- CampusGrid Database Schema
-- Supabase / PostgreSQL
-- Apply via: Supabase Dashboard > SQL Editor > Run
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- TABLE: users
-- Mirrors auth.users with additional student profile data
-- =============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  email            TEXT UNIQUE NOT NULL,
  roll_number      TEXT UNIQUE,
  year_of_study    TEXT,
  skills           TEXT[] DEFAULT '{}',
  role             TEXT NOT NULL DEFAULT 'student'
                     CHECK (role IN ('student', 'faculty', 'admin_spoc')),
  -- Faculty-only fields
  designation      TEXT,
  department       TEXT,
  contact_number   TEXT,
  sih_themes       TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users: select own or all authenticated"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users: insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users: update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users: delete own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- =============================================================
-- TABLE: events
-- Campus events (SIH 2026 Internal Hackathon, etc.)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date  TIMESTAMPTZ,
  end_date    TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  ps_links    JSONB DEFAULT '[]'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events: public read"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Events: admin insert"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin_spoc'
    )
  );

CREATE POLICY "Events: admin update"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin_spoc'
    )
  );

-- =============================================================
-- TABLE: teams
-- Team registrations linked to a specific event
-- =============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name             TEXT NOT NULL,
  leader_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  problem_statement_id  TEXT,
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams: select all authenticated"
  ON public.teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teams: insert by authenticated"
  ON public.teams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND leader_id = auth.uid());

CREATE POLICY "Teams: update by leader"
  ON public.teams FOR UPDATE
  USING (leader_id = auth.uid());

CREATE POLICY "Teams: delete by leader"
  ON public.teams FOR DELETE
  USING (leader_id = auth.uid());

-- =============================================================
-- TABLE: team_members
-- Many-to-many: teams <-> users
-- =============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_team  TEXT,
  UNIQUE (team_id, user_id)
);

-- RLS: team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TeamMembers: select all authenticated"
  ON public.team_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "TeamMembers: insert by team leader"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

CREATE POLICY "TeamMembers: delete own row"
  ON public.team_members FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================
-- TABLE: solo_matchmaker
-- Students available to join a team for a specific event
-- =============================================================
CREATE TABLE IF NOT EXISTS public.solo_matchmaker (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  offered_skills  TEXT[] DEFAULT '{}',
  bio             TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'placed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

-- RLS: solo_matchmaker
ALTER TABLE public.solo_matchmaker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SoloMatchmaker: select all authenticated"
  ON public.solo_matchmaker FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "SoloMatchmaker: insert own"
  ON public.solo_matchmaker FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "SoloMatchmaker: update own"
  ON public.solo_matchmaker FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "SoloMatchmaker: delete own"
  ON public.solo_matchmaker FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================
-- TABLE: team_requests
-- Open slot announcements posted by teams
-- =============================================================
CREATE TABLE IF NOT EXISTS public.team_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  required_role   TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'filled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: team_requests
ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TeamRequests: select all authenticated"
  ON public.team_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "TeamRequests: insert by team leader"
  ON public.team_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

CREATE POLICY "TeamRequests: update by team leader"
  ON public.team_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- =============================================================
-- TRIGGER: Auto-create users row on auth signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- TABLE & TRIGGER: faculty_mentors <-> public.users auto sync
-- =============================================================
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

ALTER TABLE public.faculty_mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FacultyMentors: select all authenticated" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: select all authenticated"
  ON public.faculty_mentors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "FacultyMentors: insert own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: insert own profile"
  ON public.faculty_mentors FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "FacultyMentors: update own profile" ON public.faculty_mentors;
CREATE POLICY "FacultyMentors: update own profile"
  ON public.faculty_mentors FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.sync_faculty_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  target_name TEXT;
  target_email TEXT;
BEGIN
  target_id := COALESCE(NEW.id, NEW.user_id);
  IF target_id IS NULL THEN
    RETURN NEW;
  END IF;

  target_name  := COALESCE(NULLIF(NEW.full_name, ''), 'Faculty Member');
  target_email := COALESCE(NULLIF(NEW.email, ''), target_id::text || '@campusgrid.local');

  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    designation,
    department,
    contact_number,
    sih_themes
  )
  VALUES (
    target_id,
    target_email,
    target_name,
    'faculty',
    NEW.designation,
    NEW.department,
    NEW.contact_number,
    COALESCE(NEW.sih_themes, '{}')
  )
  ON CONFLICT (id) DO UPDATE SET
    role           = 'faculty',
    full_name      = CASE WHEN EXCLUDED.full_name <> 'Faculty Member' THEN EXCLUDED.full_name ELSE users.full_name END,
    email          = CASE WHEN EXCLUDED.email NOT LIKE '%@campusgrid.local' THEN EXCLUDED.email ELSE users.email END,
    designation    = COALESCE(EXCLUDED.designation, users.designation),
    department     = COALESCE(EXCLUDED.department, users.department),
    contact_number = COALESCE(EXCLUDED.contact_number, users.contact_number),
    sih_themes     = COALESCE(EXCLUDED.sih_themes, users.sih_themes);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_faculty_mentor_upsert ON public.faculty_mentors;
CREATE TRIGGER on_faculty_mentor_upsert
  AFTER INSERT OR UPDATE ON public.faculty_mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_faculty_to_users();

