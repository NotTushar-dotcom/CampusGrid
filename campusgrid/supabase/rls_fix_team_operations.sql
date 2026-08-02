-- ============================================================
-- FIX: Allow team members to leave teams (DELETE own rows)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Allow students to delete their OWN row from team_members
CREATE POLICY "Members can leave team"
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Allow team leaders to remove other members from their team
CREATE POLICY "Leaders can remove members from their team"
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE leader_id = auth.uid()
    )
  );

-- 3. Allow students to delete their OWN join requests (when leaving)
CREATE POLICY "Students can delete their own join requests"
  ON public.team_join_requests
  FOR DELETE
  TO authenticated
  USING (applicant_id = auth.uid());

-- 4. Allow students to insert their own join requests (for browse-team apply)
CREATE POLICY "Students can insert their own join requests"
  ON public.team_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- 5. Allow students to insert themselves into team_members (for join-by-code)
CREATE POLICY "Students can join teams"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- NOTE: If any policy already exists, drop the line causing the error and re-run.
