'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  Users, Zap, Shield, ArrowRight, Loader2, X, GraduationCap, BookOpen, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { IS_SUPABASE_CONFIGURED } from '@/lib/supabase/fallback';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { User } from '@/types';

/* ── Google SVG ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path fill="#4285F4" d="M47.53 24.56c0-1.64-.15-3.22-.42-4.74H24v8.97h13.19c-.57 3.01-2.27 5.56-4.83 7.27v6.04h7.82c4.57-4.2 7.35-10.4 7.35-17.54z" />
    <path fill="#34A853" d="M24 48c6.6 0 12.14-2.19 16.18-5.9l-7.82-6.04c-2.19 1.47-4.99 2.34-8.36 2.34-6.43 0-11.88-4.34-13.82-10.18H2.1v6.24C6.12 42.63 14.44 48 24 48z" />
    <path fill="#FBBC05" d="M10.18 28.22A14.87 14.87 0 0 1 9.41 24c0-1.47.25-2.9.77-4.22v-6.24H2.1A23.97 23.97 0 0 0 0 24c0 3.88.93 7.55 2.1 10.46l8.08-6.24z" />
    <path fill="#EA4335" d="M24 9.6c3.62 0 6.87 1.24 9.43 3.68l7.07-7.07C36.14 2.19 30.6 0 24 0 14.44 0 6.12 5.37 2.1 13.54l8.08 6.24C12.12 13.94 17.57 9.6 24 9.6z" />
  </svg>
);

/* ── Value propositions shown on the left panel ── */
const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Team Formation Hub',
    desc: 'Find teammates, post open slots, match skills.',
  },
  {
    icon: Zap,
    title: 'Live Problem Statements',
    desc: 'Official SIH 2026 PS directory updated in real-time.',
  },
  {
    icon: Shield,
    title: 'Campus Nomination',
    desc: 'Top 30 teams earn IIC-backed national SIH spots.',
  },
];

/* ── Live stats shown as chips ── */
const STATS = [
  { label: 'Active Teams', value: '350+', color: '#22C55E' },
  { label: 'SIH 2026', value: 'LIVE', color: '#F59E0B' },
  { label: 'PS Releasing', value: 'Soon', color: '#818CF8' },
];

