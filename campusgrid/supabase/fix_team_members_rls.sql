-- 0. Ensure teams table allows delete and update by leader
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams: delete by leader" ON public.teams;
CREATE POLICY "Teams: delete by leader"
  ON public.teams FOR DELETE
  TO authenticated
  USING (leader_id = auth.uid());

DROP POLICY IF EXISTS "Teams: update by leader or member" ON public.teams;
DROP POLICY IF EXISTS "Teams: update by leader" ON public.teams;
CREATE POLICY "Teams: update by leader or member"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    leader_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

-- 1. Ensure team_members table has RLS enabled
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 2. Allow ALL authenticated users to view team_members
-- (Ensures all students in a team can view all teammates)
DROP POLICY IF EXISTS "TeamMembers: select all authenticated" ON public.team_members;
CREATE POLICY "TeamMembers: select all authenticated"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow team leader OR members themselves to insert/upsert into team_members
DROP POLICY IF EXISTS "TeamMembers: insert by team leader or self" ON public.team_members;
DROP POLICY IF EXISTS "TeamMembers: insert self or leader" ON public.team_members;
DROP POLICY IF EXISTS "TeamMembers: insert by team leader" ON public.team_members;

CREATE POLICY "TeamMembers: insert self or leader"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- 4. Allow team members to update their own row or leader to update
DROP POLICY IF EXISTS "TeamMembers: update self or leader" ON public.team_members;
CREATE POLICY "TeamMembers: update self or leader"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- 5. Allow members to delete their own row or leader to delete members
DROP POLICY IF EXISTS "TeamMembers: delete own row" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave team" ON public.team_members;
DROP POLICY IF EXISTS "Leaders can remove members from their team" ON public.team_members;
DROP POLICY IF EXISTS "TeamMembers: delete self or leader" ON public.team_members;

CREATE POLICY "TeamMembers: delete self or leader"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
  );

-- 6. Ensure team_join_requests RLS policies permit select, insert, update, and delete
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "JoinRequests: select own or team member" ON public.team_join_requests;
DROP POLICY IF EXISTS "JoinRequests: select own as applicant" ON public.team_join_requests;
DROP POLICY IF EXISTS "JoinRequests: select as leader" ON public.team_join_requests;

CREATE POLICY "JoinRequests: select own or team member"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_join_requests.team_id AND leader_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_join_requests.team_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_join_requests tjr
      WHERE tjr.team_id = team_join_requests.team_id 
        AND tjr.applicant_id = auth.uid() 
        AND tjr.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "JoinRequests: insert own" ON public.team_join_requests;
CREATE POLICY "JoinRequests: insert own"
  ON public.team_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "JoinRequests: update as leader or applicant" ON public.team_join_requests;
DROP POLICY IF EXISTS "JoinRequests: update as leader" ON public.team_join_requests;
DROP POLICY IF EXISTS "JoinRequests: update own as applicant" ON public.team_join_requests;

CREATE POLICY "JoinRequests: update as leader or applicant"
  ON public.team_join_requests FOR UPDATE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_join_requests.team_id AND leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "JoinRequests: delete own or leader" ON public.team_join_requests;
DROP POLICY IF EXISTS "JoinRequests: delete own" ON public.team_join_requests;

CREATE POLICY "JoinRequests: delete own or leader"
  ON public.team_join_requests FOR DELETE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_join_requests.team_id AND leader_id = auth.uid()
    )
  );

-- 7. Backfill/Sync any accepted join requests into team_members table
INSERT INTO public.team_members (team_id, user_id, role_in_team, full_name, email, roll_number)
SELECT 
  tjr.team_id,
  tjr.applicant_id,
  'Member',
  u.full_name,
  u.email,
  u.roll_number
FROM public.team_join_requests tjr
JOIN public.users u ON u.id = tjr.applicant_id
WHERE tjr.status = 'accepted'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 8. Backfill/Sync all team leaders into team_members table
INSERT INTO public.team_members (team_id, user_id, role_in_team, full_name, email, roll_number)
SELECT 
  t.id,
  t.leader_id,
  'Leader',
  u.full_name,
  u.email,
  u.roll_number
FROM public.teams t
JOIN public.users u ON u.id = t.leader_id
WHERE t.leader_id IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;
