'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Menu, X, Sun, Moon,
  LogOut, Settings, ExternalLink, UserCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/theme/ThemeProvider';
import OnboardingForm from '@/components/auth/OnboardingForm';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Problem Statements', href: '#ps-directory', badge: 'Coming Soon' },
  { label: 'SIH Guidelines', href: '#rules' },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Close user menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  /* Glass surface classes depending on theme */
  const glassClasses = isDark
    ? 'bg-slate-900/25 border-white/8 shadow-black/30'
    : 'bg-white/55 border-slate-200/60 shadow-slate-200/40';

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverLink = isDark
    ? 'hover:text-white hover:bg-white/5'
    : 'hover:text-slate-900 hover:bg-slate-100/60';

  return (
    <>
      {/* ─── Sticky floating pill navbar ─── */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-4">
        <div
          className={`max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-lg transition-all duration-300 ${glassClasses}`}
        >

          {/* ── LEFT: Brand ── */}
          <a href="#home" className="flex items-center gap-2.5 group flex-shrink-0">
            {/* GL Bajaj Logo */}
            <Image
              src="/GL-BAJAJ-LOGO-1.png"
              alt="GL Bajaj Logo"
              width={36}
              height={36}
              className="object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-sm tracking-widest ${textPrimary} group-hover:text-[#22C55E] transition-colors`}>
                GL BAJAJ
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 leading-none">
                SIH 2026
              </span>
            </div>
          </a>

          {/* ── CENTER: Desktop Nav Links ── */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${textMuted} ${hoverLink}`}
              >
                {link.label}
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          {/* ── RIGHT: Actions ── */}
          <div className="flex items-center gap-1.5">
            {/* IIC Helpdesk — desktop only */}
            <a
              href="#helpdesk"
              className={`hidden md:flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${textMuted} ${hoverLink}`}
            >
              <ExternalLink size={11} />
              IIC Helpdesk
            </a>

            {/* Theme Toggle */}
            <motion.button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-full transition-all duration-200 ${textMuted} ${hoverLink}`}
            >
              {mounted ? (
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </motion.div>
              ) : (
                <Sun size={15} />
              )}
            </motion.button>

            {/* ── Auth section ── */}
            {user ? (
              /* Logged-in: avatar pill with dropdown (visible on all breakpoints) */
              <div className="relative" ref={userMenuRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-black text-xs font-bold transition-all duration-200"
                >
                  <span>{initials}</span>
                  <ChevronDown size={11} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-3 w-52 rounded-2xl border shadow-xl overflow-hidden ${
                        isDark
                          ? 'bg-slate-900/95 border-white/10 shadow-black/50'
                          : 'bg-white/95 border-slate-200 shadow-slate-200'
                      }`}
                    >
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                        <p className={`text-sm font-semibold truncate ${textPrimary}`}>{displayName}</p>
                        <p className={`text-xs truncate ${textMuted}`}>{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut size={13} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Logged-out desktop: single account icon → /login */
              <Link
                id="navbar-account-btn"
                href="/login"
                aria-label="Sign in"
                className={`hidden lg:flex p-2 rounded-full transition-all duration-200 ${textMuted} ${hoverLink}`}
              >
                <UserCircle2 size={20} />
              </Link>
            )}

            {/* Mobile hamburger — only on small screens */}
            <button
              id="mobile-menu-btn"
              aria-label="Toggle mobile menu"
              className={`lg:hidden p-2 rounded-full transition-all duration-200 ${textMuted} ${hoverLink}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Glass Slide-Down Panel ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={`lg:hidden mt-2 max-w-6xl mx-auto rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden ${
                isDark
                  ? 'bg-slate-900/85 border-white/10 shadow-black/50'
                  : 'bg-white/90 border-slate-200/80 shadow-slate-200'
              }`}
            >
              <div className="p-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 ${textMuted} ${hoverLink}`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        {link.badge}
                      </span>
                    )}
                  </a>
                ))}

                <div className={`border-t my-1 ${isDark ? 'border-white/10' : 'border-slate-100'}`} />

                <a
                  href="#helpdesk"
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${textMuted} ${hoverLink}`}
                >
                  <ExternalLink size={13} /> IIC Helpdesk
                </a>

                {/* Auth options — ONLY inside mobile menu */}
                {!user ? (
                  <div className="flex gap-2 pt-1">
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className={`flex-1 py-3 text-center font-semibold rounded-xl text-sm transition-all border ${textMuted}`}
                      style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }}
                    >
                      Register
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 py-3 text-center bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold rounded-xl text-sm transition-all"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Onboarding modal (profile completion) */}
      <OnboardingForm isOpen={onboardOpen} onClose={() => setOnboardOpen(false)} />
    </>
  );
}
