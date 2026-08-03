'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Copy, Share2, Crown, Users, Shield, AlertTriangle,
  UserPlus, X, CheckCircle, XCircle, Loader2, GraduationCap,
  ClipboardList, MessageSquare, Mail, BookOpen, Zap,
  Calendar, Phone, Send, Award, Building2, Clock,
  ArrowRight, ExternalLink, AlertOctagon, UserCheck, Search, Check,
  Settings, Edit3, Trash2, Plus, Sparkles, Sliders, RefreshCw, MoreHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  useDashboardTheme,
  glassCard,
  dashBg,
  dashText,
  dashBorder,
} from '@/components/dashboard/DashboardThemeContext';
import type { Team, User } from '@/types';

interface ActiveTeamViewProps {
  currentUser: User;
  supabaseUserId: string;
  team: Team;
  onTeamLeft?: () => void;
}

interface MemberRow {
  id: string;
  user_id: string;
  role_in_team: string | null;
  full_name: string | null;
  email: string | null;
  roll_number: string | null;
  year_of_study?: string | null;
  gender: 'male' | 'female' | null;
  skills: string[];
}

interface JoinRequestRow {
  id: string;
  applicant_id: string;
  pitch_message: string | null;
  status: string;
  applicant_name: string | null;
  applicant_roll: string | null;
  applicant_skills: string[];
  applicant_email: string | null;
  applicant_gender: 'male' | 'female' | null;
}

interface MentorReq {
  id: string;
  status: string;
  mentor_name: string | null;
  mentor_department: string | null;
  mentor_designation: string | null;
  mentor_contact: string | null;
  mentor_email: string | null;
  mentor_themes: string[];
  pitch_message?: string | null;
  created_at?: string;
}

interface FacultyRow {
  id: string;
  faculty_mentor_id?: string | null;
  full_name: string | null;
  designation: string | null;
  department: string | null;
  contact_number: string | null;
  email: string | null;
  sih_themes: string[];
}

interface EventDetails {
  title: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface PSDetails {
  title: string | null;
  category: string | null;
}

/* ─────────────────────────────────────────────── */
/*  Helper Components                              */
/* ─────────────────────────────────────────────── */
function Pill({ label, color = '#22C55E' }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
    >
      {label}
    </span>
  );
}

function GenderBadgeAvatar({
  gender,
  name,
  isLeader = false,
  size = 40,
}: {
  gender?: 'male' | 'female' | null;
  name?: string | null;
  isLeader?: boolean;
  size?: number;
}) {
  const isGirl = gender === 'female';
  const isBoy = gender === 'male';
  const displayChar = isBoy ? 'B' : isGirl ? 'G' : (name?.[0]?.toUpperCase() ?? '?');

  const bgGradient = isGirl
    ? 'linear-gradient(135deg, #EC4899, #F472B6)'
    : isBoy
    ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
    : 'linear-gradient(135deg, #10B981, #34D399)';

  const shadow = isGirl
    ? 'rgba(236, 72, 153, 0.35)'
    : isBoy
    ? 'rgba(59, 130, 246, 0.35)'
    : 'rgba(16, 185, 129, 0.35)';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: size * 0.4,
        background: bgGradient,
        color: '#FFFFFF',
        boxShadow: `0 4px 14px ${shadow}`,
        border: isLeader ? '2.5px solid #F59E0B' : '2px solid rgba(255, 255, 255, 0.3)',
      }}
      title={`${name ?? 'Member'} (${isBoy ? 'Boy' : isGirl ? 'Girl' : 'Student'})`}
    >
      {displayChar}
    </div>
  );
}

function rollToEmail(roll: string | null) {
  if (!roll) return null;
  return `${roll.toLowerCase().replace(/\s+/g, '')}@glbajajgroup.org`;
}

