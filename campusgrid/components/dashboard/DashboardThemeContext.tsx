'use client';

import React from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

/* ─────────────────────────────────────────────── */
/*  Backwards-compatible Provider                  */
/*  (Main layout already wraps app in ThemeProvider)*/
/* ─────────────────────────────────────────────── */
export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ─────────────────────────────────────────────── */
/*  Hook: connects directly to central useTheme    */
/* ─────────────────────────────────────────────── */
export function useDashboardTheme() {
  const { isDark, toggleTheme } = useTheme();
  return {
    isDark,
    toggle: toggleTheme,
  };
}

/* ─────────────────────────────────────────────── */
/*  Glass card style helper                        */
/* ─────────────────────────────────────────────── */
export function glassCard(isDark: boolean, glow = false): React.CSSProperties {
  return {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${
      glow
        ? 'rgba(34,197,94,0.5)'
        : isDark
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(148,163,184,0.35)'
    }`,
    borderRadius: '16px',
    boxShadow: glow
      ? '0 0 24px rgba(34,197,94,0.15), 0 4px 24px rgba(0,0,0,0.25)'
      : isDark
        ? '0 4px 24px rgba(0,0,0,0.40)'
        : '0 2px 16px rgba(0,0,0,0.06)',
    transition: 'border 0.2s ease, box-shadow 0.2s ease',
  };
}

/* ─────────────────────────────────────────────── */
/*  Bg / text colour helpers                       */
/* ─────────────────────────────────────────────── */
export function dashBg(isDark: boolean) {
  return isDark ? '#0B0F12' : '#F1F5F9';
}

export function dashText(isDark: boolean, muted = false) {
  if (muted) return isDark ? '#94A3B8' : '#64748B';
  return isDark ? '#FFFFFF' : '#0F172A';
}

export function dashBorder(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.25)';
}
