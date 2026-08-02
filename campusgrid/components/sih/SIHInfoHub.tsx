'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import TimelineSection from './TimelineSection';
import RulesGrid from './RulesGrid';
import PSDirectory from './PSDirectory';

export default function SIHInfoHub() {
  const { isDark } = useTheme();

  return (
    <section
      id="sih-hub"
      className={`relative transition-colors duration-300 ${isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'}`}
    >
      {/* ── Section Divider / Hero Banner ── */}
      <div className="relative py-12 px-4 text-center">
        {/* Thin gradient rule */}
        <div className="absolute inset-0 flex items-center">
          <div
            className={`w-full h-px bg-gradient-to-r from-transparent to-transparent ${
              isDark ? 'via-[#27272A]' : 'via-slate-200'
            }`}
          />
        </div>
        {/* Centered pill */}
        <div
          className={`relative inline-flex items-center gap-3 px-6 py-3 rounded-full border shadow-md ${
            isDark
              ? 'bg-[#0B0F12] border-[#27272A] shadow-black/30'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-center justify-center">
            <Lightbulb size={16} className="text-[#22C55E]" />
          </div>
          <div className="text-left">
            <p className={`text-[10px] font-semibold tracking-widest uppercase ${isDark ? 'text-[#52525B]' : 'text-slate-400'}`}>
              Flagship Event
            </p>
            <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              SIH 2026{' '}
              <span className="bg-gradient-to-r from-[#22C55E] to-[#10B981] bg-clip-text text-transparent">
                Info Hub
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 ml-1 px-2.5 py-1 bg-[#22C55E]/10 border border-[#22C55E]/25 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] font-semibold text-[#22C55E]">Live</span>
          </div>
        </div>
      </div>

      {/* ── Modules ── */}
      <TimelineSection />
      <RulesGrid />
      <PSDirectory />
    </section>
  );
}
