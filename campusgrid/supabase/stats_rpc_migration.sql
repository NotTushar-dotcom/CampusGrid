-- =============================================================
-- CampusGrid — Public Realtime Stats SQL Migration
-- Run this once in: Supabase Dashboard > SQL Editor > Run
-- =============================================================

-- Creates a SECURITY DEFINER function to compute portal stats safely for all visitors
CREATE OR REPLACE FUNCTION public.get_portal_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_count INT;
  team_count INT;
  ps_count INT;
BEGIN
  -- 1. Count total registered students/users
  SELECT COUNT(*) INTO student_count FROM public.users;

  -- 2. Count total registered teams
  SELECT COUNT(*) INTO team_count FROM public.teams;

  -- 3. Count problem statements (if table exists)
  BEGIN
    SELECT COUNT(*) INTO ps_count FROM public.problem_statements;
  EXCEPTION WHEN OTHERS THEN
    ps_count := 0;
  END;

  RETURN jsonb_build_object(
    'studentRegistrations', student_count,
    'teamsFormed', team_count,
    'problemStatements', CASE WHEN ps_count > 0 THEN ps_count::text ELSE 'Releasing Soon' END
  );
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_portal_stats() TO anon, authenticated, service_role;
