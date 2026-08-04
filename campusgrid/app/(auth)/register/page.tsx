'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  User, Hash, GraduationCap, BookOpen, Phone, Tag,
  ChevronRight, ArrowRight, Loader2, X, Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { IS_SUPABASE_CONFIGURED } from '@/lib/supabase/fallback';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthProvider';

/* ════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════ */

const ALLOWED_DOMAINS =
  (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? '@glbajajgroup.org')
    .split(',').map((d) => d.trim().toLowerCase());

function validateDomain(email: string): boolean {
  const lower = email.toLowerCase();
  return ALLOWED_DOMAINS.some((d) => lower.endsWith(d));
}

const SKILL_OPTIONS = [
  'React', 'Python', 'AI/ML', 'Node.js', 'UI/UX Design', 'Java', 'Flutter',
];

/** Exact 17 SIH themes as provided */
const SIH_THEMES = [
  'Smart Automation',
  'Fitness & Sports',
  'Heritage & Culture',
  'MedTech / BioTech / HealthTech',
  'Agriculture, FoodTech & Rural Development',
  'Smart Vehicles',
  'Transportation & Logistics',
  'Robotics and Drones',
  'Clean & Green Technology',
  'Tourism',
  'Renewable / Sustainable Energy',
  'Blockchain & Cybersecurity',
  'Smart Education',
  'Disaster Management',
  'Toys and Games',
  'Miscellaneous (Hospitality, Finance, Retail, Entertainment, etc.)',
  'Space Technology',
];

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'MCA',
  'MBA',
  'Basic Sciences',
  'Other',
];

type Role = 'student' | 'faculty';