function getRoleRedirect(role: User['role']): string {
  if (role === 'admin_spoc') return '/admin';
  if (role === 'faculty' || role === 'faculty_mentor') return '/dashboard/mentor';
  return '/dashboard/team';
}

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Google Account Chooser Modal State */
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customRole, setCustomRole] = useState<'student' | 'faculty' | 'admin_spoc'>('student');

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const errDesc = params.get('error_description');
      if (err || errDesc) {
        setError(errDesc || (err === 'oauth_failed' ? 'Google authentication failed or provider is disabled in Supabase.' : err));
      }
    }
  }, []);

  /* Auto-redirect if user is already signed in */
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: existingProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      const role = (existingProfile?.role ?? 'student') as User['role'];
      router.replace(getRoleRedirect(role));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Authentication service is not configured.'); return; }
    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setIsLoading(false);
      setError(authError?.message ?? 'Login failed. Please try again.');
      return;
    }

    // Fetch role from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    setIsLoading(false);
    setSuccess(true);

    const role = (profile?.role ?? 'student') as User['role'];
    setTimeout(() => router.push(getRoleRedirect(role)), 600);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Authentication service is not configured. Please contact your administrator.');
      return;
    }
    setIsGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // signInWithOAuth redirects the browser on success — if we reach here it failed
    if (error) {
      setIsGoogleLoading(false);
      if (error.message.toLowerCase().includes('provider') || error.message.toLowerCase().includes('disabled')) {
        setError(
          'Google Sign-In is not enabled. Please ask your admin to enable the Google provider in Supabase, or use email & password above.'
        );
      } else {
        setError(`Google Sign-In failed: ${error.message}`);
      }
    }
    // If no error: browser is being redirected to Google — loader stays visible
  };

  /* Fallback: manual email lookup (only used if real Google OAuth is unavailable) */
  const executeGoogleAuth = async (accountEmail: string, _accountName: string, _role: User['role']) => {
    setIsGoogleLoading(true);
    setShowGoogleModal(false);
    setError(null);

    const emailToCheck = (accountEmail || customGoogleEmail || '').toLowerCase().trim();

    if (!emailToCheck.endsWith('@glbajajgroup.org')) {
      setError('Only @glbajajgroup.org email addresses are allowed.');
      setIsGoogleLoading(false);
      return;
    }

    if (!supabase) {
      setError('Authentication service is not configured.');
      setIsGoogleLoading(false);
      return;
    }

    // Look up the real profile from the DB using the email they entered
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('role, roll_number, designation')
      .eq('email', emailToCheck)
      .maybeSingle();

    setIsGoogleLoading(false);

    if (lookupError) {
      setError('Could not verify your account. Please try email & password instead.');
      return;
    }

    if (!existingUser) {
      setError(`No registered account found for ${emailToCheck}. Please register first.`);
      return;
    }

    // Only redirect if fully registered
    const role = existingUser.role as User['role'];
    const isComplete =
      (role === 'student' && existingUser.roll_number) ||
      (role === 'faculty' && existingUser.designation) ||
      role === 'admin_spoc';

    if (!isComplete) {
      router.push('/register?unregistered=true');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(getRoleRedirect(role)), 600);
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
  const inputFocusBorder = '#22C55E';
  const textPrimary = isDark ? '#ffffff' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const textSub = isDark ? '#64748B' : '#94A3B8';

  if (!mounted) return null;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: bg, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      {/* ═══════════════════════════════════════
          LEFT PANEL — Brand & Stats
      ═══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden"
        style={{ background: leftBg }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#22C55E 1px,transparent 1px),linear-gradient(90deg,#22C55E 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Green glow orb */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image
              src="/GL-BAJAJ-LOGO-1.png"
              alt="GL Bajaj Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#22C55E' }}>CampusGrid</p>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: textMuted }}>GL Bajaj • SIH 2026</p>
            </div>
          </div>
        </div>

        {/* Center: Hero copy + stats */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-8 py-8">
          {/* Headline */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
              style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#22C55E' }}>Official Campus Portal</span>
            </div>

            <h1
              className="text-3xl xl:text-4xl font-extrabold leading-[1.1] tracking-tight mb-4"
              style={{ color: textPrimary }}
            >
              Welcome back to
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #22C55E, #10B981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CampusGrid
              </span>
            </h1>

            <p className="text-sm leading-relaxed max-w-sm" style={{ color: textMuted }}>
              Your portal to register teams, access official SIH 2026 problem statements, and get nominated for the national grand finale.
            </p>
          </div>

          {/* Live stat chips */}
          <div className="flex flex-wrap gap-2.5">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full border"
                style={{
                  background: `${s.color}10`,
                  borderColor: `${s.color}30`,
                }}
              >
                <span className="text-xs font-black" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs" style={{ color: textMuted }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Value props */}
          <div className="space-y-4">
            {VALUE_PROPS.map((vp) => {
              const Icon = vp.icon;
              return (
                <div key={vp.title} className="flex items-start gap-3.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    <Icon size={16} style={{ color: '#22C55E' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: textPrimary }}>{vp.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: textMuted }}>{vp.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: IIC tagline */}
        <div className="relative z-10">
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: textSub }}>
            Organized by Institution's Innovation Council (IIC)
            <br />GL Bajaj Group of Institutions
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Login Form
      ═══════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-start px-6 py-12 sm:px-10 overflow-y-auto"
        style={{ backgroundColor: rightBg }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}
          >
            <span className="text-black font-black text-xs">CG</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.12em] uppercase" style={{ color: '#22C55E' }}>CampusGrid</p>
            <p className="text-[9px] tracking-widest uppercase" style={{ color: textMuted }}>GL Bajaj • SIH 2026</p>
          </div>
        </div>

        <div className="w-full max-w-md my-auto">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: textPrimary }}>Sign in</h2>
            <p className="text-sm mt-1.5" style={{ color: textMuted }}>
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#22C55E' }}>
                Create one here
              </Link>
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            id="google-login-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-sm"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              color: textPrimary,
            }}
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: cardBorder }} />
            <span className="text-xs font-medium" style={{ color: textSub }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: cardBorder }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Success */}
            {success && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
              >
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <span>Login successful! Redirecting…</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>
                College Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@glbajajgroup.org"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: textPrimary,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                  onBlur={(e) => (e.target.style.borderColor = inputBorder)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#22C55E' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: textPrimary,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = inputFocusBorder)}
                  onBlur={(e) => (e.target.style.borderColor = inputBorder)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{ color: textMuted }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #22C55E, #10B981)',
                color: '#000',
                boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
              }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : success ? (
                <><CheckCircle size={16} /> Redirecting…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-8" style={{ color: textSub }}>
            By signing in you agree to the{' '}
            <span className="underline cursor-pointer" style={{ color: '#22C55E' }}>Terms of Use</span>
            {' '}of the IIC Campus Portal.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          GOOGLE ACCOUNT SELECTOR MODAL
      ═══════════════════════════════════════ */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl p-6 border shadow-2xl overflow-hidden"
            style={{
              background: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: textPrimary,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <GoogleIcon />
                <div>
                  <h3 className="font-bold text-base leading-tight">Sign in with Google</h3>
                  <p className="text-xs" style={{ color: textMuted }}>Choose an account to continue to CampusGrid</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs mb-3 font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
              Select Google Account:
            </p>

            {/* Account List */}
            <div className="space-y-2 mb-5">
              {/* Info: real accounts only */}
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-xs"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
              >
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>
                  Real Google OAuth is unavailable. Enter your registered <strong>@glbajajgroup.org</strong> email
                  below to sign in with your existing account.
                </span>
              </div>

            </div>

            {/* Email lookup fallback */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textMuted }}>
                Enter your registered email:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      executeGoogleAuth(customGoogleEmail, '', 'student');
                    }
                  }}
                  placeholder="yourname@glbajajgroup.org"
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-colors"
                  style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                />
                <button
                  type="button"
                  onClick={() => executeGoogleAuth(customGoogleEmail, '', 'student')}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#22C55E] hover:bg-[#16a34a] text-black transition-all"
                >
                  <Check size={16} />
                </button>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: textSub }}>
                Your role and redirect will be determined by your registered profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
