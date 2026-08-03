'use client';

import Image from 'next/image';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, BarChart3, Settings, LogOut, ChevronRight,
  Search, RefreshCw, Download, CheckCircle2, XCircle, Loader2,
  Trophy, BookOpen, Crown, UserCheck, AlertTriangle, Filter,
  Building2, Mail, Phone, ExternalLink, Trash2, Edit3, Lock, Sun, Moon, Home, Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import {
  DashboardThemeProvider,
  useDashboardTheme,
  glassCard,
  dashBg,
  dashText,
  dashBorder,
} from '@/components/dashboard/DashboardThemeContext';
import type { Team, User, MentorRequest } from '@/types';

/* ─────────────────────────────────────────────── */
/*  Interfaces                                     */
/* ─────────────────────────────────────────────── */

interface ExtendedTeam extends Team {
  leader_name?: string;
  leader_email?: string;
  leader_roll?: string;
  member_count?: number;
  mentor_name?: string;
}

/* ─────────────────────────────────────────────── */
/*  Inner Admin Dashboard                          */
/* ─────────────────────────────────────────────── */

function AdminDashboardInner() {
  const { user, profile, isLoading, signOut } = useAuth();
  const { isDark, toggle } = useDashboardTheme();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'users' | 'mentors' | 'settings'>('overview');
  const [fetchingData, setFetchingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamStatusFilter, setTeamStatusFilter] = useState<string>('all');

  // Data states
  const [teams, setTeams] = useState<ExtendedTeam[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<{ userId: string; role: string } | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Auth Route Guard ── */
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile && profile.role !== 'admin_spoc') {
      if (profile.role === 'faculty' || profile.role === 'faculty_mentor') {
        router.replace('/dashboard/mentor');
      } else {
        router.replace('/dashboard/team');
      }
    }
  }, [user, profile, isLoading, router]);

  /* ── Load All Data for SPOC ── */
  const loadData = useCallback(async () => {
    if (!supabase || !user) return;
    setFetchingData(true);

    try {
      // 1. Fetch all users from public.users AND public.faculty_mentors
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: mentorsData } = await supabase
        .from('faculty_mentors')
        .select('*')
        .order('created_at', { ascending: false });

      const shapedMentors: User[] = (mentorsData ?? []).map((m: any) => ({
        id: m.id,
        email: m.email,
        full_name: m.full_name,
        roll_number: null,
        skills: [],
        role: 'faculty' as const,
        designation: m.designation,
        department: m.department,
        contact_number: m.contact_number,
        sih_themes: m.sih_themes ?? m.areas_of_expertise ?? [],
        created_at: m.created_at,
      }));

      const mentorIds = new Set(shapedMentors.map((m) => m.id));
      const filteredUsers = (usersData ?? []).filter((u: any) => !mentorIds.has(u.id) && u.role !== 'faculty');
      const rawUsers = [...filteredUsers, ...shapedMentors];
      setUsersList(rawUsers);

      const userMap: Record<string, User> = {};
      rawUsers.forEach((u) => { userMap[u.id] = u; });

      // 2. Fetch all teams + member counts
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, team_members(count)')
        .order('created_at', { ascending: false });

      // 3. Fetch all mentor requests
      const { data: mReqData } = await supabase
        .from('mentor_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const mReqs = mReqData ?? [];
      setMentorRequests(mReqs);

      const acceptedMentorMap: Record<string, string> = {};
      mReqs.forEach((m: any) => {
        if (m.status === 'accepted') {
          const mentorUser = userMap[m.mentor_id];
          acceptedMentorMap[m.team_id] = mentorUser?.full_name ?? 'Assigned Mentor';
        }
      });

      if (teamsData) {
        const shaped: ExtendedTeam[] = teamsData.map((t: any) => {
          const leader = userMap[t.leader_id];
          const assignedMentorUser = t.assigned_mentor_id ? userMap[t.assigned_mentor_id] : null;

          return {
            ...t,
            leader_name: leader?.full_name ?? 'Team Leader',
            leader_email: leader?.email ?? '',
            leader_roll: leader?.roll_number ?? '',
            member_count: t.team_members?.[0]?.count ?? 1,
            mentor_name: assignedMentorUser?.full_name ?? acceptedMentorMap[t.id] ?? 'Unassigned',
          };
        });
        setTeams(shaped);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('Error loading SPOC data.', 'err');
    } finally {
      setFetchingData(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user && profile?.role === 'admin_spoc') {
      loadData();
    }
  }, [user, profile, loadData]);

  /* ── SPOC Actions ── */

  // 1. Update Team Status
  const handleUpdateTeamStatus = async (teamId: string, status: string) => {
    if (!supabase) return;
    setActionLoading(`team-status-${teamId}`);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status })
        .eq('id', teamId);

      if (error) {
        showToast(error.message, 'err');
      } else {
        showToast(`Team status updated to "${status}"!`);
        await loadData();
      }
    } catch {
      showToast('Failed to update team status.', 'err');
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Delete Team (SPOC Override)
  const handleDeleteTeam = async (teamId: string) => {
    if (!supabase) return;
    setActionLoading(`delete-team-${teamId}`);
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        showToast(error.message, 'err');
      } else {
        showToast('Team removed from portal.');
        setDeletingTeamId(null);
        await loadData();
      }
    } catch {
      showToast('Failed to delete team.', 'err');
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Update User Role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!supabase) return;
    setActionLoading(`user-role-${userId}`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        showToast(error.message, 'err');
      } else {
        showToast(`User role updated to "${newRole}"!`);
        setEditingUserRole(null);
        await loadData();
      }
    } catch {
      showToast('Failed to update user role.', 'err');
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Export CSV Report for SIH SPOC Official Submission
  const exportCSVReport = () => {
    if (teams.length === 0) {
      showToast('No teams data to export.', 'err');
      return;
    }

    const headers = [
      'Team ID',
      'Team Name',
      'Status',
      'Leader Name',
      'Leader Email',
      'Leader Roll No',
      'Member Count',
      'Assigned Mentor',
      'Problem Statement ID',
      'Created Date'
    ];

    const rows = teams.map((t) => [
      `"${t.id}"`,
      `"${t.team_name.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${(t.leader_name ?? '').replace(/"/g, '""')}"`,
      `"${t.leader_email ?? ''}"`,
      `"${t.leader_roll ?? ''}"`,
      t.member_count ?? 1,
      `"${(t.mentor_name ?? '').replace(/"/g, '""')}"`,
      `"${t.problem_statement_id ?? 'None'}"`,
      `"${t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GL_Bajaj_SIH2026_SPOC_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('SPOC official CSV report exported successfully!');
  };

  /* ── Computed Metrics ── */
  const studentCount = usersList.filter((u) => u.role === 'student').length;
  const facultyCount = usersList.filter((u) => u.role === 'faculty' || u.role === 'faculty_mentor').length;
  const spocCount = usersList.filter((u) => u.role === 'admin_spoc').length;
  const recruitingTeams = teams.filter((t) => t.status === 'recruiting').length;
  const fullTeams = teams.filter((t) => t.status === 'full').length;
  const submittedTeams = teams.filter((t) => t.status === 'submitted' || t.status === 'approved').length;
  const assignedMentorTeams = teams.filter((t) => t.mentor_name && t.mentor_name !== 'Unassigned').length;

  /* ── Filtered Datasets ── */
  const filteredTeams = teams.filter((t) => {
    if (teamStatusFilter !== 'all' && t.status !== teamStatusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(q) ||
      (t.leader_name ?? '').toLowerCase().includes(q) ||
      (t.leader_email ?? '').toLowerCase().includes(q) ||
      (t.leader_roll ?? '').toLowerCase().includes(q) ||
      (t.problem_statement_id ?? '').toLowerCase().includes(q)
    );
  });

  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.roll_number ?? '').toLowerCase().includes(q) ||
      (u.department ?? '').toLowerCase().includes(q)
    );
  });

  /* ── Loading Screen ── */
  if (isLoading || (user && !profile && fetchingData)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: dashBg(isDark) }}>
        <Loader2 size={36} className="animate-spin text-[#22C55E]" />
        <p className="text-sm font-medium" style={{ color: dashText(isDark, true) }}>Verifying SPOC Administrator Privileges…</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin_spoc') return null;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: dashBg(isDark), fontFamily: 'var(--font-inter), sans-serif' }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-xl"
            style={{
              background: toast.type === 'ok'
                ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.92)')
                : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.92)'),
              borderColor: toast.type === 'ok' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
              color: toast.type === 'ok' ? (isDark ? '#4ADE80' : '#FFFFFF') : (isDark ? '#F87171' : '#FFFFFF'),
            }}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }}
        />
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/*  Top Navbar                                     */}
      {/* ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 transition-colors duration-300"
        style={{
          background: isDark ? 'rgba(11,15,18,0.85)' : 'rgba(241,245,249,0.85)',
          borderBottom: `1px solid ${dashBorder(isDark)}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/GL-BAJAJ-LOGO-1.png"
            alt="GL Bajaj Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-widest uppercase text-[#22C55E]">CampusGrid</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                SPOC Control Center
              </span>
            </div>
            <p className="text-[11px]" style={{ color: dashText(isDark, true) }}>
              GL Bajaj Group of Institutions · SIH 2026 Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSVReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#000', boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export Official CSV</span>
          </button>

          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark, true) }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-85"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark) }}
          >
            <Home size={13} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-85"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────── */}
      {/*  Main Container                                 */}
      {/* ─────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8" style={glassCard(isDark, true)}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                  Single Point of Contact (SPOC)
                </span>
                <span className="text-xs" style={{ color: dashText(isDark, true) }}>Internal Nomination Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: dashText(isDark) }}>
                SIH 2026 Institutional Management Dashboard
              </h1>
              <p className="text-xs mt-1 max-w-xl leading-relaxed" style={{ color: dashText(isDark, true) }}>
                Full administrative oversight of student registrations, team formations, problem statement selection, and faculty mentor assignments across GL Bajaj.
              </p>
            </div>

            {/* Quick Stat Counter Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Teams', value: teams.length, color: '#22C55E' },
                { label: 'Students', value: studentCount, color: '#818CF8' },
                { label: 'Faculty Mentors', value: facultyCount, color: '#F59E0B' },
                { label: 'Mentored Teams', value: assignedMentorTeams, color: '#EC4899' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl min-w-[100px]"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}30` }}
                >
                  <span className="text-2xl font-black" style={{ color: s.color }}>{fetchingData ? '…' : s.value}</span>
                  <span className="text-[10px] font-bold" style={{ color: dashText(isDark, true) }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB CONTROLS & SEARCH BAR
        ══════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl flex-wrap gap-1" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${dashBorder(isDark)}` }}>
            {[
              { id: 'overview', label: '📊 Analytics Overview' },
              { id: 'teams', label: `🛡️ All Teams (${teams.length})` },
              { id: 'users', label: `👥 User Directory (${usersList.length})` },
              { id: 'mentors', label: `🎓 Mentorship Matrix` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: activeTab === tab.id ? (isDark ? 'rgba(34,197,94,0.18)' : '#FFFFFF') : 'transparent',
                  color: activeTab === tab.id ? (isDark ? '#4ADE80' : '#0F172A') : dashText(isDark, true),
                  border: activeTab === tab.id ? `1px solid ${isDark ? 'rgba(34,197,94,0.35)' : 'rgba(148,163,184,0.3)'}` : '1px solid transparent',
                  boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: dashText(isDark, true) }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams, students, or email…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark) }}
              />
            </div>
            <button
              onClick={loadData}
              disabled={fetchingData}
              className="p-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark) }}
            >
              <RefreshCw size={14} className={fetchingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB 1: OVERVIEW & ANALYTICS
        ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Breakdown Card */}
              <div className="p-6 rounded-3xl space-y-4" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: dashText(isDark) }}>
                  <Trophy size={16} className="text-[#22C55E]" /> Team Status Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Recruiting / Open Teams', count: recruitingTeams, color: '#3B82F6' },
                    { label: 'Full Teams (6 Members)', count: fullTeams, color: '#F59E0B' },
                    { label: 'Submitted / Approved Teams', count: submittedTeams, color: '#22C55E' },
                  ].map((st) => (
                    <div key={st.label} className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: dashBorder(isDark) }}>
                      <span style={{ color: dashText(isDark) }}>{st.label}</span>
                      <span className="font-black px-2.5 py-0.5 rounded-full text-xs" style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                        {st.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles Distribution */}
              <div className="p-6 rounded-3xl space-y-4" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: dashText(isDark) }}>
                  <Users size={16} className="text-[#818CF8]" /> Campus Directory Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Student Accounts', count: studentCount, color: '#818CF8' },
                    { label: 'Faculty Mentor Accounts', count: facultyCount, color: '#F59E0B' },
                    { label: 'SPOC Administrators', count: spocCount, color: '#22C55E' },
                  ].map((st) => (
                    <div key={st.label} className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: dashBorder(isDark) }}>
                      <span style={{ color: dashText(isDark) }}>{st.label}</span>
                      <span className="font-black px-2.5 py-0.5 rounded-full text-xs" style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                        {st.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-3xl space-y-4" style={glassCard(isDark)}>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: dashText(isDark) }}>
                  <Sparkles size={16} className="text-[#EC4899]" /> SPOC Quick Actions
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={exportCSVReport}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all hover:scale-[1.01]"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
                  >
                    <span className="flex items-center gap-2"><Download size={14} /> Download Official SIH CSV</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all hover:scale-[1.01]"
                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark) }}
                  >
                    <span className="flex items-center gap-2"><Shield size={14} /> Review Team Nominations</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 2: ALL TEAMS MANAGEMENT
        ══════════════════════════════════════════ */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: dashText(isDark, true) }}>Filter Status:</span>
              {['all', 'recruiting', 'full', 'submitted', 'approved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setTeamStatusFilter(st)}
                  className="px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all"
                  style={{
                    background: teamStatusFilter === st ? 'rgba(34,197,94,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    color: teamStatusFilter === st ? '#22C55E' : dashText(isDark, true),
                    border: `1px solid ${teamStatusFilter === st ? 'rgba(34,197,94,0.4)' : dashBorder(isDark)}`,
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Teams Table */}
            <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: dashBorder(isDark) }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: dashText(isDark, true) }}>
                    <th className="p-4 font-bold uppercase">Team Name</th>
                    <th className="p-4 font-bold uppercase">Leader Details</th>
                    <th className="p-4 font-bold uppercase">Members</th>
                    <th className="p-4 font-bold uppercase">Problem Statement</th>
                    <th className="p-4 font-bold uppercase">Assigned Mentor</th>
                    <th className="p-4 font-bold uppercase">Status</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: dashBorder(isDark) }}>
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-white/5 transition-colors" style={{ color: dashText(isDark) }}>
                      <td className="p-4 font-bold text-sm">
                        {team.team_name}
                        {team.join_code && <p className="text-[10px] font-mono text-[#818CF8]">Code: {team.join_code}</p>}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{team.leader_name}</p>
                        <p className="text-[11px] opacity-70">{team.leader_email}</p>
                      </td>
                      <td className="p-4 font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-white/10">{team.member_count}/6</span>
                      </td>
                      <td className="p-4">
                        {team.problem_statement_id ? (
                          <span className="font-mono text-[#22C55E] font-bold">PS: {team.problem_statement_id}</span>
                        ) : (
                          <span className="opacity-50 italic">None selected</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${team.mentor_name !== 'Unassigned' ? 'text-[#22C55E]' : 'opacity-50'}`}>
                          {team.mentor_name}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={team.status}
                          onChange={(e) => handleUpdateTeamStatus(team.id, e.target.value)}
                          disabled={actionLoading === `team-status-${team.id}`}
                          className="px-2.5 py-1 rounded-xl font-bold text-xs outline-none cursor-pointer"
                          style={{
                            background: team.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                            color: team.status === 'approved' ? '#22C55E' : '#F59E0B',
                            border: `1px solid ${dashBorder(isDark)}`,
                          }}
                        >
                          <option value="recruiting">recruiting</option>
                          <option value="full">full</option>
                          <option value="submitted">submitted</option>
                          <option value="approved">approved</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setDeletingTeamId(team.id)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 3: USERS DIRECTORY & ROLE MANAGEMENT
        ══════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: dashText(isDark, true) }}>Filter Role:</span>
              {['all', 'student', 'faculty', 'admin_spoc'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className="px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all"
                  style={{
                    background: roleFilter === r ? 'rgba(34,197,94,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                    color: roleFilter === r ? '#22C55E' : dashText(isDark, true),
                    border: `1px solid ${roleFilter === r ? 'rgba(34,197,94,0.4)' : dashBorder(isDark)}`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: dashBorder(isDark) }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: dashText(isDark, true) }}>
                    <th className="p-4 font-bold uppercase">Name</th>
                    <th className="p-4 font-bold uppercase">Email</th>
                    <th className="p-4 font-bold uppercase">Roll / Dept</th>
                    <th className="p-4 font-bold uppercase">Current Role</th>
                    <th className="p-4 font-bold uppercase text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: dashBorder(isDark) }}>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors" style={{ color: dashText(isDark) }}>
                      <td className="p-4 font-bold text-sm">{u.full_name ?? '—'}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4 font-mono text-xs">{u.roll_number ?? u.department ?? '—'}</td>
                      <td className="p-4">
                        <span
                          className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase"
                          style={{
                            background: u.role === 'admin_spoc' ? 'rgba(34,197,94,0.2)' : u.role === 'faculty' ? 'rgba(245,158,11,0.2)' : 'rgba(129,140,248,0.2)',
                            color: u.role === 'admin_spoc' ? '#22C55E' : u.role === 'faculty' ? '#F59E0B' : '#818CF8',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          disabled={actionLoading === `user-role-${u.id}`}
                          className="px-2.5 py-1 rounded-xl font-bold text-xs outline-none cursor-pointer"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark) }}
                        >
                          <option value="student">student</option>
                          <option value="faculty">faculty</option>
                          <option value="admin_spoc">admin_spoc</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 4: MENTORSHIP MATRIX
        ══════════════════════════════════════════ */}
        {activeTab === 'mentors' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>Mentorship Proposal Logs</h3>
            <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: dashBorder(isDark) }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: dashText(isDark, true) }}>
                    <th className="p-4 font-bold uppercase">Team ID</th>
                    <th className="p-4 font-bold uppercase">Mentor ID</th>
                    <th className="p-4 font-bold uppercase">Pitch Message</th>
                    <th className="p-4 font-bold uppercase">Status</th>
                    <th className="p-4 font-bold uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: dashBorder(isDark) }}>
                  {mentorRequests.map((mr: any) => (
                    <tr key={mr.id} className="hover:bg-white/5 transition-colors" style={{ color: dashText(isDark) }}>
                      <td className="p-4 font-mono text-[11px]">{mr.team_id}</td>
                      <td className="p-4 font-mono text-[11px]">{mr.mentor_id}</td>
                      <td className="p-4 italic">"{mr.pitch_message ?? 'No pitch text'}"</td>
                      <td className="p-4 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${mr.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {mr.status}
                        </span>
                      </td>
                      <td className="p-4 text-[11px]">{mr.created_at ? new Date(mr.created_at).toLocaleDateString('en-IN') : 'Recent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deletingTeamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl space-y-4" style={glassCard(isDark)}>
            <h3 className="text-base font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle size={18} /> Confirm Delete Team
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: dashText(isDark, true) }}>
              Are you sure you want to delete this team? All team member relationships and join requests associated with this team will be permanently removed.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingTeamId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border"
                style={{ borderColor: dashBorder(isDark), color: dashText(isDark) }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(deletingTeamId)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardThemeProvider>
      <AdminDashboardInner />
    </DashboardThemeProvider>
  );
}
