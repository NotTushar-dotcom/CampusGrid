'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useRealtimeStats } from '@/lib/hooks/useRealtimeStats';

interface Stat {
  label: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  description: string;
}

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = Math.ceil((target || 1) / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
}

function StatCard({ stat, trigger, isDark }: { stat: Stat; trigger: boolean; isDark: boolean }) {
  const numericValue = typeof stat.value === 'number' ? stat.value : 0;
  const count = useCountUp(numericValue, 1200, trigger);

  const displayValue =
    typeof stat.value === 'number'
      ? `${stat.prefix ?? ''}${count}${stat.suffix ?? ''}`
      : stat.value;

  return (
    <div
      className={`group flex flex-col items-center px-6 py-6 border rounded-2xl transition-all duration-300 ${
        isDark
          ? 'bg-[#18181B] border-[#27272A] hover:border-[#22C55E]/40 hover:shadow-md hover:shadow-[#22C55E]/8'
          : 'bg-white border-slate-200 hover:border-[#22C55E]/50 hover:shadow-md hover:shadow-[#22C55E]/10'
      }`}
    >
      <div
        className={`text-2xl sm:text-3xl font-extrabold transition-colors duration-200 group-hover:text-[#22C55E] ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {displayValue}
      </div>
      <div className="text-sm font-medium text-[#22C55E] mt-1">{stat.label}</div>
      <div className={`text-xs mt-1 text-center ${isDark ? 'text-[#52525B]' : 'text-slate-400'}`}>
        {stat.description}
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { isDark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { studentRegistrations, teamsFormed, problemStatements } = useRealtimeStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTriggered(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats: Stat[] = [
    {
      label: 'Student Registrations',
      value: studentRegistrations,
      suffix: studentRegistrations > 0 ? '+' : '',
      description: 'Verified campus students',
    },
    {
      label: 'Teams Formed',
      value: teamsFormed,
      suffix: teamsFormed > 0 ? '+' : '',
      description: 'Competing in SIH 2026',
    },
    {
      label: 'Problem Statements',
      value: problemStatements,
      suffix: '',
      description: 'Software & Hardware tracks (Not released yet)',
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'
      }`}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} trigger={triggered} isDark={isDark} />
        ))}
      </div>
    </section>
  );
}

