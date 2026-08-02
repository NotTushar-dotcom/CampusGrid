-- =============================================================
-- CampusGrid — Team Formation Migration
-- Run this once in: Supabase Dashboard > SQL Editor > Run
-- =============================================================

-- Step 1: Extend the teams table
-- --------------------------------------------------------------

-- Add join_code column (6-char unique code, e.g. CG-8X92K)
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS open_roles TEXT[] DEFAULT '{}';

-- Backfill join codes for any existing teams that don't have one
UPDATE public.teams
SET join_code = 'CG-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 5))
WHERE join_code IS NULL;

-- Relax the status CHECK to include 'recruiting' and 'full'
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_status_check;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_status_check
  CHECK (status IN ('draft', 'recruiting', 'full', 'submitted', 'approved'));

-- =============================================================
-- TABLE: team_join_requests
-- Students requesting to join an existing recruiting team
-- =============================================================
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  applicant_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pitch_message  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  reject_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, applicant_id)
);

-- RLS: team_join_requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read their own requests (as applicant)
CREATE POLICY "JoinRequests: select own as applicant"
  ON public.team_join_requests FOR SELECT
  USING (applicant_id = auth.uid());

-- Team leader can read all requests for their teams
CREATE POLICY "JoinRequests: select as leader"
  ON public.team_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_join_requests.team_id
        AND leader_id = auth.uid()
    )
  );

-- Any authenticated student can insert a request (as applicant)
CREATE POLICY "JoinRequests: insert own"
  ON public.team_join_requests FOR INSERT
  WITH CHECK (applicant_id = auth.uid());

-- Only the leader can update request status (accept / reject)
CREATE POLICY "JoinRequests: update as leader"
  ON public.team_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_join_requests.team_id
        AND leader_id = auth.uid()
    )
  );

-- Applicant can update their own request (e.g. cancel it)
CREATE POLICY "JoinRequests: update own as applicant"
  ON public.team_join_requests FOR UPDATE
  USING (applicant_id = auth.uid());

-- Allow delete by applicant (to withdraw a request)
CREATE POLICY "JoinRequests: delete own"
  ON public.team_join_requests FOR DELETE
  USING (applicant_id = auth.uid());

-- =============================================================
-- Also allow team members to INSERT into team_members
-- (needed so the accept function below can work as the calling user)
-- The existing policy only allows the leader – extend it.
-- =============================================================
DROP POLICY IF EXISTS "TeamMembers: insert by team leader" ON public.team_members;
CREATE POLICY "TeamMembers: insert by team leader or self"
  ON public.team_members FOR INSERT
  WITH CHECK (
    -- leader inserting any member
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND leader_id = auth.uid()
    )
    OR
    -- or inserting yourself (direct join via code)
    user_id = auth.uid()
  );

-- =============================================================
-- FUNCTION: handle_accept_join_request
-- Atomically accepts a join request with all side-effects.
-- Called from the client via supabase.rpc('handle_accept_join_request', ...)
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_accept_join_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req          RECORD;
  member_count INT;
  result       JSONB;
BEGIN
  -- 1. Fetch the request
  SELECT * INTO req
  FROM public.team_join_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request not found or not pending');
  END IF;

  -- 2. Verify caller is the team leader
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = req.team_id AND leader_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorised');
  END IF;

  -- 3. Insert applicant into team_members (ignore if already member)
  INSERT INTO public.team_members (team_id, user_id, role_in_team)
  VALUES (req.team_id, req.applicant_id, 'Member')
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- 4. Mark this request as accepted
  UPDATE public.team_join_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- 5. Count current members
  SELECT COUNT(*) INTO member_count
  FROM public.team_members
  WHERE team_id = req.team_id;

  -- 6. If team is now full (6 members), apply capacity rules
  IF member_count >= 6 THEN
    -- Mark team as full
    UPDATE public.teams
    SET status = 'full'
    WHERE id = req.team_id;

    -- Auto-reject all other pending requests to THIS team
    UPDATE public.team_join_requests
    SET status = 'rejected', reject_reason = 'Team capacity reached 6/6'
    WHERE team_id = req.team_id
      AND status = 'pending'
      AND id <> request_id;

    -- Auto-cancel all other pending requests FROM the accepted applicant to OTHER teams
    UPDATE public.team_join_requests
    SET status = 'cancelled'
    WHERE applicant_id = req.applicant_id
      AND team_id <> req.team_id
      AND status = 'pending';
  END IF;

  result := jsonb_build_object(
    'ok', true,
    'team_id', req.team_id,
    'applicant_id', req.applicant_id,
    'member_count', member_count,
    'team_full', member_count >= 6
  );

  RETURN result;
END;
$$;
