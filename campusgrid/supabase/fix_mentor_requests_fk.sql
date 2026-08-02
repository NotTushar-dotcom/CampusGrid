-- ============================================================
-- FIX: Foreign Key Constraint on mentor_requests
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Drop existing constraint if it points to faculty_mentors table instead of users
ALTER TABLE public.mentor_requests
  DROP CONSTRAINT IF EXISTS mentor_requests_mentor_id_fkey;

-- 2. Add foreign key constraint referencing public.users(id)
ALTER TABLE public.mentor_requests
  ADD CONSTRAINT mentor_requests_mentor_id_fkey
  FOREIGN KEY (mentor_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Ensure RLS policies exist for mentor_requests
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

-- Allow team leaders to send requests
DROP POLICY IF EXISTS "MentorRequests: insert by team leader" ON public.mentor_requests;
CREATE POLICY "MentorRequests: insert by team leader"
  ON public.mentor_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- Allow team members & leaders to read their team's mentor requests
DROP POLICY IF EXISTS "MentorRequests: select by team member or leader" ON public.mentor_requests;
CREATE POLICY "MentorRequests: select by team member or leader"
  ON public.mentor_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = mentor_requests.team_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = mentor_requests.team_id AND leader_id = auth.uid()
    )
    OR
    mentor_id = auth.uid()
  );

-- Allow mentor to update status (accept / reject)
DROP POLICY IF EXISTS "MentorRequests: update by mentor" ON public.mentor_requests;
CREATE POLICY "MentorRequests: update by mentor"
  ON public.mentor_requests FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid());
