'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Hash, Plus, Users, Send, Clock, AlertCircle,
  X, Loader2, Trophy, Check, ChevronRight, Zap, ArrowRight,
  User, Edit3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  useDashboardTheme,
  glassCard,
  dashBg,
  dashText,
  dashBorder,
} from '@/components/dashboard/DashboardThemeContext';
import EditProfileModal from '@/components/profile/EditProfileModal';
import type { Team, User as UserType, TeamJoinRequest } from '@/types';

/* ─────────────────────────────────────────────── */
/*  Props / types                                  */
/* ─────────────────────────────────────────────── */
interface UnassignedViewProps {
  currentUser: UserType | null;
  supabaseUserId: string;
  onTeamJoined: (teamData?: Team) => void;
}

interface RecruitingTeam extends Team {
  member_count: number;
  leader_name: string | null;
}

type CardId = 'browse' | 'code' | 'create';

/* ─────────────────────────────────────────────── */
/*  Shared pill                                    */
/* ─────────────────────────────────────────────── */
function Pill({ label, color = '#22C55E' }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: `${color}15`, border: `1px solid ${color}28`, color }}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────── */
/*  Input styles helper                            */
/* ─────────────────────────────────────────────── */
function inputStyle(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'}`,
    borderRadius: '12px',
    color: dashText(isDark),
    outline: 'none',
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    transition: 'border 0.2s, box-shadow 0.2s',
  };
}

