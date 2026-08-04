'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, LogOut, Home, Loader2, Sun, Moon, Edit3 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import {
  DashboardThemeProvider,
  useDashboardTheme,
  dashBg,
  dashBorder,
  dashText,
} from '@/components/dashboard/DashboardThemeContext';
import UnassignedView from '@/components/team/UnassignedView';
import ActiveTeamView from '@/components/team/ActiveTeamView';
import EditProfileModal from '@/components/profile/EditProfileModal';
import type { Team } from '@/types';

/* ─────────────────────────────────────────────── */
/*  Inner page (has access to DashboardTheme ctx)  */
/* ─────────────────────────────────────────────── */
function TeamDashboardInner() {
  const { user, profile, isLoading, signOut } = useAuth();
  const { isDark, toggle } = useDashboardTheme();
  const router = useRouter();
  const supabase = createClient();

  const [teamCheckDone, setTeamCheckDone] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isNavEditProfileOpen, setIsNavEditProfileOpen] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (profile?.role === 'faculty') {
        router.replace('/dashboard/mentor');
      } else if (profile?.role === 'admin_spoc') {
        router.replace('/admin');
      }
    }
  }, [user, profile, isLoading, router]);

  /* ── Team membership check ── */
  const checkTeamMembership = useCallback(async () => {
    if (!supabase || !user) return;
    setTeamCheckDone(false);

    try {
      // 1. Primary: check team_members table for user_id
      const { data: memberRows } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1);

      const teamId = memberRows?.[0]?.team_id;

      if (teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .maybeSingle();

        if (teamData) {
          setActiveTeam(teamData as any);
          setTeamCheckDone(true);
          return;
        }
      }

      // 2. Secondary: check team_join_requests where status = 'accepted'
      const { data: joinReqRow } = await supabase
        .from('team_join_requests')
        .select('team_id')
        .eq('applicant_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (joinReqRow?.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', joinReqRow.team_id)
          .maybeSingle();

        if (teamData) {
          // Auto-heal team_members in DB
          const { error: healErr } = await supabase.from('team_members').upsert(
            {
              team_id: joinReqRow.team_id,
              user_id: user.id,
              role_in_team: 'Member',
              full_name: profile?.full_name ?? null,
              email: profile?.email ?? null,
              roll_number: profile?.roll_number ?? null,
            },
            { onConflict: 'team_id,user_id' }
          );

          if (healErr) {
            console.error('[checkTeamMembership] Auto-heal member error:', healErr.message);
          }

          setActiveTeam(teamData as any);
          setTeamCheckDone(true);
          return;
        }
      }

      // 3. Fallback: check if this user is a team leader
      const { data: leadTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('leader_id', user.id)
        .in('status', ['recruiting', 'full', 'submitted', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadTeam) {
        // Verify user is actually still present in team_members or newly created
        const { count: tmCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', leadTeam.id)
          .eq('user_id', user.id);

        // Only auto-heal if user hasn't abandoned/left the team
        if ((tmCount ?? 0) > 0) {
          const { error: healLeaderErr } = await supabase.from('team_members').upsert(
            {
              team_id: leadTeam.id,
              user_id: user.id,
              role_in_team: 'Team Leader',
              full_name: profile?.full_name ?? null,
              email: profile?.email ?? null,
              roll_number: profile?.roll_number ?? null,
            },
            { onConflict: 'team_id,user_id' }
          );

          if (healLeaderErr) {
            console.error('[checkTeamMembership] Auto-heal leader error:', healLeaderErr.message);
          }

          setActiveTeam(leadTeam as any);
          setTeamCheckDone(true);
          return;
        }
      }

      setActiveTeam(null);
      setTeamCheckDone(true);
    } catch (err) {
      console.error('Error checking team membership:', err);
      setActiveTeam(null);
      setTeamCheckDone(true);
    }
  }, [supabase, user, profile]);

  useEffect(() => {
    if (!isLoading && user && profile?.role === 'student') {
      checkTeamMembership();
    }
  }, [isLoading, user, profile, checkTeamMembership]);

  /* ── Loading screen ── */
  if (isLoading || !profile || !teamCheckDone) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 transition-colors duration-300"
        style={{ background: dashBg(isDark) }}
      >
        {/* Glow orb */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <Loader2 size={32} className="animate-spin relative z-10" style={{ color: '#22C55E' }} />
        <p className="text-sm relative z-10" style={{ color: dashText(isDark, true) }}>
          {isLoading ? 'Verifying session…' : 'Checking team membership…'}
        </p>
      </div>
    );
  }

  /* ─────────────────────────────────────────────── */
  /*  Sticky top nav                                 */
  /* ─────────────────────────────────────────────── */
  const navBg = isDark
    ? 'rgba(11,15,18,0.80)'
    : 'rgba(241,245,249,0.80)';

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: dashBg(isDark),
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <div
          className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 65%)',
            filter: 'blur(48px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)',
            filter: 'blur(48px)',
          }}
        />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-3.5 transition-colors duration-300"
        style={{
          background: isDark ? 'rgba(11,15,18,0.85)' : 'rgba(241,245,249,0.85)',
          borderBottom: `1px solid ${dashBorder(isDark)}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Left: logo + student info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/GL-BAJAJ-LOGO-1.png"
            alt="GL Bajaj Logo"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest uppercase text-[#22C55E] truncate">
                CampusGrid
              </span>
              <span
                className="hidden xs:inline-block text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.10)',
                  color: '#22C55E',
                  border: '1px solid rgba(34,197,94,0.25)',
                }}
              >
                Student
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs" style={{ color: dashText(isDark, true) }}>
              {profile?.full_name ?? 'Student'}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Edit Profile button */}
          <button
            onClick={() => setIsNavEditProfileOpen(true)}
            title="Edit Profile"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22C55E',
            }}
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${dashBorder(isDark)}`,
              color: dashText(isDark, true),
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Home Link */}
          <Link
            href="/"
            title="Home"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-85"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${dashBorder(isDark)}`,
              color: dashText(isDark),
            }}
          >
            <Home size={14} />
            <span className="hidden md:inline">Home</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={signOut}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all hover:opacity-85"
            style={{
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
            }}
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main view */}
      <div className="relative z-10">
        {activeTeam ? (
          <ActiveTeamView
            currentUser={profile}
            supabaseUserId={user!.id}
            team={activeTeam}
            onTeamLeft={checkTeamMembership}
          />
        ) : (
          <UnassignedView
            currentUser={profile}
            supabaseUserId={user!.id}
            onTeamJoined={(teamData) => {
              if (teamData) {
                setActiveTeam(teamData as any);
                setTeamCheckDone(true);
              }
              checkTeamMembership();
            }}
          />
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isNavEditProfileOpen}
        onClose={() => setIsNavEditProfileOpen(false)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Exported page — wraps with DashboardThemeProvider */
/* ─────────────────────────────────────────────── */
export default function TeamDashboardPage() {
  return (
    <DashboardThemeProvider>
      <TeamDashboardInner />
    </DashboardThemeProvider>
  );
}
