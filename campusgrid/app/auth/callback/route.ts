import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const ALLOWED_DOMAIN = '@glbajajgroup.org';

/**
 * Google OAuth callback handler.
 *
 * Problem being solved:
 * ─────────────────────
 * When a user who previously registered via email/password signs in through
 * Google OAuth, Supabase may create a NEW auth.users row with a different UUID.
 * The handle_new_user() trigger inserts a stub public.users row for that new UUID
 * (roll_number = NULL), which would wrongly funnel already-registered users back
 * to /register. We fix this by querying both tables with .or(id, email) so the
 * canonical profile row is always found regardless of which UUID is active.
 *
 * If the profile row's id differs from the current auth uid we patch it in-place
 * so future lookups by auth.uid() work correctly through RLS policies.
 *
 * Decision tree:
 *  1. No `code` param                    → /login?error=oauth_failed
 *  2. exchangeCodeForSession fails        → /login?error=oauth_failed
 *  3. Email domain ≠ @glbajajgroup.org   → signOut() + /login?error=unauthorized_domain
 *  4. Found in public.users              → (sync id if needed) → /dashboard/team
 *  5. Found in public.faculty_mentors    → (sync id if needed) → /dashboard/mentor
 *  6. Not found in either table          → /register?onboarding=true
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // ── 1. Guard: code must be present ────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // ── Build server-side Supabase client (manages session cookies) ───────────
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 2. Exchange PKCE code for Supabase session ─────────────────────────────
  const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    console.error('[auth/callback] exchangeCodeForSession failed:', exchangeError?.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const { user } = data;
  const email = (user.email ?? '').toLowerCase();

  // ── 3. Enforce campus email domain ────────────────────────────────────────
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    console.warn('[auth/callback] Rejected non-campus email:', email);
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`);
  }

  // ── 4. Check public.users (students, team leads, admins) ──────────────────
  // Query by id OR email to handle the OAuth identity-linking edge case where
  // Google creates a second auth UUID for an existing email/password account.
  const { data: studentProfile, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .or(`id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  if (usersError) {
    console.error('[auth/callback] public.users query error:', usersError.message);
  }

  if (studentProfile) {
    // Sync auth UUID into the profile row if it drifted due to OAuth identity linking.
    // This is a best-effort patch — failure is non-fatal; the user still gets routed.
    if (studentProfile.id !== user.id) {
      const { error: syncError } = await supabase
        .from('users')
        .update({ id: user.id })
        .eq('email', email);

      if (syncError) {
        console.error('[auth/callback] users id sync failed:', syncError.message);
      }
    }

    return NextResponse.redirect(`${origin}/dashboard/team`);
  }

  // ── 5. Check public.faculty_mentors ───────────────────────────────────────
  // Faculty mentors may be pre-provisioned in a separate table that exists in
  // the live Supabase project. Query defensively — if the table doesn't exist
  // the error is logged and we fall through to onboarding.
  const { data: mentorProfile, error: mentorsError } = await supabase
    .from('faculty_mentors')
    .select('id, email')
    .or(`id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  if (mentorsError) {
    // Table may not exist in all environments — log but don't hard-fail.
    console.error('[auth/callback] public.faculty_mentors query error:', mentorsError.message);
  }

  if (mentorProfile) {
    // Sync auth UUID into the mentor row if it drifted.
    if (mentorProfile.id !== user.id) {
      const { error: syncError } = await supabase
        .from('faculty_mentors')
        .update({ id: user.id })
        .eq('email', email);

      if (syncError) {
        console.error('[auth/callback] faculty_mentors id sync failed:', syncError.message);
      }
    }

    return NextResponse.redirect(`${origin}/dashboard/mentor`);
  }

  // ── 6. No matching profile found → send to onboarding ─────────────────────
  // Covers truly new users. The handle_new_user() trigger may have already
  // inserted a stub row in public.users; the onboarding form will fill in
  // roll_number / designation and make the profile fully usable.
  console.info('[auth/callback] No profile found for', email, '→ /register?onboarding=true');
  return NextResponse.redirect(`${origin}/register?onboarding=true`);
}
