'use client';

import Image from 'next/image';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Phone, Mail, LogOut, Check, X,
  ChevronRight, Loader2, Tag, MapPin, Inbox, CheckCircle2,
  RefreshCw, Star, UserCircle2, Clock, Home, Sun, Moon,
  Search, MessageSquare, ShieldCheck, Sparkles, AlertCircle, XCircle,
  Award, Quote, ArrowUpRight
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
import type { MentorRequestWithTeam } from '@/types';

/* ─────────────────────────────────────────────── */
/*  Helper components                              */
/* ─────────────────────────────────────────────── */

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
  const map: Record<string, { bg: string; border: string; color: string; label: string }> = {
    pending: {
      bg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(245, 158, 11, 0.4)',
      color: '#F59E0B',
      label: 'Pending Pitch',
    },
    accepted: {
      bg: isDark ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 197, 94, 0.14)',
      border: 'rgba(34, 197, 94, 0.4)',
      color: '#22C55E',
      label: 'Mentorship Active ✓',
    },
    rejected: {
      bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(239, 68, 68, 0.4)',
      color: '#EF4444',
      label: 'Declined',
    },
  };

  const s = map[status] ?? map['pending'];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wide shrink-0 shadow-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────── */
/*  Inner Mentor Dashboard                         */
/* ─────────────────────────────────────────────── */

