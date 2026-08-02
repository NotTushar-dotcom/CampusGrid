-- ============================================================
-- ULTIMATE RLS FIX: Allow ALL Team Members to View Mentor & Auto-Heal Membership
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- 1. Enable Row Level Security
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "MentorRequests: select by team member or leader" ON public.mentor_requests;
DROP POLICY IF EXISTS "MentorRequests: select policy" ON public.mentor_requests;
DROP POLICY IF EXISTS "MentorRequests: select all authenticated" ON public.mentor_requests;

-- 3. CREATE COMPREHENSIVE SELECT POLICY ON mentor_requests
-- Allows:
--  a) Direct team_members rows (user_id = auth.uid())
--  b) Accepted join applicants (applicant_id = auth.uid() AND status = 'accepted')
--  c) Team leaders (leader_id = auth.uid())
--  d) Assigned mentors (mentor_id = auth.uid())
CREATE POLICY "MentorRequests: select by team member or leader"
  ON public.mentor_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Any team member in team_members table
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = mentor_requests.team_id AND user_id = auth.uid()
    )
    OR
    -- Any accepted member in team_join_requests
    EXISTS (
      SELECT 1 FROM public.team_join_requests
      WHERE team_id = mentor_requests.team_id AND applicant_id = auth.uid() AND status = 'accepted'
    )
    OR
    -- Team leader
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = mentor_requests.team_id AND leader_id = auth.uid()
    )
    OR
    -- Faculty mentor
    mentor_id = auth.uid()
  );

-- 4. Allow team members to insert/auto-heal into team_members
DROP POLICY IF EXISTS "TeamMembers: insert self or leader" ON public.team_members;
CREATE POLICY "TeamMembers: insert self or leader"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- 5. Allow teams UPDATE by leader or assigned mentor
DROP POLICY IF EXISTS "Teams: update by leader or member" ON public.teams;
CREATE POLICY "Teams: update by leader or member"
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    leader_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.mentor_requests
      WHERE team_id = teams.id AND mentor_id = auth.uid()
    )
  );
