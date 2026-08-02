-- ============================================================
-- CREATE SPOC ADMIN ACCOUNT IN SUPABASE
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- ============================================================

DO $$
DECLARE
  v_spoc_id UUID := gen_random_uuid();
  v_email TEXT := 'spoc@glbajajgroup.org';
  v_password TEXT := 'Admin@GLBAJAJ2026';
BEGIN
  -- 1. Create in auth.users if not existing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_spoc_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"College SPOC Admin"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  -- 2. Ensure row in public.users has role = 'admin_spoc'
  INSERT INTO public.users (id, email, full_name, role)
  SELECT id, email, 'College SPOC Admin', 'admin_spoc'
  FROM auth.users
  WHERE email = v_email
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin_spoc', full_name = 'College SPOC Admin';
END $$;
