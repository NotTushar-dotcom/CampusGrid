'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ALLOWED_DOMAINS =
  (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? '@glbajajgroup.org')
    .split(',')
    .map((d) => d.trim().toLowerCase());

function validateDomain(email: string): boolean {
  const lower = email.toLowerCase();
  return ALLOWED_DOMAINS.some((domain) => lower.endsWith(domain));
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  if (!isOpen) return null;

  const reset = () => {
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Authentication service is not configured.'); return; }
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Logged in successfully!');
      setTimeout(() => { onSuccess?.(); onClose(); }, 800);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Authentication service is not configured.'); return; }
    setError(null);

    if (!validateDomain(email)) {
      setError(
        `Only college email addresses are allowed. Accepted domains: ${ALLOWED_DOMAINS.join(', ')}`
      );
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Please check your email to verify, then complete your profile.');
      setTimeout(() => { onSuccess?.(); onClose(); }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-campus-card border border-campus-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {tab === 'login' ? 'Welcome back' : 'Join CampusGrid'}
              </h2>
              <p className="text-sm text-campus-mint/60 mt-0.5">
                {tab === 'login'
                  ? 'Sign in to your student account'
                  : 'Create your student account'}
              </p>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-2 rounded-lg text-campus-mint/60 hover:text-campus-mint hover:bg-campus-border/30 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 p-1 bg-campus-bg rounded-xl">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); reset(); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-campus-primary text-white shadow-sm'
                    : 'text-campus-mint/60 hover:text-campus-mint'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={tab === 'login' ? handleLogin : handleSignup}
          className="px-6 pb-6 space-y-4"
        >
          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3 bg-campus-primary/10 border border-campus-primary/30 rounded-xl text-campus-mint text-sm">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name (signup only) */}
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-primary" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-4 py-2.5 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider">
              College Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-primary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`you${ALLOWED_DOMAINS[0]}`}
                className="w-full pl-9 pr-4 py-2.5 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors"
              />
            </div>
            {tab === 'signup' && (
              <p className="text-xs text-campus-mint/40">
                Only {ALLOWED_DOMAINS.join(' / ')} emails accepted
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-campus-mint/40 hover:text-campus-mint transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-campus-primary hover:bg-[#34725d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 mt-2"
          >
            {isLoading
              ? 'Please wait...'
              : tab === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