function MentorDashboardInner() {
  const { user, profile, isLoading, signOut } = useAuth();
  const { isDark, toggle } = useDashboardTheme();
  const router = useRouter();

  // Memoize Supabase browser client to prevent re-creation on every render
  const supabase = useMemo(() => createClient(), []);

  const [requests, setRequests] = useState<MentorRequestWithTeam[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

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

    if (profile && profile.role !== 'faculty' && profile.role !== 'faculty_mentor') {
      if (profile.role === 'admin_spoc') router.replace('/admin');
      else router.replace('/dashboard/team');
    }
  }, [user, profile, isLoading, router]);

  /* ── Fetch Data (Stable Callback) ── */
  const loadData = useCallback(async (isInitial = false) => {
    if (!supabase || !user) {
      setFetchingData(false);
      return;
    }

    if (isInitial) {
      setFetchingData(true);
    }

    try {
      const { data, error } = await supabase
        .from('mentor_requests')
        .select(`
          *,
          team:teams (
            id,
            team_name,
            problem_statement_id,
            status,
            leader:users!teams_leader_id_fkey (
              id,
              full_name,
              email,
              contact_number,
              roll_number
            )
          )
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('mentor_requests query:', error.message);
        setRequests([]);
      } else {
        setRequests((data ?? []) as MentorRequestWithTeam[]);
      }
    } catch (err) {
      console.error('Error fetching mentor requests:', err);
    } finally {
      setFetchingData(false);
    }
  }, [supabase, user]);

  // Initial load
  useEffect(() => {
    if (user && !isLoading) {
      loadData(true);
    }
  }, [user, isLoading, loadData]);

  /* ── Real-Time WebSocket Subscription + Polling (No Re-render Loops) ── */
  useEffect(() => {
    if (!supabase || !user) return;

    const channelId = `mentor-requests-${user.id}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_requests', filter: `mentor_id=eq.${user.id}` },
        () => {
          loadData(false);
        }
      )
      .subscribe();

    const poll = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [supabase, user, loadData]);

  /* ── Accept / Reject Handler ── */
  const updateRequest = async (requestId: string, teamName: string, status: 'accepted' | 'rejected') => {
    if (!supabase || !user) return;
    setActionLoading(requestId);
    try {
      // 1. Update status on mentor_requests
      const { data: reqData, error } = await supabase
        .from('mentor_requests')
        .update({ status })
        .eq('id', requestId)
        .select('team_id')
        .single();

      if (error) {
        showToast(error.message, 'err');
      } else {
        // 2. If accepted, also set assigned_mentor_id on teams table for all team members
        if (status === 'accepted' && reqData?.team_id) {
          await supabase
            .from('teams')
            .update({ assigned_mentor_id: user.id })
            .eq('id', reqData.team_id);
        }

        showToast(
          status === 'accepted'
            ? `Mentorship request for "${teamName}" accepted!`
            : `Request for "${teamName}" declined.`
        );
        await loadData(false);
      }
    } catch {
      showToast('Action failed. Try again.', 'err');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Loading Screen ── */
  if (isLoading || (user && !profile && fetchingData)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 transition-colors duration-300 px-4"
        style={{ background: dashBg(isDark) }}
      >
        <div
          className="w-96 h-96 rounded-full pointer-events-none absolute"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <Loader2 size={36} className="animate-spin relative z-10 text-[#22C55E]" />
        <p className="text-sm font-medium relative z-10 text-center" style={{ color: dashText(isDark, true) }}>
          Verifying faculty credentials…
        </p>
      </div>
    );
  }

  /* ── Fallback if profile not found ── */
  if (user && !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300"
        style={{ background: dashBg(isDark) }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-6 sm:p-8 text-center"
          style={{
            background: isDark ? 'rgba(248,113,113,0.06)' : 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <AlertCircle size={28} className="text-[#EF4444]" />
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: dashText(isDark) }}>
            Faculty Profile Not Found
          </h2>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: dashText(isDark, true) }}>
            Your account exists but the faculty profile was not initialized with role <code>faculty</code>.
          </p>
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            <LogOut size={15} /> Sign Out & Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  /* ── Stats ── */
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedTeams = requests.filter((r) => r.status === 'accepted');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const initials = (profile.full_name ?? 'FM')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  /* ── Filtered Requests by Tab & Search ── */
  const displayedRequests = requests.filter((r) => {
    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (activeTab === 'accepted' && r.status !== 'accepted') return false;
    if (activeTab === 'history' && r.status === 'pending') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const tName = r.team?.team_name?.toLowerCase() ?? '';
    const lName = r.team?.leader?.full_name?.toLowerCase() ?? '';
    const ps = r.team?.problem_statement_id?.toLowerCase() ?? '';
    return tName.includes(q) || lName.includes(q) || ps.includes(q);
  });

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: dashBg(isDark),
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-auto z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-center sm:justify-start gap-2.5 text-xs font-bold border backdrop-blur-xl"
            style={{
              background: toast.type === 'ok'
                ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.92)')
                : (isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.92)'),
              borderColor: toast.type === 'ok' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
              color: toast.type === 'ok' ? (isDark ? '#4ADE80' : '#FFFFFF') : (isDark ? '#F87171' : '#FFFFFF'),
            }}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#22C55E' : '#10B981'} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        <div
          className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/*  Top Navbar                                     */}
      {/* ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-3.5 transition-colors duration-300"
        style={{
          background: isDark ? 'rgba(11,15,18,0.85)' : 'rgba(241,245,249,0.85)',
          borderBottom: `1px solid ${dashBorder(isDark)}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Left branding */}
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
                Faculty
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs" style={{ color: dashText(isDark, true) }}>
              {profile.full_name ?? 'Faculty Mentor'}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
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

          <Link
            href="/"
            title="Home"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-85 active:scale-95"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${dashBorder(isDark)}`,
              color: dashText(isDark),
            }}
          >
            <Home size={14} />
            <span className="hidden md:inline">Home</span>
          </Link>

          <button
            onClick={signOut}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all hover:opacity-85 active:scale-95"
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

      {/* ─────────────────────────────────────────────── */}
      {/*  Main Container                                 */}
      {/* ─────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* ══════════════════════════════════════════
            FACULTY PROFILE HEADER CARD (ALL DATA FULLY VISIBLE)
        ══════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 transition-all duration-300"
          style={glassCard(isDark, true)}
        >
          {/* Ambient glow accent */}
          <div
            className="absolute -top-20 -right-20 w-72 sm:w-80 h-72 sm:h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)',
              filter: 'blur(35px)',
            }}
          />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Top Row: Avatar + Main Title + Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Avatar + Main Info */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                {/* Avatar circle */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl font-black shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #10B981)',
                    color: '#000',
                    boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide uppercase shrink-0"
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#22C55E',
                      }}
                    >
                      <ShieldCheck size={12} /> Official Faculty Mentor
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium" style={{ color: dashText(isDark, true) }}>
                      SIH 2026 Campus Portal
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight" style={{ color: dashText(isDark) }}>
                    {profile.full_name ?? 'Faculty Mentor'}
                  </h1>

                  {profile.designation && (
                    <p className="text-xs sm:text-sm font-semibold text-[#22C55E] flex items-center gap-1.5 mt-0.5">
                      <Star size={13} className="shrink-0 text-[#22C55E]" />
                      {profile.designation} {profile.department ? `· ${profile.department}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stat Counter Boxes (3 in 1 row) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full md:w-auto">
                <div
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200"
                  style={{
                    background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.10)',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#F59E0B]">
                    {pendingRequests.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#F59E0B]">Pending</span>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200"
                  style={{
                    background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.25)',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#22C55E]">
                    {acceptedTeams.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#22C55E]">Accepted</span>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200"
                  style={{
                    background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.10)',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                >
                  <span className="text-xl sm:text-2xl font-black text-[#818CF8]">
                    {requests.length}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#818CF8]">Total</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Detailed Contact & Expertise Grid (FULLY VISIBLE ON ALL DEVICES) */}
            <div
              className="pt-4 border-t space-y-3"
              style={{ borderColor: dashBorder(isDark) }}
            >
              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {profile.department && (
                  <div
                    className="flex items-center gap-2 p-2.5 rounded-xl border"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: dashBorder(isDark),
                    }}
                  >
                    <MapPin size={14} className="text-[#22C55E] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-extrabold block text-[#22C55E]">Department</span>
                      <span className="font-semibold truncate block" style={{ color: dashText(isDark) }}>
                        {profile.department}
                      </span>
                    </div>
                  </div>
                )}

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl border hover:border-[#22C55E]/40 active:scale-95 transition-all"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: dashBorder(isDark),
                    }}
                  >
                    <Mail size={14} className="text-[#22C55E] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-extrabold block text-[#22C55E]">Email Address</span>
                      <span className="font-semibold truncate block" style={{ color: dashText(isDark) }}>
                        {profile.email}
                      </span>
                    </div>
                  </a>
                )}

                {profile.contact_number && (
                  <a
                    href={`tel:${profile.contact_number}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl border hover:border-[#22C55E]/40 active:scale-95 transition-all"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: dashBorder(isDark),
                    }}
                  >
                    <Phone size={14} className="text-[#22C55E] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-extrabold block text-[#22C55E]">Contact Phone</span>
                      <span className="font-semibold truncate block" style={{ color: dashText(isDark) }}>
                        {profile.contact_number}
                      </span>
                    </div>
                  </a>
                )}
              </div>

              {/* SIH Themes / Areas of Expertise */}
              {(profile.sih_themes ?? []).length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#22C55E] mr-1">
                    Areas of Expertise:
                  </span>
                  {(profile.sih_themes ?? []).map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide shadow-sm"
                      style={{
                        background: isDark ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.10)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#22C55E',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════
            CONTROLS: TABS + SEARCH + REFRESH
        ══════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Tabs */}
          <div
            className="flex p-1 rounded-xl sm:rounded-2xl overflow-x-auto no-scrollbar"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${dashBorder(isDark)}`,
            }}
          >
            {[
              { id: 'pending', label: 'Incoming', count: pendingRequests.length, color: '#F59E0B' },
              { id: 'accepted', label: 'Active Teams', count: acceptedTeams.length, color: '#22C55E' },
              { id: 'history', label: 'History', count: rejectedRequests.length, color: '#94A3B8' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: active
                      ? (isDark ? 'rgba(34,197,94,0.18)' : '#FFFFFF')
                      : 'transparent',
                    color: active ? (isDark ? '#4ADE80' : '#0F172A') : dashText(isDark, true),
                    border: active ? `1px solid ${isDark ? 'rgba(34,197,94,0.35)' : 'rgba(148,163,184,0.3)'}` : '1px solid transparent',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black"
                    style={{
                      background: active ? `${tab.color}25` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      color: active ? tab.color : dashText(isDark, true),
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: dashText(isDark, true) }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team or leader…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs transition-all outline-none"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  border: `1px solid ${dashBorder(isDark)}`,
                  color: dashText(isDark),
                }}
              />
            </div>

            <button
              onClick={() => loadData(false)}
              disabled={fetchingData}
              title="Refresh requests"
              className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                border: `1px solid ${dashBorder(isDark)}`,
                color: dashText(isDark),
              }}
            >
              <RefreshCw size={14} className={fetchingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            REQUESTS CONTENT GRID (MOBILE OPTIMIZED & AESTHETIC)
        ══════════════════════════════════════════ */}
        {fetchingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-[#22C55E]" />
            <p className="text-xs" style={{ color: dashText(isDark, true) }}>Loading mentorship data…</p>
          </div>
        ) : displayedRequests.length === 0 ? (
          /* Empty State */
          <div
            className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 rounded-2xl sm:rounded-3xl text-center transition-all duration-300"
            style={glassCard(isDark)}
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${dashBorder(isDark)}` }}
            >
              <Inbox size={26} style={{ color: dashText(isDark, true) }} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: dashText(isDark) }}>
              {activeTab === 'pending'
                ? 'No Pending Mentorship Requests'
                : activeTab === 'accepted'
                ? 'No Active Mentored Teams Yet'
                : 'No Mentorship Request History'}
            </h3>
            <p className="text-xs max-w-sm" style={{ color: dashText(isDark, true) }}>
              {activeTab === 'pending'
                ? 'When student teams request your guidance for SIH 2026, their pitch proposals will appear here in real-time.'
                : activeTab === 'accepted'
                ? 'Teams whose mentorship requests you accept will be listed here for active communication.'
                : 'Any declined or historic requests will be archived here for reference.'}
            </p>
          </div>
        ) : (
          /* Responsive Mentorship Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {displayedRequests.map((req) => {
              const teamName = req.team?.team_name ?? 'Unnamed Team';
              const leader = req.team?.leader;

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:border-[#22C55E]/40"
                  style={glassCard(isDark, req.status === 'accepted')}
                >
                  <div>
                    {/* Top Card Header Row */}
                    <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2.5 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg font-black flex-shrink-0 shadow-md transition-transform group-hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #22C55E, #10B981)',
                            color: '#000',
                            boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
                          }}
                        >
                          {teamName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-base sm:text-lg leading-snug truncate group-hover:text-[#22C55E] transition-colors" style={{ color: dashText(isDark) }}>
                            {teamName}
                          </h3>
                          {req.team?.problem_statement_id ? (
                            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/25 truncate max-w-full">
                              <BookOpen size={10} className="shrink-0" /> PS: {req.team.problem_statement_id}
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-[11px] block mt-0.5" style={{ color: dashText(isDark, true) }}>
                              Problem statement pending
                            </span>
                          )}
                        </div>
                      </div>

                      <StatusBadge status={req.status} isDark={isDark} />
                    </div>

                    {/* Pitch Proposal Glass Card */}
                    {req.pitch_message && (
                      <div
                        className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl mb-3.5 text-xs leading-relaxed relative border-l-4 border-[#22C55E]"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(0,0,0,0.25))'
                            : 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(255,255,255,0.75))',
                          borderColor: '#22C55E',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#22C55E] mb-1">
                          <Sparkles size={11} /> Pitch Statement
                        </div>
                        <p className="italic font-medium" style={{ color: dashText(isDark) }}>
                          "{req.pitch_message}"
                        </p>
                      </div>
                    )}

                    {/* Team Leader Info Box */}
                    <div
                      className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl space-y-2.5 mb-3.5 text-xs"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${dashBorder(isDark)}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#22C55E]">
                          Team Leader Contact
                        </p>
                        {leader?.roll_number && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#818CF8]/15 border border-[#818CF8]/30 text-[#818CF8]">
                            {leader.roll_number}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm" style={{ color: dashText(isDark) }}>
                        <UserCircle2 size={16} className="text-[#22C55E] shrink-0" />
                        <span className="truncate">{leader?.full_name ?? 'Team Leader'}</span>
                      </div>

                      {/* Contact Actions Row (Touch Friendly) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: dashBorder(isDark) }}>
                        {leader?.email && (
                          <a
                            href={`mailto:${leader.email}`}
                            className="flex items-center justify-center sm:justify-start gap-1.5 p-2 rounded-xl text-[11px] font-semibold transition-all hover:text-[#22C55E] active:scale-95"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${dashBorder(isDark)}`,
                              color: dashText(isDark, true),
                            }}
                          >
                            <Mail size={12} className="text-[#22C55E] shrink-0" />
                            <span className="truncate">{leader.email}</span>
                          </a>
                        )}
                        {leader?.contact_number && (
                          <a
                            href={`tel:${leader.contact_number}`}
                            className="flex items-center justify-center sm:justify-start gap-1.5 p-2 rounded-xl text-[11px] font-semibold transition-all hover:text-[#22C55E] active:scale-95"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${dashBorder(isDark)}`,
                              color: dashText(isDark, true),
                            }}
                          >
                            <Phone size={12} className="text-[#22C55E] shrink-0" />
                            <span>{leader.contact_number}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Footer & Actions */}
                  <div
                    className="pt-3.5 border-t flex flex-col xs:flex-row xs:items-center justify-between gap-3"
                    style={{ borderColor: dashBorder(isDark) }}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: dashText(isDark, true) }}>
                      <Clock size={11} />
                      Received {req.created_at
                        ? new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'Recently'}
                    </span>

                    {/* Action Buttons */}
                    {req.status === 'pending' ? (
                      <div className="flex items-center gap-2 w-full xs:w-auto">
                        <button
                          onClick={() => updateRequest(req.id, teamName, 'rejected')}
                          disabled={actionLoading === req.id}
                          className="flex-1 xs:flex-initial flex items-center justify-center gap-1 py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all hover:opacity-85 active:scale-95 disabled:opacity-50"
                          style={{
                            background: 'rgba(239,68,68,0.10)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#EF4444',
                          }}
                        >
                          {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Decline
                        </button>

                        <button
                          onClick={() => updateRequest(req.id, teamName, 'accepted')}
                          disabled={actionLoading === req.id}
                          className="flex-1 xs:flex-initial flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-md disabled:opacity-50"
                          style={{
                            background: 'linear-gradient(135deg, #22C55E, #10B981)',
                            color: '#000',
                            boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
                          }}
                        >
                          {actionLoading === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Accept Mentorship
                        </button>
                      </div>
                    ) : req.status === 'accepted' ? (
                      <div className="flex items-center gap-2 w-full xs:w-auto">
                        <a
                          href={`mailto:${leader?.email}`}
                          className="w-full xs:w-auto flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold text-[#22C55E] transition-all hover:opacity-80 active:scale-95"
                          style={{
                            background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.25)',
                          }}
                        >
                          <Mail size={12} /> Contact Leader <ArrowUpRight size={12} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs italic" style={{ color: dashText(isDark, true) }}>
                        Request closed
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <footer className="pt-6 border-t text-center text-xs" style={{ borderColor: dashBorder(isDark), color: dashText(isDark, true) }}>
          © 2026 GL Bajaj Group of Institutions · SIH 2026 Faculty Mentorship Workspace
        </footer>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Exported Page — Wraps with Theme Provider      */
/* ─────────────────────────────────────────────── */

export default function MentorDashboardPage() {
  return (
    <DashboardThemeProvider>
      <MentorDashboardInner />
    </DashboardThemeProvider>
  );
}