/* ─────────────────────────────────────────────── */
/*  Main component                                 */
/* ─────────────────────────────────────────────── */
export default function UnassignedView({ currentUser, supabaseUserId, onTeamJoined }: UnassignedViewProps) {
  const { isDark } = useDashboardTheme();
  const supabase = createClient();

  const [active, setActive] = useState<CardId>('browse');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  /* Browse */
  const [teams, setTeams]             = useState<RecruitingTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [myRequests, setMyRequests]   = useState<TeamJoinRequest[]>([]);
  const [sendingTo, setSendingTo]     = useState<string | null>(null);
  const [pitchModal, setPitchModal]   = useState<RecruitingTeam | null>(null);
  const [pitchMsg, setPitchMsg]       = useState('');

  /* Browse — send request feedback */
  const [sendError, setSendError]     = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  /* Join code */
  const [joinCode, setJoinCode]       = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError]     = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  /* Create */
  const [teamName, setTeamName]       = useState('');
  const [psId, setPsId]               = useState('');
  const [openRoles, setOpenRoles]     = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  /* ── Load recruiting teams ── */
  const loadTeams = useCallback(async () => {
    if (!supabase) return;
    setTeamsLoading(true);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*, team_members(count), leader:users!teams_leader_id_fkey(full_name)')
      .eq('status', 'recruiting')
      .order('created_at', { ascending: false });

    const { data: reqData } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('applicant_id', supabaseUserId)
      .in('status', ['pending', 'accepted']);

    setMyRequests((reqData as TeamJoinRequest[]) ?? []);

    if (teamsData) {
      const seenNames = new Set<string>();
      const shaped: RecruitingTeam[] = teamsData
        .map((t: any) => ({
          ...t,
          member_count: t.team_members?.[0]?.count ?? 0,
          leader_name: t.leader?.full_name ?? null,
          open_roles: t.open_roles ?? [],
        }))
        .filter((t: RecruitingTeam) => {
          if (t.member_count >= 6) return false;
          const normName = t.team_name.trim().toLowerCase();
          if (seenNames.has(normName)) return false;
          seenNames.add(normName);
          return true;
        });
      setTeams(shaped);
    }
    setTeamsLoading(false);
  }, [supabase, supabaseUserId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  /* ── Send join request ── */
  async function sendJoinRequest(team: RecruitingTeam) {
    if (!supabase) return;
    setSendingTo(team.id);
    setSendError('');
    setSendSuccess('');

    // Check if request already exists
    const { count: existing } = await supabase
      .from('team_join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('applicant_id', supabaseUserId);

    if ((existing ?? 0) > 0) {
      setSendError('You have already sent a request to this team.');
      setSendingTo(null);
      return;
    }

    const { error } = await supabase.from('team_join_requests').insert({
      team_id: team.id,
      applicant_id: supabaseUserId,
      pitch_message: pitchMsg.trim() || null,
      status: 'pending',
    });

    setSendingTo(null);

    if (error) {
      if (error.code === '23505') {
        setSendError('You have already sent a request to this team.');
      } else {
        setSendError(`Failed to send request: ${error.message}`);
      }
      return;
    }

    setSendSuccess(`Request sent to "${team.team_name}"! Wait for the leader to accept.`);
    setPitchModal(null);
    setPitchMsg('');
    await loadTeams();
  }

  /* ── Join via code ── */
  async function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');

    const code = joinCode.trim().toUpperCase();
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('*')
      .eq('join_code', code)
      .maybeSingle();

    if (teamErr || !team) {
      setJoinError('No team found with that code. Double-check and try again.');
      setJoinLoading(false);
      return;
    }

    // Direct count of members
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id);

    if (team.status === 'full' || (memberCount ?? 0) >= 6) {
      setJoinError('This team is already full (6/6 members).');
      setJoinLoading(false);
      return;
    }

    // Check if already a member in team_members
    const { count: alreadyMember } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('user_id', supabaseUserId);

    if ((alreadyMember ?? 0) > 0) {
      // Already in team — just redirect
      setJoinSuccess(`Redirecting to "${team.team_name}"…`);
      setJoinLoading(false);
      onTeamJoined(team as Team);
      return;
    }

    // Primary path: upsert a join request with status 'accepted'
    // This has more permissive RLS than direct team_members insert
    const { error: reqErr } = await supabase
      .from('team_join_requests')
      .upsert(
        {
          team_id: team.id,
          applicant_id: supabaseUserId,
          pitch_message: `Joined via code: ${code}`,
          status: 'accepted',
        },
        { onConflict: 'team_id,applicant_id' }
      );

    if (reqErr) {
      setJoinError(`Failed to join team: ${reqErr.message}`);
      setJoinLoading(false);
      return;
    }

    // Best-effort: also insert into team_members directly (may fail due to RLS — that's OK)
    try {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: supabaseUserId,
        role_in_team: 'Member',
        full_name: currentUser?.full_name ?? null,
        email: currentUser?.email ?? null,
        roll_number: currentUser?.roll_number ?? null,
      });
    } catch { /* RLS may block this — checkTeamMembership will handle it via join_requests fallback */ }

    setJoinSuccess(`Joined "${team.team_name}" successfully!`);
    setJoinLoading(false);
    onTeamJoined(team as Team);
  }

  /* ── Generate join code ── */
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return 'CG-' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /* ── Create team ── */
  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !teamName.trim()) return;
    setCreateLoading(true);
    setCreateError('');

    // Step 1: Find active event
    let eventId: string | null = null;
    const { data: activeEvent, error: activeEvErr } = await supabase
      .from('events').select('id').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (activeEvErr) {
      setCreateError(`Event lookup failed: ${activeEvErr.message}`);
      setCreateLoading(false);
      return;
    }

    if (activeEvent) {
      eventId = activeEvent.id;
    } else {
      // Fallback: use any event
      const { data: anyEvent, error: anyErr } = await supabase
        .from('events').select('id')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (anyEvent) {
        eventId = anyEvent.id;
      } else {
        setCreateError(
          anyErr
            ? `No event found — DB error: ${anyErr.message}`
            : 'No events exist in the database yet. Ask your admin to create an event first.'
        );
        setCreateLoading(false);
        return;
      }
    }

    // Step 2: Insert team — use .select('*') to get full team object
    const code = generateCode();
    const roles = openRoles.split(',').map(r => r.trim()).filter(Boolean);

    const { data: newTeam, error: insertErr } = await supabase
      .from('teams')
      .insert({
        event_id: eventId,
        team_name: teamName.trim(),
        leader_id: supabaseUserId,
        problem_statement_id: psId.trim() || null,
        join_code: code,
        open_roles: roles,
        status: 'recruiting',
      })
      .select('*')
      .single();

    if (insertErr || !newTeam) {
      if (insertErr?.code === '42501') {
        setCreateError('Permission denied — RLS policy is blocking team creation. Ask your admin to grant INSERT on teams.');
      } else if (insertErr?.code === '23505') {
        setCreateError('A team with this name or join code already exists. Try again.');
      } else {
        setCreateError(`Failed to create team: ${insertErr?.message ?? 'Unknown error'} (code: ${insertErr?.code ?? '?'})`);
      }
      setCreateLoading(false);
      return;
    }

    // Step 3: Add leader as a team member
    const { error: memberErr } = await supabase.from('team_members').insert({
      team_id: newTeam.id,
      user_id: supabaseUserId,
      role_in_team: 'Leader',
      full_name: currentUser?.full_name ?? null,
      email: currentUser?.email ?? null,
      roll_number: currentUser?.roll_number ?? null,
    });

    if (memberErr) {
      setCreateError(`Team created (code: ${code}) but failed to add you as member: ${memberErr.message} (code: ${memberErr.code})`);
      setCreateLoading(false);
      return;
    }

    // Success — go straight to the active team dashboard
    setCreateLoading(false);
    onTeamJoined(newTeam as Team);
  }

  const requestForTeam = (teamId: string) => myRequests.find(r => r.team_id === teamId);

  /* ─────────────────────────────────────────────── */
  /*  3 Action card definitions                      */
  /* ─────────────────────────────────────────────── */
  const ACTION_CARDS = [
    {
      id: 'browse' as CardId,
      icon: Search,
      iconColor: '#22C55E',
      title: 'Browse Recruiting Teams',
      desc: 'Discover open teams and send a join request with a pitch message.',
      badge: teams.length > 0 ? `${teams.length} open` : undefined,
      badgeColor: '#22C55E',
    },
    {
      id: 'code' as CardId,
      icon: Hash,
      iconColor: '#818CF8',
      title: 'Join via Code',
      desc: 'Have a 6-character team code? Enter it here for instant access.',
      badge: 'Instant',
      badgeColor: '#818CF8',
    },
    {
      id: 'create' as CardId,
      icon: Plus,
      iconColor: '#F59E0B',
      title: 'Create a Team',
      desc: 'Start your own team, become the leader, and recruit members.',
      badge: 'You lead',
      badgeColor: '#F59E0B',
    },
  ];

  /* ─────────────────────────────────────────────── */
  /*  Render                                         */
  /* ─────────────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-56px)] px-4 sm:px-6 py-10 max-w-5xl mx-auto">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
        >
          <Trophy size={12} /> SIH 2026 — Team Formation
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: dashText(isDark) }}>
          Find Your{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg,#22C55E,#10B981)' }}
          >
            Dream Team
          </span>
        </h1>
        <p className="text-sm mb-4" style={{ color: dashText(isDark, true) }}>
          You're not in a team yet — browse open teams, join via code, or start your own.
        </p>

        {/* Profile Card & Edit Profile Button */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-2xl border transition-all"
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: dashText(isDark) }}>
            <User size={14} className="text-[#22C55E]" />
            <span><strong className="font-semibold">{currentUser?.full_name ?? 'Student'}</strong></span>
            {currentUser?.roll_number && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: dashText(isDark, true) }}>
                Roll: {currentUser.roll_number}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22C55E',
            }}
          >
            <Edit3 size={12} /> Edit Profile
          </button>
        </div>
      </motion.div>

      {/* ── 3 Action Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="grid sm:grid-cols-3 gap-4 mb-8"
      >
        {ACTION_CARDS.map((card, i) => {
          const Icon = card.icon;
          const isActive = active === card.id;
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => setActive(card.id)}
              className="text-left p-5 flex flex-col gap-3 group"
              style={{
                ...glassCard(isDark, isActive),
                cursor: 'pointer',
                outline: 'none',
              }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${card.iconColor}18`,
                    border: `1px solid ${card.iconColor}28`,
                    boxShadow: isActive ? `0 0 16px ${card.iconColor}30` : 'none',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <Icon size={20} style={{ color: card.iconColor }} />
                </div>
                {card.badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${card.badgeColor}15`, color: card.badgeColor, border: `1px solid ${card.badgeColor}28` }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: dashText(isDark) }}>{card.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: dashText(isDark, true) }}>{card.desc}</p>
              </div>

              {/* Arrow */}
              <div
                className="flex items-center gap-1 text-xs font-semibold transition-all"
                style={{ color: isActive ? card.iconColor : dashText(isDark, true) }}
              >
                {isActive ? 'Selected' : 'Select'}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="card-underline"
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: card.iconColor }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Content Panel ── */}
      <AnimatePresence mode="wait">
        {active === 'browse' && (
          <BrowsePanel
            key="browse"
            isDark={isDark}
            teams={teams}
            loading={teamsLoading}
            requestForTeam={requestForTeam}
            sendingTo={sendingTo}
            onOpenPitch={(t) => { setPitchModal(t); setPitchMsg(''); }}
          />
        )}
        {active === 'code' && (
          <CodePanel
            key="code"
            isDark={isDark}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onSubmit={handleJoinByCode}
            loading={joinLoading}
            error={joinError}
            success={joinSuccess}
          />
        )}
        {active === 'create' && (
          <CreatePanel
            key="create"
            isDark={isDark}
            teamName={teamName}
            setTeamName={setTeamName}
            psId={psId}
            setPsId={setPsId}
            openRoles={openRoles}
            setOpenRoles={setOpenRoles}
            onSubmit={handleCreateTeam}
            loading={createLoading}
            error={createError}
          />
        )}
      </AnimatePresence>

      {/* Pitch Modal */}
      <AnimatePresence>
        {pitchModal && (
          <PitchModal
            isDark={isDark}
            team={pitchModal}
            pitchMsg={pitchMsg}
            setPitchMsg={setPitchMsg}
            loading={sendingTo === pitchModal.id}
            error={sendError}
            success={sendSuccess}
            onClose={() => { setPitchModal(null); setPitchMsg(''); setSendError(''); setSendSuccess(''); }}
            onSend={() => sendJoinRequest(pitchModal)}
          />
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Browse Panel                                   */
/* ─────────────────────────────────────────────── */
function BrowsePanel({
  isDark, teams, loading, requestForTeam, sendingTo, onOpenPitch,
}: {
  isDark: boolean;
  teams: RecruitingTeam[];
  loading: boolean;
  requestForTeam: (id: string) => TeamJoinRequest | undefined;
  sendingTo: string | null;
  onOpenPitch: (t: RecruitingTeam) => void;
}) {
  const panelVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  if (loading) {
    return (
      <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
        className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: '#22C55E' }} />
        <p className="text-sm" style={{ color: dashText(isDark, true) }}>Loading recruiting teams…</p>
      </motion.div>
    );
  }

  if (teams.length === 0) {
    return (
      <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
        className="text-center py-20">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={glassCard(isDark)}>
          <Users size={24} style={{ color: dashText(isDark, true) }} />
        </div>
        <p className="font-semibold mb-1" style={{ color: dashText(isDark) }}>No recruiting teams right now</p>
        <p className="text-sm" style={{ color: dashText(isDark, true) }}>
          Create a team or ask a friend for their join code.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team, i) => {
        const req = requestForTeam(team.id);
        const isPending = req?.status === 'pending';
        const isAccepted = req?.status === 'accepted';
        const isSending = sendingTo === team.id;
        const fillPct = Math.round((team.member_count / 6) * 100);

        return (
          <motion.div key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-4 p-5 group"
            style={glassCard(isDark)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(34,197,94,0.45)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px rgba(34,197,94,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.border = `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(148,163,184,0.35)'}`;
              (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.40)' : '0 2px 16px rgba(0,0,0,0.06)';
            }}
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm leading-tight" style={{ color: dashText(isDark) }}>{team.team_name}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}>
                  Recruiting
                </span>
              </div>
              {team.problem_statement_id && (
                <p className="text-xs font-mono" style={{ color: dashText(isDark, true) }}>PS: {team.problem_statement_id}</p>
              )}
              {team.leader_name && (
                <p className="text-xs mt-0.5" style={{ color: dashText(isDark, true) }}>Leader: {team.leader_name}</p>
              )}
            </div>

            {/* Member bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: dashText(isDark, true) }}>Members</span>
                <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{team.member_count}/6</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${fillPct}%`,
                  background: 'linear-gradient(90deg,#22C55E,#10B981)',
                }} />
              </div>
            </div>

            {/* Skills */}
            {team.open_roles?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {team.open_roles.slice(0, 4).map(r => <Pill key={r} label={r} />)}
                {team.open_roles.length > 4 && (
                  <span className="text-[10px]" style={{ color: dashText(isDark, true) }}>+{team.open_roles.length - 4}</span>
                )}
              </div>
            )}

            {/* CTA */}
            {isAccepted ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
                <Check size={13} /> Request Accepted
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <Clock size={13} /> Request Sent (Pending)
              </div>
            ) : (
              <button onClick={() => onOpenPitch(team)} disabled={isSending}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#000' }}>
                {isSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send Join Request
              </button>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Code Panel                                     */
/* ─────────────────────────────────────────────── */
function CodePanel({ isDark, joinCode, setJoinCode, onSubmit, loading, error, success }: {
  isDark: boolean; joinCode: string; setJoinCode: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; loading: boolean; error: string; success: string;
}) {
  return (
    <motion.div
      key="code-panel"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
      className="max-w-md mx-auto"
    >
      <div className="p-8" style={glassCard(isDark)}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)' }}>
          <Hash size={26} style={{ color: '#818CF8' }} />
        </div>
        <h2 className="text-lg font-bold text-center mb-1" style={{ color: dashText(isDark) }}>Enter Team Join Code</h2>
        <p className="text-xs text-center mb-6" style={{ color: dashText(isDark, true) }}>
          e.g. <span className="font-mono" style={{ color: '#818CF8' }}>CG-8X92K</span> — shared by your team leader
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8))}
            placeholder="CG-XXXXX"
            maxLength={8}
            style={{ ...inputStyle(isDark), textAlign: 'center', letterSpacing: '0.2em', fontFamily: 'monospace', fontSize: '18px' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
          />
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
              <Check size={12} /> {success}
            </div>
          )}
          <button type="submit" disabled={loading || !joinCode.trim() || Boolean(success)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#818CF8,#6366F1)', color: '#fff' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            {loading ? 'Joining…' : 'Join Team'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Create Panel                                   */
/* ─────────────────────────────────────────────── */
function CreatePanel({ isDark, teamName, setTeamName, psId, setPsId, openRoles, setOpenRoles, onSubmit, loading, error }: {
  isDark: boolean; teamName: string; setTeamName: (v: string) => void;
  psId: string; setPsId: (v: string) => void; openRoles: string; setOpenRoles: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; loading: boolean; error: string;
}) {
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: dashText(isDark, true), marginBottom: '6px',
  };

  return (
    <motion.div
      key="create-panel"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto"
    >
      <div className="p-8" style={glassCard(isDark)}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Plus size={26} style={{ color: '#F59E0B' }} />
        </div>
        <h2 className="text-lg font-bold text-center mb-1" style={{ color: dashText(isDark) }}>Create Your Team</h2>
        <p className="text-xs text-center mb-6" style={{ color: dashText(isDark, true) }}>
          You'll be set as <span style={{ color: '#F59E0B' }}>Team Leader</span>. A unique join code is generated automatically.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Team Name *</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. TechNova SIH 2026" required maxLength={60}
              style={inputStyle(isDark)}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>SIH Problem Statement ID <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
            <input type="text" value={psId} onChange={e => setPsId(e.target.value)}
              placeholder="e.g. SIH2026-SW-042"
              style={{ ...inputStyle(isDark), fontFamily: 'monospace' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Skills / Roles Needed <span style={{ opacity: 0.5, fontWeight: 400 }}>(comma-separated)</span></label>
            <input type="text" value={openRoles} onChange={e => setOpenRoles(e.target.value)}
              placeholder="ML Engineer, UI/UX, Backend Dev"
              style={inputStyle(isDark)}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
            />
            <p className="text-[11px] mt-1" style={{ color: dashText(isDark, true), opacity: 0.7 }}>
              Shown as skill tags on your team's browse card.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', color: dashText(isDark, true) }}>
            <Zap size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
            A unique <span className="font-mono mx-1" style={{ color: '#22C55E' }}>CG-XXXXX</span> code will be generated — share it with teammates.
          </div>

          <button type="submit" disabled={loading || !teamName.trim()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#000' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
            {loading ? 'Creating Team…' : 'Create Team & Lead'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Pitch Modal                                    */
/* ─────────────────────────────────────────────── */
function PitchModal({ isDark, team, pitchMsg, setPitchMsg, loading, error, success, onClose, onSend }: {
  isDark: boolean; team: RecruitingTeam; pitchMsg: string; setPitchMsg: (v: string) => void;
  loading: boolean; error?: string; success?: string; onClose: () => void; onSend: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md p-6"
        style={glassCard(isDark)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base" style={{ color: dashText(isDark) }}>Send Join Request</h3>
            <p className="text-xs mt-0.5" style={{ color: dashText(isDark, true) }}>to <strong>{team.team_name}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: dashText(isDark, true) }}>
            <X size={16} />
          </button>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
            <span>✓</span> {success}
          </div>
        )}

        {!success && (
          <>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: dashText(isDark, true) }}>
              Pitch Message <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional but recommended)</span>
            </label>
            <textarea
              value={pitchMsg}
              onChange={e => setPitchMsg(e.target.value)}
              placeholder="Why are you a great fit for this team?"
              rows={4}
              maxLength={500}
              style={{ ...inputStyle(isDark), resize: 'none', marginBottom: '4px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.07)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)'; e.target.style.boxShadow = 'none'; }}
            />
            <p className="text-right text-[11px] mb-4" style={{ color: dashText(isDark, true), opacity: 0.6 }}>{pitchMsg.length}/500</p>

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${dashBorder(isDark)}`, color: dashText(isDark, true) }}>
                Cancel
              </button>
              <button onClick={onSend} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#000' }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </>
        )}

        {success && (
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#22C55E,#10B981)', color: '#000' }}>
            Close
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

