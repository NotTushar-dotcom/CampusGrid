'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, Flag } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface TimelineStep {
  id: number;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  icon: React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 1,
    date: 'July 29, 2026',
    title: 'Team Registration Opens',
    description: 'Register your 6-member team on CampusGrid. Ensure your team includes at least one female participant.',
    status: 'active',
    icon: Flag,
  },
  {
    id: 2,
    date: 'Aug 15, 2026',
    title: 'Internal Idea Submission Deadline',
    description: 'Submit your 1-page idea document and selected Problem Statement ID via the portal. Late submissions will not be accepted.',
    status: 'upcoming',
    icon: Calendar,
  },
  {
    id: 3,
    date: 'Aug 22, 2026',
    title: 'Mentor Review Round',
    description: "Faculty mentors will review submissions and provide feedback. Teams may be asked to pivot or refine their approach.",
    status: 'upcoming',
    icon: Clock,
  },
  {
    id: 4,
    date: 'Sep 1, 2026',
    title: 'Prototype Review',
    description: 'Present a working prototype or high-fidelity mockup to the internal jury. Hardware teams must show a functional PoC.',
    status: 'upcoming',
    icon: Calendar,
  },
  {
    id: 5,
    date: 'Sep 8, 2026',
    title: 'Final Campus Pitching Day',
    description: '10-minute pitch + 5-minute Q&A before the selection committee. Top teams will represent GL Bajaj at SIH 2026 Nationals.',
    status: 'upcoming',
    icon: Calendar,
  },
  {
    id: 6,
    date: 'Sep 10, 2026',
    title: 'Selected Teams Announced',
    description: 'Results published on CampusGrid and the official institute notice board. Selected teams will receive onboarding details for national SIH.',
    status: 'upcoming',
    icon: CheckCircle2,
  },
];

/* ── Status style factories that return theme-aware classes ── */
function getStatusStyles(status: TimelineStep['status'], isDark: boolean) {
  if (status === 'completed') {
    return {
      dot: 'bg-[#22C55E] border-[#22C55E]',
      card: isDark ? 'border-[#22C55E]/30' : 'border-[#22C55E]/40',
      badge: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
      badgeLabel: 'Completed',
    };
  }
  if (status === 'active') {
    return {
      dot: 'bg-[#22C55E] border-[#22C55E] shadow-lg shadow-[#22C55E]/50',
      card: isDark ? 'border-[#22C55E]/60 shadow-md shadow-[#22C55E]/10' : 'border-[#22C55E]/70 shadow-md shadow-[#22C55E]/15',
      badge: 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/50 animate-pulse',
      badgeLabel: '🟢 Active Now',
    };
  }
  // upcoming
  return {
    dot: isDark ? 'bg-[#18181B] border-[#3F3F46]' : 'bg-slate-200 border-slate-300',
    card: isDark ? 'border-[#27272A]/60' : 'border-slate-200',
    badge: isDark ? 'bg-[#27272A] text-[#52525B] border-[#3F3F46]' : 'bg-slate-100 text-slate-400 border-slate-200',
    badgeLabel: 'Upcoming',
  };
}

export default function TimelineSection() {
  const { isDark } = useTheme();

  return (
    <section
      id="timeline"
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'}`}
    >
      <div className="max-w-3xl mx-auto">

        {/* ── Section Header ── */}
        <div className="text-center mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full mb-5 ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
          >
            <Calendar size={13} className="text-[#22C55E]" />
            <span className={`text-xs font-medium ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              Campus Internal Schedule
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            SIH 2026{' '}
            <span className="bg-gradient-to-r from-[#22C55E] to-[#10B981] bg-clip-text text-transparent">
              Timeline
            </span>
          </h2>
          <p className={`mt-3 text-sm max-w-md mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            Key milestones for the GL Bajaj internal selection process
          </p>
        </div>

        {/* ── Timeline ── */}
        <div className="relative">
          {/* Vertical gradient line */}
          <div
            className={`absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[#22C55E] to-transparent ${isDark ? 'via-[#27272A]' : 'via-slate-300'
              }`}
          />

          <div className="space-y-5">
            {TIMELINE_STEPS.map((step) => {
              const styles = getStatusStyles(step.status, isDark);
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative flex gap-5">
                  {/* Dot */}
                  <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center z-10">
                    <div className={`w-4 h-4 rounded-full border-2 ${styles.dot} transition-all`} />
                  </div>

                  {/* Card */}
                  <div
                    className={`group flex-1 border ${styles.card} rounded-xl p-5 mb-1 hover:border-[#22C55E]/40 transition-all duration-300 ${isDark ? 'bg-[#18181B]' : 'bg-white'
                      }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-mono ${isDark ? 'text-[#52525B]' : 'text-slate-400'}`}>
                            Step {step.id}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles.badge}`}>
                            {styles.badgeLabel}
                          </span>
                        </div>
                        <h3
                          className={`text-base font-semibold group-hover:text-[#22C55E] transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs whitespace-nowrap ${isDark ? 'text-[#52525B]' : 'text-slate-400'}`}>
                        <Calendar size={11} />
                        {step.date}
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
