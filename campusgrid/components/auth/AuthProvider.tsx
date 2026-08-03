'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { IS_SUPABASE_CONFIGURED } from '@/lib/supabase/fallback';
import type { AuthContextType, User } from '@/types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isConfigured: false,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  /**
   * Fetches the user's profile.
   *
   * Resolution order:
   *   1. public.users  — by auth uid  (primary, covers all roles)
   *   2. public.users  — by email     (handles linked OAuth identities)
   *   3. public.faculty_mentors — by id (legacy / separate-table faculty)
   *      → synthesises a User-shaped object with role = 'faculty'
   */
  const fetchProfile = useCallback(
    async (userId: string, userEmail?: string, attempt = 1): Promise<User | null> => {
      if (!supabase) return null;

      // 1. Primary lookup for Faculty Mentors: public.faculty_mentors
      try {
        const { data: mentorRow } = await supabase
          .from('faculty_mentors')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const mentorByEmail = !mentorRow && userEmail ? (
          await supabase
            .from('faculty_mentors')
            .select('*')
            .eq('email', userEmail.toLowerCase())
            .maybeSingle()
        ).data : null;

        const activeMentor = mentorRow || mentorByEmail;

        if (activeMentor) {
          const userObj: User = {
            id: activeMentor.id,
            email: activeMentor.email ?? userEmail ?? '',
            full_name: activeMentor.full_name ?? null,
            roll_number: null,
            skills: [],
            role: 'faculty' as const,
            designation: activeMentor.designation ?? null,
            department: activeMentor.department ?? null,
            contact_number: activeMentor.contact_number ?? null,
            sih_themes: activeMentor.sih_themes ?? activeMentor.areas_of_expertise ?? [],
            created_at: activeMentor.created_at,
          };
          setProfile(userObj);
          return userObj;
        }
      } catch {
        // faculty_mentors table check optional fallback
      }

      // 2. Primary lookup for Students / Admins: public.users
      const { data: profileById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileById) {
        setProfile(profileById as User);
        return profileById as User;
      }

      // 3. Fallback by email in public.users
      if (userEmail) {
        const { data: profileByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail.toLowerCase())
          .maybeSingle();

        if (profileByEmail) {
          setProfile(profileByEmail as User);
          return profileByEmail as User;
        }
      }

      // Retry once after 350ms if profile row hasn't completed inserting during fast registration
      if (attempt < 2) {
        await new Promise((res) => setTimeout(res, 350));
        return fetchProfile(userId, userEmail, attempt + 1);
      }

      setProfile(null);
      return null;
    },
    [supabase]
  );

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    if (!user) return null;
    return await fetchProfile(user.id, user.email);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Resolve existing session on mount (covers returning OAuth redirects)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    // Keep state in sync with auth events (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, session, isConfigured: IS_SUPABASE_CONFIGURED, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