/* ─────────────────────────────────────────────── */
/*  Main ActiveTeamView                            */
/* ─────────────────────────────────────────────── */
export default function ActiveTeamView({ currentUser, supabaseUserId, team: initialTeam, onTeamLeft }: ActiveTeamViewProps) {
  const { isDark } = useDashboardTheme();
  const router = useRouter();
  const supabase = createClient();

  const [team, setTeam]                     = useState<Team>(initialTeam);
  useEffect(() => { setTeam(initialTeam); }, [initialTeam]);

  const isLeader = team.leader_id === supabaseUserId;

  const [members, setMembers]               = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [joinRequests, setJoinRequests]     = useState<JoinRequestRow[]>([]);
  const [reqLoading, setReqLoading]         = useState(true);
  const [mentorReq, setMentorReq]           = useState<MentorReq | null>(null);
  const [allMentorRequests, setAllMentorRequests] = useState<MentorReq[]>([]);
  const [pendingPitches, setPendingPitches] = useState<MentorReq[]>([]);
  const [eventDetails, setEventDetails]     = useState<EventDetails>({
    title: 'SIH 2026 Internal Campus Hackathon',
    start_date: null, end_date: null, description: null,
  });
  const [psDetails, setPsDetails]           = useState<PSDetails>({ title: null, category: null });
  const [codeCopied, setCodeCopied]         = useState(false);
  const [processing, setProcessing]         = useState<string | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [reqTab, setReqTab]                 = useState<'received' | 'sent'>('received');
  
  /* Faculty Mentor Modal */
  const [showMentorBrowser, setShowMentorBrowser] = useState(false);
  const [faculty, setFaculty]               = useState<FacultyRow[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [pitchModal, setPitchModal]         = useState<FacultyRow | null>(null);
  const [pitchText, setPitchText]           = useState('');
  const [sendingPitch, setSendingPitch]     = useState(false);

  /* Team Leader Modifications State */
  const [showEditModal, setShowEditModal]       = useState(false);
  const [editTeamName, setEditTeamName]         = useState('');
  const [editPsId, setEditPsId]                 = useState('');
  const [editStatus, setEditStatus]             = useState('recruiting');
  const [editOpenRoles, setEditOpenRoles]       = useState<string[]>([]);
  const [newRoleInput, setNewRoleInput]         = useState('');
  const [availablePsOptions, setAvailablePsOptions] = useState<{ id: string; title?: string; category?: string }[]>([]);
  const [savingTeam, setSavingTeam]             = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState<MemberRow | null>(null);
  const [showDisbandConfirm, setShowDisbandConfirm]   = useState(false);
  const [disbanding, setDisbanding]             = useState(false);
  const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null);

  /* Danger Zone */
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leavingTeam, setLeavingTeam]       = useState(false);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* Open & Populate Team Edit Modal */
  const openEditModal = useCallback(() => {
    setEditTeamName(team.team_name ?? '');
    setEditPsId(team.problem_statement_id ?? '');
    setEditStatus(team.status ?? 'recruiting');
    setEditOpenRoles(team.open_roles ?? []);
    setNewRoleInput('');
    setShowEditModal(true);
  }, [team]);

  const handleAddOpenRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    if (!editOpenRoles.includes(trimmed)) {
      setEditOpenRoles((prev) => [...prev, trimmed]);
    }
    setNewRoleInput('');
  };

  const handleRemoveOpenRole = (roleToRemove: string) => {
    setEditOpenRoles((prev) => prev.filter((r) => r !== roleToRemove));
  };

  /* Save Team Details (Leader Only) */
  async function handleSaveTeamDetails() {
    if (!supabase || !isLeader || !editTeamName.trim()) return;
    setSavingTeam(true);
    try {
      const cleanName = editTeamName.trim();
      const cleanPsId = editPsId.trim() || null;

      const { error } = await supabase
        .from('teams')
        .update({
          team_name: cleanName,
          problem_statement_id: cleanPsId,
          status: editStatus,
          open_roles: editOpenRoles,
        })
        .eq('id', team.id);

      if (error) {
        showToast(error.message, 'err');
      } else {
        setTeam((prev) => ({
          ...prev,
          team_name: cleanName,
          problem_statement_id: cleanPsId,
          status: editStatus,
          open_roles: editOpenRoles,
        }));
        showToast('Team settings updated successfully!');
        setShowEditModal(false);

        if (cleanPsId) {
          const ps = availablePsOptions.find((p) => p.id === cleanPsId);
          if (ps) {
            setPsDetails({ title: ps.title ?? null, category: ps.category ?? null });
          } else {
            setPsDetails({ title: null, category: null });
          }
        } else {
          setPsDetails({ title: null, category: null });
        }
        router.refresh();
      }
    } catch {
      showToast('Failed to update team settings.', 'err');
    }
    setSavingTeam(false);
  }

  /* Transfer Leadership to another squad member */
  async function handleTransferLeadership(targetMember: MemberRow) {
    if (!supabase || !isLeader || targetMember.user_id === supabaseUserId) return;
    setProcessing(`transfer-${targetMember.user_id}`);
    try {
      // 1. Update leader_id on teams table
      const { error } = await supabase
        .from('teams')
        .update({ leader_id: targetMember.user_id })
        .eq('id', team.id);

      if (error) {
        showToast(error.message, 'err');
        setProcessing(null);
        return;
      }

      // 2. Update role_in_team on team_members table
      await supabase
        .from('team_members')
        .update({ role_in_team: 'Member' })
        .eq('team_id', team.id)
        .eq('user_id', supabaseUserId);

      await supabase
        .from('team_members')
        .update({ role_in_team: 'Team Leader' })
        .eq('team_id', team.id)
        .eq('user_id', targetMember.user_id);

      setTeam((prev) => ({ ...prev, leader_id: targetMember.user_id }));
      showToast(`Leadership transferred to ${targetMember.full_name ?? 'Member'}!`);
      setShowTransferConfirm(null);
      setShowEditModal(false);
      await loadMembers();
      router.refresh();
    } catch {
      showToast('Failed to transfer leadership.', 'err');
    }
    setProcessing(null);
  }

  /* Disband Team permanently (Leader Only) */
  async function handleDisbandTeam() {
    if (!supabase || !isLeader) return;
    setDisbanding(true);
    try {
      await supabase.from('team_members').delete().eq('team_id', team.id);
      await supabase.from('team_join_requests').delete().eq('team_id', team.id);
      await supabase.from('mentor_requests').delete().eq('team_id', team.id);
      const { error } = await supabase.from('teams').delete().eq('id', team.id);

      if (error) {
        showToast(error.message, 'err');
        setDisbanding(false);
        return;
      }

      showToast('Team has been disbanded.');
      setShowDisbandConfirm(false);
      setShowEditModal(false);
      if (onTeamLeft) onTeamLeft();
      else router.push('/dashboard/team');
    } catch (err: any) {
      showToast(`Error disbanding team: ${err?.message ?? 'Unknown error'}`, 'err');
    }
    setDisbanding(false);
  }

  function copyCode() {
    if (!team.join_code) return;
    navigator.clipboard.writeText(team.join_code).then(() => {
      setCodeCopied(true);
      showToast('Team join code copied to clipboard!', 'ok');
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  function shareTeamCode() {
    if (!team.join_code) return;
    const shareText = `Join my SIH 2026 Hackathon team "${team.team_name}" on CampusGrid! Use code: ${team.join_code}`;
    if (navigator.share) {
      navigator.share({
        title: `Join ${team.team_name} - SIH 2026`,
        text: shareText,
        url: window.location.origin + '/dashboard/team',
      }).catch(() => {
        copyCode();
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Invite link and join code copied to clipboard!', 'ok');
      });
    }
  }

  /* ── Fetch Data ── */
  const loadMembers = useCallback(async () => {
    if (!supabase) return;
    setMembersLoading(true);

    // 1. Fetch rows from team_members
    const { data: rawTeamMembers } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    // 2. Fetch accepted join requests for this team (failsafe for accepted applicants)
    const { data: rawAcceptedRequests } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', team.id)
      .eq('status', 'accepted');

    const memberRows = rawTeamMembers ?? [];
    const acceptedRequests = rawAcceptedRequests ?? [];

    // Collect all user IDs (team_members + accepted join requests + leader)
    const allUserIdsSet = new Set<string>();
    memberRows.forEach((r: any) => { if (r.user_id) allUserIdsSet.add(r.user_id); });
    acceptedRequests.forEach((r: any) => { if (r.applicant_id) allUserIdsSet.add(r.applicant_id); });
    if (team.leader_id) allUserIdsSet.add(team.leader_id);

    const allUserIds = Array.from(allUserIdsSet);

    // 3. Fetch user profiles directly from public.users
    let userProfilesMap: Record<string, any> = {};
    if (allUserIds.length > 0) {
      const { data: uProfiles } = await supabase
        .from('users')
        .select('id, full_name, email, roll_number, year_of_study, gender, skills')
        .in('id', allUserIds);
      if (uProfiles) {
        uProfiles.forEach((u: any) => {
          userProfilesMap[u.id] = u;
        });
      }
    }

    // 4. Map team_members rows
    let mappedMembers: MemberRow[] = memberRows.map((row: any) => {
      const uProfile = userProfilesMap[row.user_id];
      return {
        id: row.id,
        user_id: row.user_id,
        role_in_team: row.role_in_team ?? (row.user_id === team.leader_id ? 'Leader' : 'Member'),
        full_name: row.full_name ?? uProfile?.full_name ?? 'Student Member',
        email: row.email ?? uProfile?.email ?? null,
        roll_number: row.roll_number ?? uProfile?.roll_number ?? null,
        year_of_study: uProfile?.year_of_study ?? null,
        gender: uProfile?.gender ?? null,
        skills: uProfile?.skills ?? [],
      };
    });

    // 5. Merge accepted join requests if not already in team_members
    for (const req of acceptedRequests) {
      const alreadyIn = mappedMembers.some((m) => m.user_id === req.applicant_id);
      if (!alreadyIn) {
        const uProfile = userProfilesMap[req.applicant_id];
        mappedMembers.push({
          id: req.id,
          user_id: req.applicant_id,
          role_in_team: 'Member',
          full_name: uProfile?.full_name ?? 'Student Member',
          email: uProfile?.email ?? null,
          roll_number: uProfile?.roll_number ?? null,
          year_of_study: uProfile?.year_of_study ?? null,
          gender: uProfile?.gender ?? null,
          skills: uProfile?.skills ?? [],
        });

        // Sync to team_members in DB as background healing
        try {
          await supabase.from('team_members').insert({
            team_id: team.id,
            user_id: req.applicant_id,
            role_in_team: 'Member',
            full_name: uProfile?.full_name ?? null,
            email: uProfile?.email ?? null,
            roll_number: uProfile?.roll_number ?? null,
          });
        } catch { /* ignore if constraint exists */ }
      }
    }

    // 6. Ensure Team Leader is in Slot #1
    const hasLeader = mappedMembers.some((m) => m.user_id === team.leader_id);
    if (!hasLeader && team.leader_id) {
      const uProfile = userProfilesMap[team.leader_id];
      const leaderInfo: MemberRow = {
        id: `leader-${team.leader_id}`,
        user_id: team.leader_id,
        role_in_team: 'Leader',
        full_name: uProfile?.full_name ?? (currentUser?.id === team.leader_id ? currentUser.full_name : 'Team Leader'),
        email: uProfile?.email ?? (currentUser?.id === team.leader_id ? currentUser.email : null),
        roll_number: uProfile?.roll_number ?? (currentUser?.id === team.leader_id ? currentUser.roll_number : null),
        year_of_study: uProfile?.year_of_study ?? (currentUser?.id === team.leader_id ? currentUser.year_of_study : null),
        gender: uProfile?.gender ?? (currentUser?.id === team.leader_id ? currentUser.gender : null),
        skills: uProfile?.skills ?? (currentUser?.id === team.leader_id ? currentUser.skills : []),
      };
      mappedMembers.unshift(leaderInfo);

      try {
        await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: team.leader_id,
          role_in_team: 'Leader',
          full_name: leaderInfo.full_name,
          email: leaderInfo.email,
          roll_number: leaderInfo.roll_number,
        });
      } catch { /* ignore */ }
    }

    // 7. Sort: Leader first, then members
    mappedMembers.sort((a, b) => (a.user_id === team.leader_id ? -1 : b.user_id === team.leader_id ? 1 : 0));

    setMembers(mappedMembers);
    setMembersLoading(false);
  }, [supabase, team.id, team.leader_id, currentUser]);

  const loadJoinRequests = useCallback(async () => {
    if (!supabase) { setReqLoading(false); return; }
    setReqLoading(true);

    // Step 1: Fetch all join requests for this team
    const { data: reqRows, error: reqErr } = await supabase
      .from('team_join_requests')
      .select('id, applicant_id, pitch_message, status, created_at')
      .eq('team_id', team.id)
      .order('created_at', { ascending: false });

    if (reqErr || !reqRows) {
      setReqLoading(false);
      return;
    }

    // Step 2: Fetch applicant profiles separately (avoids RLS join restrictions)
    const applicantIds = [...new Set(reqRows.map((r: any) => r.applicant_id).filter(Boolean))];
    let profilesMap: Record<string, any> = {};

    if (applicantIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, full_name, roll_number, email, gender, skills')
        .in('id', applicantIds);

      if (profiles) {
        profiles.forEach((p: any) => { profilesMap[p.id] = p; });
      }
    }

    setJoinRequests(reqRows.map((row: any) => {
      const p = profilesMap[row.applicant_id] ?? {};
      return {
        id: row.id,
        applicant_id: row.applicant_id,
        pitch_message: row.pitch_message,
        status: row.status,
        applicant_name: p.full_name ?? null,
        applicant_roll: p.roll_number ?? null,
        applicant_skills: p.skills ?? [],
        applicant_email: p.email ?? null,
        applicant_gender: p.gender ?? null,
      };
    }));

    setReqLoading(false);
  }, [supabase, team.id]);

  const loadExtras = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: reqRows } = await supabase
        .from('mentor_requests')
        .select('id, status, pitch_message, created_at, mentor_id')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });

      const mentorIdsSet = new Set<string>();
      if (reqRows) {
        reqRows.forEach((r: any) => { if (r.mentor_id) mentorIdsSet.add(r.mentor_id); });
      }

      // Also check team.assigned_mentor_id if set on the teams table
      if (team.assigned_mentor_id) {
        mentorIdsSet.add(team.assigned_mentor_id);
      }

      const mentorIds = Array.from(mentorIdsSet);
      let mentorProfilesMap: Record<string, any> = {};

      if (mentorIds.length > 0) {
        // Fetch from public.users table (authenticated users can read public.users profiles)
        const { data: userProfiles } = await supabase
          .from('users')
          .select('id, full_name, department, designation, contact_number, email, sih_themes')
          .in('id', mentorIds);

        if (userProfiles) {
          userProfiles.forEach((u: any) => {
            mentorProfilesMap[u.id] = u;
          });
        }

        // Fallback fetch from faculty_mentors table if mentor_id references faculty_mentors table
        const missingIds = mentorIds.filter((id) => !mentorProfilesMap[id]);
        if (missingIds.length > 0) {
          const { data: fmRows } = await supabase
            .from('faculty_mentors')
            .select('id, user_id, designation, department, contact_number, user:users!faculty_mentors_user_id_fkey(full_name, email)')
            .in('id', missingIds);

          if (fmRows) {
            fmRows.forEach((fm: any) => {
              mentorProfilesMap[fm.id] = {
                full_name: fm.user?.full_name ?? null,
                email: fm.user?.email ?? null,
                designation: fm.designation ?? null,
                department: fm.department ?? null,
                contact_number: fm.contact_number ?? null,
                sih_themes: [],
              };
            });
          }
        }
      }

      let shaped: MentorReq[] = (reqRows ?? []).map((d: any) => {
        const m = mentorProfilesMap[d.mentor_id] ?? {};
        return {
          id: d.id,
          status: d.status,
          pitch_message: d.pitch_message,
          created_at: d.created_at,
          mentor_name: m.full_name ?? 'Faculty Mentor',
          mentor_department: m.department ?? null,
          mentor_designation: m.designation ?? 'Faculty Mentor',
          mentor_contact: m.contact_number ?? null,
          mentor_email: m.email ?? null,
          mentor_themes: m.sih_themes ?? [],
        };
      });

      // If mentor_requests was empty or blocked by RLS for non-leader members,
      // but team.assigned_mentor_id exists, synthesize accepted mentor object
      if (
        !shaped.some((s) => s.status === 'accepted') &&
        team.assigned_mentor_id &&
        mentorProfilesMap[team.assigned_mentor_id]
      ) {
        const m = mentorProfilesMap[team.assigned_mentor_id];
        shaped.unshift({
          id: `assigned-${team.assigned_mentor_id}`,
          status: 'accepted',
          pitch_message: null,
          created_at: new Date().toISOString(),
          mentor_name: m.full_name ?? 'Faculty Mentor',
          mentor_department: m.department ?? null,
          mentor_designation: m.designation ?? 'Faculty Mentor',
          mentor_contact: m.contact_number ?? null,
          mentor_email: m.email ?? null,
          mentor_themes: m.sih_themes ?? [],
        });
      }

      setAllMentorRequests(shaped);
      const accepted = shaped.find((d) => d.status === 'accepted');
      setMentorReq(accepted ?? (shaped.length > 0 ? shaped[0] : null));
      setPendingPitches(shaped.filter((d) => d.status === 'pending'));
    } catch { /* ignore */ }

    try {
      const { data: ev } = await supabase
        .from('events')
        .select('title, start_date, end_date, description')
        .eq('id', team.event_id)
        .maybeSingle();
      if (ev) setEventDetails({ title: ev.title, start_date: ev.start_date, end_date: ev.end_date, description: ev.description });
    } catch { /* ignore */ }

    if (team.event_id) {
      try {
        const { data: ev } = await supabase.from('events').select('ps_links').eq('id', team.event_id).maybeSingle();
        if (ev?.ps_links && Array.isArray(ev.ps_links)) {
          setAvailablePsOptions(ev.ps_links);
          if (team.problem_statement_id) {
            const ps = ev.ps_links.find((p: any) => p.id === team.problem_statement_id);
            if (ps) setPsDetails({ title: ps.title ?? null, category: ps.category ?? null });
          }
        }
      } catch { /* ignore */ }
    }
  }, [supabase, team.id, team.event_id, team.problem_statement_id, team.assigned_mentor_id]);

  useEffect(() => {
    loadMembers();
    loadJoinRequests();
    loadExtras();

    if (!supabase) return;

    // ── Realtime subscription for live join request & mentor updates ──
    const channelId = `team-${team.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_join_requests', filter: `team_id=eq.${team.id}` },
        () => {
          loadJoinRequests();
          loadMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${team.id}` },
        () => {
          loadMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_requests', filter: `team_id=eq.${team.id}` },
        () => {
          loadExtras();
        }
      )
      .subscribe();

    // ── Polling fallback every 15s ──
    const pollInterval = setInterval(() => {
      loadJoinRequests();
      loadMembers();
      loadExtras();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [loadMembers, loadJoinRequests, loadExtras, supabase, team.id]);

  /* Load faculty list for mentor browser modal */
  const loadFaculty = useCallback(async () => {
    if (!supabase) return;
    setFacultyLoading(true);
    try {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, designation, department, contact_number, email, sih_themes')
        .in('role', ['faculty', 'faculty_mentor']);

      // Check if faculty_mentors table maps user_id -> faculty_mentor_id
      const { data: fmData } = await supabase
        .from('faculty_mentors')
        .select('id, user_id');

      const fmMap: Record<string, string> = {};
      if (fmData) {
        fmData.forEach((fm: any) => {
          if (fm.user_id) fmMap[fm.user_id] = fm.id;
        });
      }

      if (usersData) {
        setFaculty(usersData.map((u: any) => ({
          id: u.id,
          faculty_mentor_id: fmMap[u.id] ?? null,
          full_name: u.full_name,
          designation: u.designation,
          department: u.department,
          contact_number: u.contact_number,
          email: u.email,
          sih_themes: u.sih_themes ?? [],
        })));
      }
    } catch { /* ignore */ }
    setFacultyLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (showMentorBrowser) loadFaculty();
  }, [showMentorBrowser, loadFaculty]);

  /* Actions */
  async function sendPitch() {
    if (!supabase || !pitchModal) return;
    setSendingPitch(true);
    try {
      // 1. Primary insert: using pitchModal.id (public.users.id)
      let { error } = await supabase.from('mentor_requests').insert({
        team_id: team.id,
        mentor_id: pitchModal.id,
        pitch_message: pitchText,
        status: 'pending',
      });

      // 2. Fallback insert: if FK constraint points to faculty_mentors table instead of users table
      if (error && error.code === '23503' && pitchModal.faculty_mentor_id) {
        const fallbackRes = await supabase.from('mentor_requests').insert({
          team_id: team.id,
          mentor_id: pitchModal.faculty_mentor_id,
          pitch_message: pitchText,
          status: 'pending',
        });
        error = fallbackRes.error;
      }

      if (error) {
        if (error.code === '23503') {
          showToast(`Foreign key constraint issue: Please run the SQL fix in Supabase SQL Editor. (${error.message})`, 'err');
        } else {
          showToast(error.message, 'err');
        }
      } else {
        showToast(`Pitch successfully sent to ${pitchModal.full_name ?? 'Faculty'}!`);
        setPitchModal(null);
        setPitchText('');
        setShowMentorBrowser(false);
        await loadExtras();
      }
    } catch {
      showToast('Failed to send pitch.', 'err');
    }
    setSendingPitch(false);
  }

  async function handleAccept(req: JoinRequestRow) {
    if (!supabase) return;
    setProcessing(req.id);

    // 1. Mark request as accepted directly
    await supabase
      .from('team_join_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id);

    // 2. Insert member into team_members directly
    try {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: req.applicant_id,
        role_in_team: 'Member',
        full_name: req.applicant_name,
        email: req.applicant_email,
        roll_number: req.applicant_roll,
      });
    } catch { /* ignore if constraint exists */ }

    // 3. Trigger RPC for team capacity checks
    try {
      await supabase.rpc('handle_accept_join_request', { request_id: req.id });
    } catch { /* ignore */ }

    setProcessing(null);
    showToast(`${req.applicant_name ?? 'Member'} joined the team!`);
    await loadMembers();
    await loadJoinRequests();
  }

  async function handleDecline(req: JoinRequestRow) {
    if (!supabase) return;
    setProcessing(req.id);
    const { error } = await supabase
      .from('team_join_requests')
      .update({ status: 'rejected', reject_reason: 'Declined by team leader' })
      .eq('id', req.id);
    setProcessing(null);
    if (error) {
      showToast(error.message, 'err');
      return;
    }
    showToast(`Request from ${req.applicant_name ?? 'applicant'} declined.`);
    await loadJoinRequests();
  }

  async function handleLeaveTeam() {
    if (!supabase) return;
    setLeavingTeam(true);
    try {
      // 1. Delete from team_members table
      const { error: delErr } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', supabaseUserId);

      if (delErr) {
        console.error('[Leave Team] team_members delete error:', delErr);
        showToast(`Could not leave team: ${delErr.message} (${delErr.code})`, 'err');
        setLeavingTeam(false);
        return;
      }

      // 2. Delete join_requests for this user + team (covers code-join 'accepted' rows too)
      const { error: reqErr } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('team_id', team.id)
        .eq('applicant_id', supabaseUserId);

      if (reqErr) {
        console.warn('[Leave Team] team_join_requests delete error:', reqErr);
      }

      // 3. Re-open team status if it was previously full
      if (team.status === 'full') {
        await supabase
          .from('teams')
          .update({ status: 'recruiting' })
          .eq('id', team.id);
      }

      showToast('You have left the team.');
      setShowLeaveModal(false);
      if (onTeamLeft) onTeamLeft();
    } catch (err: any) {
      console.error('[Leave Team] unexpected error:', err);
      showToast(`Error leaving team: ${err?.message ?? 'Unknown error'}`, 'err');
    }
    setLeavingTeam(false);
  }


  async function handleRemoveMember(m: MemberRow) {
    if (!supabase || !isLeader || m.user_id === team.leader_id) return;
    setProcessing(m.id);
    try {
      // 1. Delete from team_members table
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', m.user_id);

      // 2. Mark join request as cancelled
      await supabase
        .from('team_join_requests')
        .update({ status: 'cancelled' })
        .eq('team_id', team.id)
        .eq('applicant_id', m.user_id);

      // 3. Re-open team status if full
      if (team.status === 'full') {
        await supabase
          .from('teams')
          .update({ status: 'recruiting' })
          .eq('id', team.id);
      }

      showToast(`${m.full_name ?? 'Member'} removed from team.`);
      await loadMembers();
      await loadJoinRequests();
    } catch {
      showToast('Failed to remove member.', 'err');
    }
    setProcessing(null);
  }

  /* Team Computations */
  const leaderUser = members.find((m) => m.user_id === team.leader_id);
  const leaderName = leaderUser?.full_name ?? team.leader?.full_name ?? 'Team Leader';
  const isTeamComplete = members.length >= 6 || team.status === 'full';
  const hasGirlMember = members.some((m) => m.gender === 'female');
  const hasAssignedMentor = mentorReq?.status === 'accepted';
  const pendingJoinRequests = joinRequests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6" style={{ background: dashBg(isDark) }}>

      {/* ─────────────────────────────────────────────── */}
      {/*  LAYOUT ARCHITECTURE GRID                      */}
      {/*  Mobile: Stack Order 1..7                      */}
      {/*  Desktop: 3-Column Rows                        */}
      {/* ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 1 (Left 2/3): Team Overview Hero Card       */}
        {/* Mobile Order: 1                                */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="order-1 lg:order-none lg:col-span-2 p-6 relative overflow-hidden flex flex-col justify-between"
          style={glassCard(isDark)}
        >
          {/* Subtle Emerald Background Mesh Accent */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
              filter: 'blur(36px)',
            }}
          />

          <div className="relative z-10 space-y-4">

            {/* Status & Badges Line */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide"
                  style={{
                    background: isTeamComplete
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)',
                    border: isTeamComplete
                      ? '1px solid rgba(59, 130, 246, 0.35)'
                      : '1px solid rgba(34, 197, 94, 0.35)',
                    color: isTeamComplete ? '#60A5FA' : '#22C55E',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: isTeamComplete ? '#60A5FA' : '#22C55E' }}
                  />
                  {isTeamComplete ? '🔵 Team Complete' : '🟢 Active'}
                </span>

                {/* Member Counter Pill */}
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${dashBorder(isDark)}`,
                    color: dashText(isDark, true),
                  }}
                >
                  <Users size={13} className="text-[#22C55E]" />
                  {members.length} / 6 Members
                </span>
              </div>

              {/* Leader Settings Button */}
              {isLeader && (
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-md hover:scale-105 active:scale-95 border"
                  style={{
                    background: isDark ? 'rgba(129, 140, 248, 0.18)' : 'rgba(99, 102, 241, 0.12)',
                    borderColor: 'rgba(129, 140, 248, 0.45)',
                    color: '#818CF8',
                  }}
                >
                  <Settings size={13} /> Edit Team Settings
                </button>
              )}
            </div>

            {/* Team Title & Creator */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1.5" style={{ color: dashText(isDark) }}>
                {team.team_name}
              </h1>
              <div className="flex items-center gap-2 text-xs" style={{ color: dashText(isDark, true) }}>
                <span>Created by <strong style={{ color: dashText(isDark) }}>{leaderName}</strong></span>
                {isLeader ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B]">
                    <Crown size={10} /> 🏆 Team Leader
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-white/70">
                    Team Member
                  </span>
                )}
              </div>
            </div>

            {/* Problem Statement Banner */}
            {team.problem_statement_id && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex flex-wrap items-center gap-3">
                <BookOpen size={16} className="text-[#818CF8] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#818CF8]">SIH Problem Statement</p>
                  <p className="text-xs font-mono font-bold truncate" style={{ color: dashText(isDark) }}>
                    {team.problem_statement_id} {psDetails.title ? `— ${psDetails.title}` : ''}
                  </p>
                </div>
                {psDetails.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-[#818CF8] border border-indigo-500/30">
                    {psDetails.category}
                  </span>
                )}
              </div>
            )}

            {/* Overlapping Avatars (6 Slots) & Code Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t" style={{ borderColor: dashBorder(isDark) }}>

              {/* Overlapping Avatar Bubbles */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold mr-1" style={{ color: dashText(isDark, true) }}>Squad:</span>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const m = members[i];
                    if (m) {
                      const isLeaderRow = m.user_id === team.leader_id;
                      return (
                        <div key={m.id} className="relative group hover:z-20 transition-all">
                          <GenderBadgeAvatar
                            gender={m.gender}
                            name={m.full_name}
                            isLeader={isLeaderRow}
                            size={36}
                          />
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`empty-hero-${i}`}
                        className="w-9 h-9 rounded-full border-2 border-dashed bg-white/5 flex items-center justify-center text-[10px] font-bold"
                        style={{ borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                        title="Empty Slot"
                      >
                        +
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Code Pill with Copy */}
              {team.join_code && (
                <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-xl border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: dashBorder(isDark) }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dashText(isDark, true) }}>Code:</span>
                    <span className="font-mono font-black text-sm text-[#22C55E] tracking-widest">{team.join_code}</span>
                  </div>
                  <button
                    onClick={copyCode}
                    title="Copy Team Code"
                    className="p-1.5 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              )}

            </div>

          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 1 (Right 1/3): SIH 2026 Event Metadata Card */}
        {/* Mobile Order: 2                                */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="order-2 lg:order-none lg:col-span-1 p-6 relative overflow-hidden flex flex-col justify-between"
          style={glassCard(isDark)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: dashBorder(isDark) }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center">
                  <Calendar size={15} className="text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: dashText(isDark) }}>SIH 2026 Event</h3>
                  <p className="text-[10px]" style={{ color: dashText(isDark, true) }}>Smart India Hackathon</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 animate-pulse">
                  LIVE
                </span>
                <Link
                  href="/"
                  title="Go to Event"
                  aria-label="Go to Event"
                  className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20"
                  style={{ background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)' }}
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold leading-snug" style={{ color: dashText(isDark) }}>
                Smart India Hackathon 2026
              </h4>
              <p className="text-xs" style={{ color: dashText(isDark, true) }}>
                Registered Internal Team · GL Bajaj Group of Institutions
              </p>
              <div className="pt-2 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: dashText(isDark, true) }}>Category</span>
                  <span className="font-semibold" style={{ color: dashText(isDark) }}>Campus Internal Round</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: dashText(isDark, true) }}>Max Squad Size</span>
                  <span className="font-semibold" style={{ color: dashText(isDark) }}>6 Members</span>
                </div>
              </div>
            </div>
          </div>


        </motion.div>


        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 2 (Left 2/3): Team Members Section (6 Slots)*/}
        {/* Mobile Order: 3                                */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="order-3 lg:order-none lg:col-span-2 p-4 sm:p-5 space-y-3"
          style={glassCard(isDark)}
        >
          <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: dashBorder(isDark) }}>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#22C55E]" />
              <h2 className="text-sm sm:text-base font-bold" style={{ color: dashText(isDark) }}>Team Members</h2>
            </div>
            {/* SIH Diversity Badge */}
            <span
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                background: hasGirlMember ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${hasGirlMember ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                color: hasGirlMember ? '#22C55E' : '#F59E0B',
              }}
            >
              {hasGirlMember ? <Shield size={12} /> : <AlertTriangle size={12} />}
              {hasGirlMember ? 'SIH Diversity Met ✓' : 'SIH 1 Female Mandate'}
            </span>
          </div>

          {/* Roster Grid (Stacked 1-column on mobile, 2-column on desktop screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => {
              const m = members[idx];

              if (m) {
                const isThisLeader = m.user_id === team.leader_id;
                const displayEmail = m.email || rollToEmail(m.roll_number);

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all hover:border-[#22C55E]/40 flex items-start justify-between gap-2.5 sm:gap-3 group relative"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: dashBorder(isDark),
                    }}
                  >
                    {/* Left & Middle Content */}
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      {/* Left Section: Avatar */}
                      <GenderBadgeAvatar
                        gender={m.gender}
                        name={m.full_name}
                        isLeader={isThisLeader}
                        size={38}
                      />

                      {/* Middle Section */}
                      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                        {/* Row 1: Full Name + (Leader) Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-tight">
                            {m.full_name ?? 'Student'}
                          </h4>
                          {isThisLeader && (
                            <span className="text-amber-400 italic text-xs font-semibold shrink-0">
                              (Leader)
                            </span>
                          )}
                        </div>

                        {/* Row 2: Email address in muted text (Fully visible, break-all for mobile) */}
                        {displayEmail && (
                          <a
                            href={`mailto:${displayEmail}`}
                            className="block text-[11px] sm:text-xs text-slate-400 break-all leading-snug hover:text-slate-200 transition-colors"
                          >
                            {displayEmail}
                          </a>
                        )}

                        {/* Row 3: Roll Number + Year of Study */}
                        {(m.roll_number || m.year_of_study) && (
                          <div className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap pt-0.5">
                            {m.roll_number && <span className="tracking-tight">{m.roll_number}</span>}
                            {m.roll_number && m.year_of_study && <span className="opacity-50">•</span>}
                            {m.year_of_study && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold bg-[#818CF8]/15 border border-[#818CF8]/30 text-[#818CF8]">
                                {m.year_of_study}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Row 4: Skill Tags */}
                        {m.skills && m.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {m.skills.slice(0, 4).map((s) => (
                              <Pill key={s} label={s} color="#22C55E" />
                            ))}
                            {m.skills.length > 4 && (
                              <span className="text-[9px] self-center text-slate-400">
                                +{m.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Three-dots menu icon */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setActiveMemberMenu(activeMemberMenu === m.id ? null : m.id)}
                        className="p-1 sm:p-1.5 rounded-lg border transition-all text-slate-400 hover:text-white hover:bg-white/10"
                        style={{ borderColor: dashBorder(isDark) }}
                        title="Member Actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Member Action Dropdown */}
                      {activeMemberMenu === m.id && (
                        <div
                          className="absolute right-0 top-8 sm:top-9 z-30 w-44 rounded-xl p-1.5 shadow-2xl border flex flex-col gap-1 backdrop-blur-md"
                          style={{
                            background: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: dashBorder(isDark),
                          }}
                        >
                          {isLeader && !isThisLeader && (
                            <>
                              <button
                                onClick={() => {
                                  setActiveMemberMenu(null);
                                  setShowTransferConfirm(m);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/15 flex items-center gap-2 transition-all"
                              >
                                <Crown size={13} /> Promote to Leader
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMemberMenu(null);
                                  handleRemoveMember(m);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/15 flex items-center gap-2 transition-all"
                              >
                                <X size={13} /> Remove Member
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setActiveMemberMenu(null);
                              showToast(`${m.full_name ?? 'Student'} • ${m.email || 'No email'}`);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 flex items-center gap-2 transition-all"
                          >
                            <UserCheck size={13} /> View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              /* Empty Slot Card */
              return (
                <div
                  key={`empty-card-${idx}`}
                  className="rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 border-dashed flex items-center justify-center gap-2 text-center min-h-[48px] sm:min-h-[90px] opacity-50 hover:opacity-75 transition-opacity sm:flex-col"
                  style={{ borderColor: dashBorder(isDark), background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center" style={{ borderColor: dashBorder(isDark), color: dashText(isDark, true) }}>
                    <UserPlus size={12} />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-semibold" style={{ color: dashText(isDark) }}>Empty Slot</p>
                    <p className="text-[9px] hidden sm:block" style={{ color: dashText(isDark, true) }}>Waiting for Member</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 2 (Right 1/3): Sidebar Stack                */}
        {/* - Faculty Mentor Card                           */}
        {/* - Team Action Cards                             */}
        {/* Mobile Order: 4 & 5                            */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="order-4 lg:order-none lg:col-span-1 flex flex-col gap-6">

          {/* 1. Dedicated Faculty Mentor Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="p-6 space-y-4"
            style={glassCard(isDark)}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: dashBorder(isDark) }}>
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-[#818CF8]" />
                <h3 className="text-sm font-bold" style={{ color: dashText(isDark) }}>Faculty Mentor</h3>
              </div>
              {hasAssignedMentor ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                  Assigned ✓
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Unassigned
                </span>
              )}
            </div>

            {hasAssignedMentor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[#818CF8] font-extrabold flex items-center justify-center text-lg shrink-0">
                    {(mentorReq.mentor_name ?? 'F')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: dashText(isDark) }}>{mentorReq.mentor_name}</h4>
                    <p className="text-xs" style={{ color: dashText(isDark, true) }}>{mentorReq.mentor_designation}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t" style={{ borderColor: dashBorder(isDark) }}>
                  {mentorReq.mentor_department && (
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-[#818CF8] shrink-0" />
                      <span className="truncate" style={{ color: dashText(isDark) }}>{mentorReq.mentor_department}</span>
                    </div>
                  )}
                  {mentorReq.mentor_email && (
                    <a href={`mailto:${mentorReq.mentor_email}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity truncate" style={{ color: dashText(isDark) }}>
                      <Mail size={12} className="text-[#818CF8] shrink-0" />
                      <span className="truncate">{mentorReq.mentor_email}</span>
                    </a>
                  )}
                  {mentorReq.mentor_contact && (
                    <div className="flex items-center gap-2" style={{ color: dashText(isDark) }}>
                      <Phone size={12} className="text-[#818CF8] shrink-0" />
                      <span>{mentorReq.mentor_contact}</span>
                    </div>
                  )}
                </div>

                {mentorReq.mentor_themes.length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: dashBorder(isDark) }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: dashText(isDark, true) }}>SIH Theme Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {mentorReq.mentor_themes.map((t) => (
                        <Pill key={t} label={t} color="#818CF8" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}>
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: dashText(isDark) }}>No Mentor Assigned Yet</h4>
                  <p className="text-xs leading-relaxed" style={{ color: dashText(isDark, true) }}>
                    Pitch a faculty mentor to guide your team through SIH 2026.
                  </p>
                </div>

                {isLeader && (
                  <button
                    onClick={() => setShowMentorBrowser(true)}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#22C55E] hover:bg-[#16a34a] text-black transition-all shadow-md shadow-[#22C55E]/20 flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap size={14} /> + Browse Faculty Mentors &amp; Send Pitch
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* 2. Team Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Find Members Card (Only for Team Leader) */}
            {isLeader && (
              <div className="p-5 space-y-3" style={glassCard(isDark)}>
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-[#818CF8]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: dashText(isDark) }}>Find Team Members</h4>
                </div>
                <p className="text-xs" style={{ color: dashText(isDark, true) }}>
                  Looking for Team Members? Browse students looking for teams in solo matchmaking.
                </p>
                <button
                  onClick={() => showToast('Opening Matchmaker...')}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-[#818CF8]/15 hover:bg-[#818CF8]/25 border border-[#818CF8]/30 text-[#818CF8] flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserPlus size={13} /> Find Members in Matchmaker →
                </button>
              </div>
            )}
          </motion.div>

        </div>


        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 3 (Full Width): Request Management Section   */}
        {/* Mobile Order: 6 (Only for Team Leader)         */}
        {/* ═══════════════════════════════════════════════ */}
        {isLeader && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="order-6 lg:order-none lg:col-span-3 p-6 space-y-4"
            style={glassCard(isDark)}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: dashBorder(isDark) }}>
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-[#818CF8]" />
                <h2 className="text-base font-bold" style={{ color: dashText(isDark) }}>Request Management</h2>
              </div>

              {/* Tabs Selector */}
              <div className="flex p-1 rounded-xl border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark) }}>
                <button
                  onClick={() => setReqTab('received')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  style={{
                    background: reqTab === 'received' ? 'rgba(129,140,248,0.2)' : 'transparent',
                    color: reqTab === 'received' ? '#818CF8' : dashText(isDark, true),
                    border: reqTab === 'received' ? '1px solid rgba(129,140,248,0.3)' : '1px solid transparent',
                  }}
                >
                  Received Requests ({pendingJoinRequests.length})
                </button>
                <button
                  onClick={() => setReqTab('sent')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  style={{
                    background: reqTab === 'sent' ? 'rgba(129,140,248,0.2)' : 'transparent',
                    color: reqTab === 'sent' ? '#818CF8' : dashText(isDark, true),
                    border: reqTab === 'sent' ? '1px solid rgba(129,140,248,0.3)' : '1px solid transparent',
                  }}
                >
                  Sent Requests ({allMentorRequests.length})
                </button>
              </div>
            </div>

            {/* TAB 1: Received Inbound Join Requests */}
            {reqTab === 'received' && (
              <div>
                {reqLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#818CF8]" />
                  </div>
                ) : pendingJoinRequests.length === 0 ? (
                  /* Glassmorphic Empty State */
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}>
                      <UserPlus size={28} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: dashText(isDark) }}>No Received Requests Found</h4>
                      <p className="text-xs" style={{ color: dashText(isDark, true) }}>
                        Incoming requests from applicants will appear here for leader review.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingJoinRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-[16px] border flex flex-col justify-between gap-3"
                        style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: dashBorder(isDark) }}
                      >
                        <div className="flex items-start gap-3">
                          <GenderBadgeAvatar
                            gender={req.applicant_gender}
                            name={req.applicant_name}
                            size={40}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold truncate" style={{ color: dashText(isDark) }}>
                              {req.applicant_name ?? 'Applicant'}
                            </h4>
                            {req.applicant_roll && (
                              <p className="text-xs font-mono text-[#818CF8]">{req.applicant_roll}</p>
                            )}
                            {req.applicant_email && (
                              <p className="text-[11px] truncate" style={{ color: dashText(isDark, true) }}>{req.applicant_email}</p>
                            )}
                          </div>
                        </div>

                        {req.pitch_message && (
                          <div className="p-3 rounded-xl border text-xs space-y-1" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: dashBorder(isDark), color: dashText(isDark) }}>
                            <p className="text-[10px] uppercase font-bold" style={{ color: dashText(isDark, true) }}>Pitch Message:</p>
                            <p className="italic leading-relaxed">{req.pitch_message}</p>
                          </div>
                        )}

                        {req.applicant_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {req.applicant_skills.slice(0, 4).map((s) => (
                              <Pill key={s} label={s} color="#818CF8" />
                            ))}
                          </div>
                        )}

                        {isLeader && (
                          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: dashBorder(isDark) }}>
                            <button
                              onClick={() => handleAccept(req)}
                              disabled={processing === req.id}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#22C55E] hover:bg-[#16a34a] text-black transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              {processing === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(req)}
                              disabled={processing === req.id}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Sent Outbound Mentor Requests */}
            {reqTab === 'sent' && (
              <div>
                {allMentorRequests.length === 0 ? (
                  /* Glassmorphic Empty State */
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}>
                      <Send size={26} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: dashText(isDark) }}>No Sent Pitches Found</h4>
                      <p className="text-xs" style={{ color: dashText(isDark, true) }}>
                        Outbound faculty mentor pitches sent by your team will be listed here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allMentorRequests.map((pitch) => (
                      <div
                        key={pitch.id}
                        className="p-4 rounded-[16px] border space-y-3"
                        style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: dashBorder(isDark) }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold" style={{ color: dashText(isDark) }}>{pitch.mentor_name ?? 'Faculty Mentor'}</h4>
                            {pitch.mentor_department && (
                              <p className="text-xs" style={{ color: dashText(isDark, true) }}>{pitch.mentor_department}</p>
                            )}
                          </div>

                          {/* Status Badges */}
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background:
                                pitch.status === 'accepted'
                                  ? 'rgba(34, 197, 94, 0.15)'
                                  : pitch.status === 'rejected'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              border: `1px solid ${
                                pitch.status === 'accepted'
                                  ? 'rgba(34, 197, 94, 0.35)'
                                  : pitch.status === 'rejected'
                                  ? 'rgba(239, 68, 68, 0.35)'
                                  : 'rgba(245, 158, 11, 0.35)'
                              }`,
                              color:
                                pitch.status === 'accepted'
                                  ? '#22C55E'
                                  : pitch.status === 'rejected'
                                  ? '#F87171'
                                  : '#F59E0B',
                            }}
                          >
                            {pitch.status === 'accepted'
                              ? '🟢 Accepted'
                              : pitch.status === 'rejected'
                              ? '🔴 Rejected'
                              : '🟡 Pending'}
                          </span>
                        </div>

                        {pitch.pitch_message && (
                          <p className="text-xs italic p-2.5 rounded-xl border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: dashBorder(isDark), color: dashText(isDark) }}>
                            "{pitch.pitch_message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}


        {/* ═══════════════════════════════════════════════ */}
        {/* ROW 4 (Full Width): Danger Zone                 */}
        {/* Mobile Order: 7                                */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="order-7 lg:order-none lg:col-span-3 p-6 space-y-4 rounded-[18px] bg-red-500/5 border border-red-500/25"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-400">
                <AlertOctagon size={18} />
                <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>Danger Zone</h3>
              </div>
              <p className="text-xs" style={{ color: dashText(isDark, true) }}>
                {isLeader
                  ? "As Team Leader, you can edit team settings, promote squad members, or permanently disband this team."
                  : "Leaving this team removes you permanently. You'll need another invitation or the team code to rejoin."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isLeader && (
                <button
                  onClick={() => setShowDisbandConfirm(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Disband Team
                </button>
              )}
              <button
                onClick={() => setShowLeaveModal(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold border border-red-500/40 text-red-400 hover:bg-red-500/15 hover:border-red-500 transition-all"
              >
                Leave Team
              </button>
            </div>
          </div>
        </motion.div>

      </div>


      {/* ─────────────────────────────────────────────── */}
      {/*  MODALS & OVERLAYS                              */}
      {/* ─────────────────────────────────────────────── */}

      {/* 1. Faculty Mentor Browser Modal */}
      <AnimatePresence>
        {showMentorBrowser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowMentorBrowser(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', border: `1px solid ${dashBorder(isDark)}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: dashBorder(isDark) }}>
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-[#818CF8]" />
                  <h3 className="font-bold text-base" style={{ color: dashText(isDark) }}>Browse Faculty Mentors</h3>
                </div>
                <button
                  onClick={() => setShowMentorBrowser(false)}
                  className="p-1.5 rounded-lg border transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-3">
                {facultyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#818CF8]" />
                  </div>
                ) : faculty.length === 0 ? (
                  <div className="text-center py-12" style={{ color: dashText(isDark, true) }}>
                    <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No faculty mentors available right now.</p>
                  </div>
                ) : (
                  faculty.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3"
                      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: dashBorder(isDark) }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-[#818CF8] font-bold flex items-center justify-center shrink-0 border border-indigo-500/30">
                          {(f.full_name ?? 'F')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold" style={{ color: dashText(isDark) }}>{f.full_name}</h4>
                          <p className="text-xs" style={{ color: dashText(isDark, true) }}>{f.designation} · {f.department}</p>
                          {f.sih_themes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {f.sih_themes.slice(0, 3).map((t) => (
                                <Pill key={t} label={t} color="#818CF8" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setPitchModal(f)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#818CF8]/20 hover:bg-[#818CF8]/30 border border-[#818CF8]/35 text-[#818CF8] flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <Send size={12} /> Send Pitch
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Pitch Modal */}
      <AnimatePresence>
        {pitchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={() => setPitchModal(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 border shadow-2xl"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: 'rgba(129,140,248,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#818CF8] tracking-widest">Send Pitch To</p>
                  <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>{pitchModal.full_name}</h3>
                  <p className="text-xs" style={{ color: dashText(isDark, true) }}>{pitchModal.designation}</p>
                </div>
                <button
                  onClick={() => setPitchModal(null)}
                  className="p-1.5 rounded-lg border text-xs"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  <X size={16} />
                </button>
              </div>

              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Describe your team's project idea and why you'd value this mentor's guidance…"
                rows={5}
                className="w-full text-sm rounded-xl p-3 outline-none transition-colors resize-none border"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark) }}
              />

              <button
                onClick={sendPitch}
                disabled={sendingPitch || !pitchText.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#818CF8] hover:bg-[#6366F1] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {sendingPitch ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Pitch Message
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Leave Team Confirmation Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4 border shadow-2xl text-center"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>Leave Team?</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: dashText(isDark, true) }}>
                  Are you sure you want to leave <strong style={{ color: dashText(isDark) }}>{team.team_name}</strong>? You will need an invite or join code to return.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveTeam}
                  disabled={leavingTeam}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {leavingTeam ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Team Settings & Modification Modal (Leader Only) */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              className="w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl border"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: 'rgba(129,140,248,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: dashBorder(isDark) }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-[#818CF8] flex items-center justify-center border border-indigo-500/30">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: dashText(isDark) }}>Edit Team Settings</h3>
                    <p className="text-[11px]" style={{ color: dashText(isDark, true) }}>Manage team details, PS, roles &amp; leadership</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg border text-xs"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">

                {/* 1. Team Name */}
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: dashText(isDark, true) }}>
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none border transition-colors"
                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark) }}
                  />
                </div>

                {/* 2. SIH Problem Statement Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: dashText(isDark, true) }}>
                      SIH Problem Statement
                    </label>
                    {editPsId && (
                      <button
                        onClick={() => setEditPsId('')}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {availablePsOptions.length > 0 ? (
                    <select
                      value={editPsId}
                      onChange={(e) => setEditPsId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none border transition-colors"
                      style={{ background: isDark ? '#1E293B' : '#F8FAFC', borderColor: dashBorder(isDark), color: dashText(isDark) }}
                    >
                      <option value="">-- No Problem Statement Selected --</option>
                      {availablePsOptions.map((ps) => (
                        <option key={ps.id} value={ps.id}>
                          {ps.id} {ps.title ? `— ${ps.title}` : ''} {ps.category ? `(${ps.category})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editPsId}
                      onChange={(e) => setEditPsId(e.target.value)}
                      placeholder="e.g. SIH1423"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono outline-none border transition-colors"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark) }}
                    />
                  )}
                </div>

                {/* 4. Open Roles Manager */}
                <div className="space-y-2">
                  <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: dashText(isDark, true) }}>
                    Open Member Roles Needed
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOpenRole(); } }}
                      placeholder="e.g. Frontend Developer, AI Engineer..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs outline-none border"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: dashBorder(isDark), color: dashText(isDark) }}
                    />
                    <button
                      type="button"
                      onClick={handleAddOpenRole}
                      className="px-3 py-2 rounded-xl font-bold bg-[#818CF8]/20 hover:bg-[#818CF8]/30 border border-[#818CF8]/40 text-[#818CF8]"
                    >
                      + Add Role
                    </button>
                  </div>

                  {editOpenRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editOpenRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#818CF8]/15 border border-[#818CF8]/35 text-[#818CF8]"
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => handleRemoveOpenRole(role)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Transfer Leadership Option */}
                {members.filter((m) => m.user_id !== supabaseUserId).length > 0 && (
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: dashBorder(isDark) }}>
                    <label className="font-bold uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1">
                      <Crown size={12} /> Transfer Team Leadership
                    </label>
                    <p className="text-[11px]" style={{ color: dashText(isDark, true) }}>
                      Select a squad member to promote as the new Team Leader:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {members
                        .filter((m) => m.user_id !== supabaseUserId)
                        .map((m) => (
                          <button
                            key={`transfer-btn-${m.id}`}
                            type="button"
                            onClick={() => setShowTransferConfirm(m)}
                            className="p-2.5 rounded-xl border text-left flex items-center justify-between hover:bg-amber-500/10 hover:border-amber-500/30 transition-all"
                            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: dashBorder(isDark) }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate" style={{ color: dashText(isDark) }}>{m.full_name ?? 'Member'}</p>
                              <p className="text-[10px] text-[#818CF8] font-mono">{m.roll_number ?? 'Student'}</p>
                            </div>
                            <Crown size={14} className="text-amber-400 shrink-0 ml-2" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: dashBorder(isDark) }}>
                <button
                  type="button"
                  onClick={() => setShowDisbandConfirm(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/15 border border-red-500/30 transition-all flex items-center gap-1"
                >
                  <Trash2 size={13} /> Disband Team
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTeamDetails}
                    disabled={savingTeam || !editTeamName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#22C55E] hover:bg-[#16a34a] text-black shadow-md shadow-[#22C55E]/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {savingTeam ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save Changes
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Transfer Leadership Confirmation Modal */}
      <AnimatePresence>
        {showTransferConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowTransferConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 border shadow-2xl"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: 'rgba(245,158,11,0.4)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-amber-400">
                <Crown size={24} />
                <div>
                  <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>Transfer Leadership</h3>
                  <p className="text-xs" style={{ color: dashText(isDark, true) }}>Confirm new team leader</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: dashText(isDark) }}>
                Are you sure you want to promote <strong className="text-amber-400">{showTransferConfirm.full_name ?? 'this member'}</strong> to Team Leader? You will become a standard Team Member.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowTransferConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTransferLeadership(showTransferConfirm)}
                  disabled={processing === `transfer-${showTransferConfirm.user_id}`}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {processing === `transfer-${showTransferConfirm.user_id}` ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Disband Team Confirmation Modal */}
      <AnimatePresence>
        {showDisbandConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowDisbandConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 border shadow-2xl"
              style={{ background: isDark ? '#0F172A' : '#FFFFFF', borderColor: 'rgba(239,68,68,0.4)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertOctagon size={24} />
                <div>
                  <h3 className="text-base font-bold" style={{ color: dashText(isDark) }}>Permanently Disband Team?</h3>
                  <p className="text-xs" style={{ color: dashText(isDark, true) }}>This action cannot be undone</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: dashText(isDark) }}>
                This will permanently delete team <strong className="text-red-400">{team.team_name}</strong> and remove all members and join requests.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDisbandConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: dashBorder(isDark), color: dashText(isDark, true) }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisbandTeam}
                  disabled={disbanding}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {disbanding ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Yes, Disband Team
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Real-time Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            className="fixed bottom-6 left-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl z-[70]"
            style={{
              background: toast.type === 'ok' ? '#22C55E' : '#EF4444',
              color: '#FFFFFF',
            }}
          >
            {toast.type === 'ok' ? <CheckCircle size={15} /> : <XCircle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
