'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Users, Clock, Trophy, Award } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRealtimeStats } from '@/lib/hooks/useRealtimeStats';

/* ── Animation Variants ── */
const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay },
  },
});

const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, delay } },
});

export default function HeroSection() {
  const { isDark } = useTheme();
  const { user, profile, isLoading } = useAuth();
  const { studentRegistrations, teamsFormed, problemStatements, isLoading: statsLoading } = useRealtimeStats();
  const [mounted, setMounted] = useState(false);

  const heroStats = [
    {
      icon: Users,
      value: statsLoading ? '...' : teamsFormed > 0 ? `${teamsFormed}+` : `${teamsFormed}`,
      label: 'Campus Teams Registered',
    },
    {
      icon: Clock,
      value: typeof problemStatements === 'number' && problemStatements > 0 ? `${problemStatements}` : `${problemStatements}`,
      label: 'SIH Problem Statements',
      accent: true,
    },
    {
      icon: Trophy,
      value: 'Top 50',
      label: 'Teams Nominated',
    },
    {
      icon: Award,
      value: '₹1,00,000+',
      label: 'Incubation & Rewards',
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ─ Theme-aware classes ─ */
  const bg = isDark ? '#0B0F12' : '#F8FAFC';
  const fadeFrom = isDark ? '#0B0F12' : '#F8FAFC';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textHeadline = isDark ? 'text-white' : 'text-slate-900';
  const cardGlass = isDark
    ? 'bg-slate-900/60 border-white/8 shadow-black/30'
    : 'bg-white/75 border-slate-200/80 shadow-slate-100';
  const cardHover = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-white/90';
  const iconBox = isDark ? 'bg-[#22C55E]/10' : 'bg-[#059669]/10';
  const iconColor = isDark ? 'text-[#22C55E]' : 'text-[#059669]';
  const badgeBg = isDark ? 'bg-slate-800/80 border-white/8' : 'bg-white/80 border-slate-200';
  const secondaryBtn = isDark
    ? 'bg-slate-800/80 border-white/10 text-white hover:bg-slate-700/80 hover:border-white/20'
    : 'bg-white/80 border-slate-200 text-slate-900 hover:bg-white hover:border-slate-300';

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bg }}
    >
      {/* ── Background Mesh / Orbs ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#22C55E 1px, transparent 1px), linear-gradient(90deg, #22C55E 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Glow orb — top left */}
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(5,150,105,0.06)'} 0%, transparent 65%)`,
            filter: 'blur(40px)',
          }}
        />
        {/* Glow orb — bottom right */}
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)'} 0%, transparent 65%)`,
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* ── Hero Content Grid ── */}
      {/* Use visibility:hidden instead of null-return to avoid layout flash while preserving space */}
      <div
        className="relative z-10 flex-1 flex flex-col"
        style={{ visibility: mounted ? 'visible' : 'hidden' }}
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-32 pb-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-6 items-center min-h-[calc(100vh-14rem)]">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-7">

              {/* Badge */}
              <motion.div
                variants={fadeUp(0)}
                initial="hidden"
                animate="show"
                className="w-fit"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${badgeBg}`}>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse flex-shrink-0" />
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Official Campus Selection Round | SIH 2026
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp(0.1)} initial="hidden" animate="show">
                <h1
                  className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] ${textHeadline}`}
                >
                  Innovate For Bharat
                  <br />
                  Through{' '}
                  {/* NOTE: No text-glow-green here — text-shadow breaks WebkitTextFillColor:transparent */}
                  <span
                    className={
                      isDark
                        ? 'bg-gradient-to-r from-[#22C55E] via-[#10B981] to-[#34d399] bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-[#059669] via-[#10B981] to-[#22C55E] bg-clip-text text-transparent'
                    }
                  >
                    Smart India
                    <br className="sm:hidden" /> Hackathon
                  </span>
                </h1>
              </motion.div>

              {/* Sub-headline */}
              <motion.p
                variants={fadeUp(0.2)}
                initial="hidden"
                animate="show"
                className={`text-base sm:text-lg leading-relaxed max-w-lg ${textMuted}`}
              >
                The official GL Bajaj campus portal to{' '}
                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>register your teams</span>,
                access official guidelines, and get nominated for the{' '}
                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>National SIH Grand Finale</span>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUp(0.3)}
                initial="hidden"
                animate="show"
                className="flex flex-wrap items-center gap-3"
              >
                {/* Primary CTA — conditionally rendered based on auth state */}
                {isLoading ? (
                  /* Loading skeleton */
                  <div
                    id="cta-loading-skeleton"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#22C55E]/30 text-transparent font-bold text-sm select-none animate-pulse cursor-not-allowed"
                    aria-busy="true"
                    aria-label="Loading"
                  >
                    Register Your Team
                    <ArrowRight size={16} />
                  </div>
                ) : user && profile?.role === 'faculty' ? (
                  /* Faculty Mentor → Mentor Inbox */
                  <Link
                    id="cta-mentor-inbox"
                    href="/dashboard/mentor"
                    className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-sm transition-all duration-200 shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:-translate-y-0.5"
                  >
                    Go to Mentor Inbox
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                ) : user ? (
                  /* Student / Team Lead → Dashboard */
                  <Link
                    id="cta-dashboard"
                    href="/dashboard/team"
                    className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-sm transition-all duration-200 shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                ) : (
                  /* Unauthenticated → Register */
                  <Link
                    id="cta-register-team"
                    href="/register"
                    className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-sm transition-all duration-200 shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:-translate-y-0.5"
                  >
                    Register Your Team
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                )}

                {/* Secondary — scrolls to the RulesGrid section (#rules) */}
                <a
                  id="cta-guidelines"
                  href="#rules"
                  className={`group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold border backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${secondaryBtn}`}
                >
                  View SIH Guidelines
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    PS Releasing Soon
                  </span>
                </a>
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN: Image ── */}
            <motion.div
              variants={fadeIn(0.35)}
              initial="hidden"
              animate="show"
              className="lg:col-span-6 xl:col-span-7 relative h-64 sm:h-80 lg:h-[500px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sih-auditorium.png"
                alt="GL Bajaj students at Smart India Hackathon 2026"
                className="w-full h-full object-cover rounded-2xl"
              />
              {/* Left fade overlay */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(to right, ${fadeFrom} 0%, ${fadeFrom}55 20%, transparent 55%)`,
                }}
              />
              {/* Top fade */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(to bottom, ${fadeFrom}80 0%, transparent 30%)`,
                }}
              />
              {/* Subtle border */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: `inset 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'}`,
                }}
              />
            </motion.div>

          </div>
        </div>

        {/* ── Floating Stats Card ── */}
        <motion.div
          variants={fadeUp(0.5)}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pb-8"
        >
          <div
            className={`rounded-2xl border backdrop-blur-xl shadow-lg transition-colors duration-300 ${cardGlass}`}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 p-2">
              {heroStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`group relative flex items-center gap-3 p-5 rounded-xl transition-all duration-200 ${cardHover} ${i < heroStats.length - 1
                        ? `md:border-r ${isDark ? 'md:border-white/8' : 'md:border-slate-200/70'}`
                        : ''
                      }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors duration-200 ${iconBox} group-hover:scale-105`}>
                      <Icon size={18} className={iconColor} />
                    </div>
                    {/* Text */}
                    <div className="min-w-0">
                      <p
                        className={`font-extrabold leading-tight text-base sm:text-lg ${stat.accent ? iconColor : textHeadline
                          }`}
                      >
                        {stat.value}
                      </p>
                      <p className={`text-xs mt-0.5 leading-tight ${textMuted}`}>{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer sub-banner */}
          <motion.p
            variants={fadeUp(0.65)}
            initial="hidden"
            animate="show"
            className={`mt-5 text-center text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-slate-400'
              }`}
          >
            Organized by Institution&#39;s Innovation Council (IIC) — GL Bajaj Group of Institutions
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