/* ════════════════════════════════════════════════════════════
   MULTI-SELECT PILL COMPONENT
════════════════════════════════════════════════════════════ */
function MultiSelect({
  options,
  selected,
  onToggle,
  isDark,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  isDark: boolean;
}) {
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  return (
    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
            style={
              active
                ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.45)', color: '#22C55E' }
                : { background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textMuted }
            }
          >
            {opt}
            {active && <X size={10} className="ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   REGISTER PAGE
════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { refreshProfile } = useAuth();

  /* ── Form state ── */
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* Student fields */
  const [rollNumber, setRollNumber] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  /* Faculty fields */
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [sihThemes, setSihThemes] = useState<string[]>([]);

  /* UI state */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const supabase = createClient();

  const toggleSkill = (s: string) =>
    setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const toggleTheme = (t: string) =>
    setSihThemes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  /* ── Submit handler ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Authentication service is not configured.'); return; }
    if (!selectedRole) { setError('Please select your role.'); return; }
    setError(null);

    const cleanedName = fullName.trim();
    if (!cleanedName || cleanedName.length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[a-zA-Z\s.-]+$/.test(cleanedName)) {
      setError('Full name can only contain letters, spaces, dots, and hyphens.');
      return;
    }

    const cleanedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validateDomain(cleanedEmail)) {
      setError(`Only college emails are allowed. Accepted: ${ALLOWED_DOMAINS.join(', ')}`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const cleanedRoll = rollNumber.trim();
    if (selectedRole === 'student') {
      if (!cleanedRoll) {
        setError('Roll number is required for students.');
        return;
      }
      if (!/^\d{10,15}$/.test(cleanedRoll)) {
        setError('Security error: Roll number must consist strictly of 10 to 15 numeric digits (e.g. 2200290100001).');
        return;
      }
      if (!yearOfStudy) {
        setError('Please select your Year of Study.');
        return;
      }
      if (!gender) {
        setError('Please select your gender (Boy or Girl).');
        return;
      }
    }

    if (selectedRole === 'faculty') {
      if (!designation.trim() || !department) {
        setError('Designation and Department are required for faculty.');
        return;
      }
      if (contactNumber.trim()) {
        const phoneDigits = contactNumber.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 12) {
          setError('Contact number must be a valid 10 to 12 digit phone number.');
          return;
        }
      }
    }

    setIsLoading(true);

    /* 1. Create auth user (or sign in if user already exists in auth.users) */
    let userId: string | null = null;

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: cleanedEmail,
      password,
      options: {
        data: { full_name: cleanedName },
      },
    });

    if (authData?.user) {
      userId = authData.user.id;
    } else if (signupError) {
      const errMsg = signupError.message.toLowerCase();
      if (errMsg.includes('already registered') || errMsg.includes('already exists') || errMsg.includes('user_already_exists')) {
        // User already exists in auth.users — attempt sign-in to heal/upsert profile
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password,
        });

        if (signInData?.user) {
          userId = signInData.user.id;
        } else {
          setIsLoading(false);
          setError('This email is already registered. Please sign in to your existing account or reset your password.');
          return;
        }
      } else {
        setIsLoading(false);
        setError(signupError.message);
        return;
      }
    }

    if (!userId) {
      setIsLoading(false);
      setError('Registration failed to resolve user ID.');
      return;
    }

    /* 2. Upsert profile into role-specific backend tables */
    if (selectedRole === 'faculty') {
      // 2a. Sync into public.users with role 'faculty' FIRST (satisfies FK constraints on faculty_mentors)
      const userFacultyPayload = {
        id: userId,
        email: cleanedEmail,
        full_name: cleanedName,
        role: 'faculty' as const,
        designation: designation.trim(),
        department,
        contact_number: contactNumber.trim(),
        sih_themes: sihThemes,
      };

      const { error: userError } = await supabase
        .from('users')
        .upsert(userFacultyPayload as any);

      if (userError) {
        setIsLoading(false);
        setError(`Faculty User DB insert failed: ${userError.message}`);
        return;
      }

      // 2b. Upsert into public.faculty_mentors SECOND
      const facultyPayload = {
        id: userId,
        user_id: userId,
        email: cleanedEmail,
        full_name: cleanedName,
        designation: designation.trim(),
        department,
        contact_number: contactNumber.trim(),
        sih_themes: sihThemes,
        areas_of_expertise: sihThemes,
      };

      const { error: profileError } = await supabase
        .from('faculty_mentors')
        .upsert(facultyPayload as any);

      if (profileError) {
        setIsLoading(false);
        setError(`Faculty Mentor DB insert failed: ${profileError.message}`);
        return;
      }
    } else {
      const studentPayload = {
        id: userId,
        email: cleanedEmail,
        full_name: cleanedName,
        roll_number: cleanedRoll,
        year_of_study: yearOfStudy,
        gender,
        skills,
        role: 'student' as const,
      };

      const { error: profileError } = await supabase
        .from('users')
        .upsert(studentPayload as any);

      if (profileError) {
        setIsLoading(false);
        setError(profileError.message);
        return;
      }
    }

    if (refreshProfile) {
      await refreshProfile();
    }

    setIsLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push(selectedRole === 'faculty' ? '/dashboard/mentor' : '/dashboard/team');
    }, 1200);
  };

  /* ── Theme tokens ── */
  const bg = isDark ? '#0B0F12' : '#F8FAFC';
  const leftBg = isDark
    ? 'linear-gradient(135deg, #0B0F12 0%, #0d1a14 50%, #091413 100%)'
    : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)';
  const rightBg = isDark ? '#111827' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#0B0F12' : '#F9FAFB';
  const inputBorder = isDark ? '#27272A' : '#E5E7EB';
  const textPrimary = isDark ? '#ffffff' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const textSub = isDark ? '#64748B' : '#94A3B8';

  if (!mounted) return null;

  /* ── Shared input style helper ── */
  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: textPrimary,
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = '#22C55E');
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = inputBorder);

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: bg, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      {/* ═══════════════════════════════════════
          LEFT PANEL — Brand
      ═══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden"
        style={{ background: leftBg }}
      >
        {/* Grid bg */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#22C55E 1px,transparent 1px),linear-gradient(90deg,#22C55E 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)', boxShadow: '0 4px 15px rgba(34,197,94,0.35)' }}
            >
              <span className="text-black font-black text-sm">CG</span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#22C55E' }}>CampusGrid</p>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: textMuted }}>GL Bajaj • SIH 2026</p>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8 py-8">
          <div
            className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full border mb-2"
            style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#22C55E' }}>Registration Open — SIH 2026</span>
          </div>

          <div>
            <h1
              className="text-3xl xl:text-4xl font-extrabold leading-[1.1] tracking-tight mb-4"
              style={{ color: textPrimary }}
            >
              Join the nation's
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #22C55E, #10B981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                biggest hackathon
              </span>
            </h1>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: textMuted }}>
              Create your account, pick your role, and start building the future. Students form teams; Faculty Mentors guide them.
            </p>
          </div>

          {/* Role preview cards */}
          <div className="space-y-3">
            {[
              { icon: GraduationCap, label: 'Student / Team Lead', desc: 'Register your 6-member team and compete.', color: '#22C55E' },
              { icon: BookOpen, label: 'Faculty Mentor', desc: 'Guide teams and track their SIH progress.', color: '#818CF8' },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.label}
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}
                  >
                    <Icon size={16} style={{ color: r.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: textPrimary }}>{r.label}</p>
                    <p className="text-[11px]" style={{ color: textMuted }}>{r.desc}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto" style={{ color: textSub }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: textSub }}>
            Organized by Institution's Innovation Council (IIC)<br />GL Bajaj Group of Institutions
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Registration Form
      ═══════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-start px-5 py-10 sm:px-8 overflow-y-auto"
        style={{ backgroundColor: rightBg }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-7">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}
          >
            <span className="text-black font-black text-xs">CG</span>
          </div>
          <p className="text-sm font-bold tracking-[0.12em] uppercase" style={{ color: '#22C55E' }}>CampusGrid</p>
        </div>

        <div className="w-full max-w-lg">
          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: textPrimary }}>Create your account</h2>
            <p className="text-sm mt-1.5" style={{ color: textMuted }}>
              Already registered?{' '}
              <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#22C55E' }}>
                Sign in here
              </Link>
            </p>
          </div>

          {/* ── STEP 1: Role Selector ── */}
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>
              I am joining as…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Student Card */}
              <button
                id="role-student-card"
                type="button"
                onClick={() => setSelectedRole('student')}
                className="relative flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: selectedRole === 'student' ? 'rgba(34,197,94,0.08)' : cardBg,
                  border: `2px solid ${selectedRole === 'student' ? '#22C55E' : cardBorder}`,
                  boxShadow: selectedRole === 'student' ? '0 0 0 4px rgba(34,197,94,0.08)' : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <GraduationCap size={18} style={{ color: '#22C55E' }} />
                </div>
                <p className="text-sm font-bold mb-0.5" style={{ color: textPrimary }}>Student</p>
                <p className="text-[11px] leading-tight" style={{ color: textMuted }}>Team Lead or Member</p>
                {selectedRole === 'student' && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#22C55E' }}
                  >
                    <CheckCircle size={12} color="#000" />
                  </div>
                )}
              </button>

              {/* Faculty Card */}
              <button
                id="role-faculty-card"
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className="relative flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: selectedRole === 'faculty' ? 'rgba(129,140,248,0.08)' : cardBg,
                  border: `2px solid ${selectedRole === 'faculty' ? '#818CF8' : cardBorder}`,
                  boxShadow: selectedRole === 'faculty' ? '0 0 0 4px rgba(129,140,248,0.08)' : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)' }}
                >
                  <BookOpen size={18} style={{ color: '#818CF8' }} />
                </div>
                <p className="text-sm font-bold mb-0.5" style={{ color: textPrimary }}>Faculty Mentor</p>
                <p className="text-[11px] leading-tight" style={{ color: textMuted }}>Guide & evaluate teams</p>
                {selectedRole === 'faculty' && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#818CF8' }}
                  >
                    <CheckCircle size={12} color="#000" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ── STEP 2: Form (only shown after role selected) ── */}
          {selectedRole && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Alerts */}
              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
                >
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <span>Account created! Check your email to verify. Redirecting…</span>
                </div>
              )}

              {/* ── Common Fields ── */}
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    maxLength={60}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>College Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                    placeholder={`you${ALLOWED_DOMAINS[0]}`}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: textSub }}>Only {ALLOWED_DOMAINS.join(' / ')} emails accepted.</p>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 chars"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70" style={{ color: textMuted }}>
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Confirm</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                    <input
                      id="reg-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70" style={{ color: textMuted }}>
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ══ STUDENT-ONLY FIELDS ══ */}
              {selectedRole === 'student' && (
                <>
                  <div
                    className="pt-3 mt-1 border-t"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#22C55E' }}>
                      <GraduationCap size={13} />
                      Student Details
                    </p>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Roll Number</label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                      <input
                        id="reg-roll-number"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        required
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        placeholder="e.g. 2200290100001"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all font-mono"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: textSub }}>Only numbers allowed (10-15 digits, e.g. 2200290100001).</p>
                  </div>

                  {/* Year of Study */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>
                      Year of Study <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="relative">
                      <BookOpen size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                      <select
                        id="reg-year-of-study"
                        required
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all cursor-pointer"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      >
                        <option value="" disabled style={{ background: isDark ? '#0F172A' : '#FFFFFF', color: textMuted }}>Select Year of Study</option>
                        <option value="1st Year" style={{ background: isDark ? '#0F172A' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }}>1st Year</option>
                        <option value="2nd Year" style={{ background: isDark ? '#0F172A' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }}>2nd Year</option>
                        <option value="3rd Year" style={{ background: isDark ? '#0F172A' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }}>3rd Year</option>
                        <option value="4th Year" style={{ background: isDark ? '#0F172A' : '#FFFFFF', color: isDark ? '#FFF' : '#000' }}>4th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Gender Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>
                      Gender <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all"
                        style={{
                          background: gender === 'male' ? 'rgba(96,165,250,0.15)' : inputBg,
                          borderColor: gender === 'male' ? '#60A5FA' : inputBorder,
                          color: gender === 'male' ? '#60A5FA' : textMuted,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{
                            background: gender === 'male' ? '#60A5FA' : 'rgba(255,255,255,0.05)',
                            color: gender === 'male' ? '#000' : textMuted,
                          }}
                        >
                          B
                        </div>
                        Boy
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all"
                        style={{
                          background: gender === 'female' ? 'rgba(244,114,182,0.15)' : inputBg,
                          borderColor: gender === 'female' ? '#F472B6' : inputBorder,
                          color: gender === 'female' ? '#F472B6' : textMuted,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                          style={{
                            background: gender === 'female' ? '#F472B6' : 'rgba(255,255,255,0.05)',
                            color: gender === 'female' ? '#000' : textMuted,
                          }}
                        >
                          G
                        </div>
                        Girl
                      </button>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
                      <Tag size={12} className="inline mr-1.5" />
                      Your Skills
                    </label>

                    {/* Predefined Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {SKILL_OPTIONS.map((opt) => {
                        const active = skills.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleSkill(opt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                            style={
                              active
                                ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.45)', color: '#22C55E' }
                                : { background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textMuted }
                            }
                          >
                            {opt}
                            {active && <X size={10} className="ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Skill Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomSkill();
                          }
                        }}
                        placeholder="Type & add custom skill..."
                        className="flex-1 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button
                        type="button"
                        onClick={addCustomSkill}
                        disabled={!customSkill.trim()}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          border: '1px solid rgba(34,197,94,0.4)',
                          color: '#22C55E',
                        }}
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>

                    {/* Selected Badges */}
                    {skills.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-semibold" style={{ color: '#22C55E' }}>Selected ({skills.length}):</span>
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22C55E' }}
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className="hover:opacity-75 ml-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ══ FACULTY-ONLY FIELDS ══ */}
              {selectedRole === 'faculty' && (
                <>
                  <div
                    className="pt-3 mt-1 border-t"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#818CF8' }}>
                      <BookOpen size={13} />
                      Faculty Details
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Designation</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#818CF8' }} />
                        <input
                          id="reg-designation"
                          type="text"
                          required
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Asst. Professor"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Contact No.</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#818CF8' }} />
                        <input
                          id="reg-contact"
                          type="tel"
                          inputMode="tel"
                          maxLength={13}
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value.replace(/[^\d+]/g, '').slice(0, 13))}
                          placeholder="+919876543210"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Department</label>
                    <select
                      id="reg-department"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
                      style={{ ...inputStyle }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    >
                      <option value="" disabled>Select your department…</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d} style={{ background: isDark ? '#111827' : '#fff' }}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* SIH Themes */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
                      SIH Themes of Interest{' '}
                      <span className="normal-case font-normal" style={{ color: textSub }}>(multi-select)</span>
                    </label>
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
                    >
                      <MultiSelect options={SIH_THEMES} selected={sihThemes} onToggle={toggleTheme} isDark={isDark} />
                    </div>
                    {sihThemes.length > 0 && (
                      <p className="text-[11px] mt-1.5" style={{ color: '#818CF8' }}>✓ {sihThemes.length} of 17 themes selected</p>
                    )}
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading || success || !IS_SUPABASE_CONFIGURED}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: selectedRole === 'faculty'
                    ? 'linear-gradient(135deg, #818CF8, #6366F1)'
                    : 'linear-gradient(135deg, #22C55E, #10B981)',
                  color: selectedRole === 'faculty' ? '#fff' : '#000',
                  boxShadow: selectedRole === 'faculty'
                    ? '0 4px 15px rgba(129,140,248,0.3)'
                    : '0 4px 15px rgba(34,197,94,0.3)',
                }}
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                ) : success ? (
                  <><CheckCircle size={16} /> Account created!</>
                ) : (
                  <>Create Account <ArrowRight size={15} /></>
                )}
              </button>

              {!IS_SUPABASE_CONFIGURED && (
                <p className="text-center text-xs" style={{ color: '#F59E0B' }}>
                  ⚠️ Supabase not configured — set env vars to enable registration.
                </p>
              )}
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: textSub }}>
            By registering you agree to the{' '}
            <span className="underline cursor-pointer" style={{ color: '#22C55E' }}>Terms of Use</span>
            {' '}of the IIC Campus Portal.
          </p>
        </div>
      </div>
    </div>
  );
}
