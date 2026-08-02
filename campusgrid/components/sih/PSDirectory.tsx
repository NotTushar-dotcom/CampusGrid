'use client';

import React from 'react';
import { Clock, Bell, FileSearch } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function PSDirectory() {
  const { isDark } = useTheme();

  return (
    <section
      id="ps-directory"
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'}`}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Section Header ── */}
        <div className="text-center mb-10">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full mb-5 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
            }`}
          >
            <FileSearch size={13} className="text-[#22C55E]" />
            <span className={`text-xs font-medium ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              SIH 2026 PS Library
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Problem Statement{' '}
            <span className="bg-gradient-to-r from-[#22C55E] to-[#10B981] bg-clip-text text-transparent">
              Directory
            </span>
          </h2>
          <p className={`mt-3 text-sm max-w-md mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            Browse, search, and select your team&apos;s problem statement
          </p>
        </div>

        {/* ── Coming Soon Card ── */}
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="relative max-w-lg w-full text-center">
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-3xl opacity-30 blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
              }}
            />

            {/* Card */}
            <div
              className={`relative border rounded-3xl p-10 flex flex-col items-center gap-6 shadow-xl ${
                isDark
                  ? 'bg-[#18181B] border-[#27272A] shadow-black/30'
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}
            >
              {/* Animated clock icon */}
              <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                <Clock
                  size={36}
                  className="text-[#22C55E] animate-spin"
                  style={{ animationDuration: '8s' }}
                />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-400">Not Yet Released</span>
              </div>

              <div className="space-y-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Problem Statements Coming Soon
                </h3>
                <p className={`text-sm leading-relaxed max-w-sm mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                  SIH 2026 problem statements have not been rolled out yet. Check back here once
                  they are officially released — we&apos;ll update the directory immediately.
                </p>
              </div>

              {/* Info row */}
              <div
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-xs ${
                  isDark
                    ? 'bg-[#0B0F12] border-[#27272A] text-[#52525B]'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <Bell size={13} className="text-[#22C55E] flex-shrink-0" />
                <span>
                  Stay tuned — problem statements will appear here as soon as SIH officially releases them.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
