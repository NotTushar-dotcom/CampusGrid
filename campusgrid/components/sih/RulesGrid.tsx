'use client';

import React from 'react';
import {
  GraduationCap,
  Users,
  FileSearch,
  Upload,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface Rule {
  id: string;
  icon: React.ElementType;
  title: string;
  points: string[];
  highlight?: string;
}

const RULES: Rule[] = [
  {
    id: 'eligibility',
    icon: GraduationCap,
    title: 'Eligibility',
    points: [
      'Currently enrolled students of GL Bajaj only',
      'All year groups (1st to 4th year) eligible',
      'Valid college ID required for verification',
      'Faculty/staff are not eligible as team members',
    ],
  },
  {
    id: 'team-size',
    icon: Users,
    title: 'Team Composition',
    points: [
      'Exactly 6 members per team (no more, no less)',
      'At least 1 female participant — mandatory',
      'Cross-department and cross-year teams encouraged',
      'One designated Team Leader per team',
    ],
  },
  {
    id: 'ps-selection',
    icon: FileSearch,
    title: 'Problem Statement Selection',
    points: [
      'Each team selects exactly one Problem Statement (PS)',
      'Software or Hardware track — clearly declare at registration',
      'PS changes not permitted after the internal deadline',
      'Multiple teams may work on the same PS',
    ],
  },
  {
    id: 'submission',
    icon: Upload,
    title: 'Submission Requirements',
    points: [
      '1-page Idea Abstract (PDF format)',
      'Team Composition form with roll numbers',
      'GitHub/GitLab repo link (for software PS)',
      'Hardware teams: include Bill of Materials (BoM)',
    ],
  },
  {
    id: 'judging',
    icon: Scale,
    title: 'Judging Criteria',
    points: [
      'Innovation & Novelty (25 points)',
      'Technical Feasibility (25 points)',
      'Impact & Scalability (20 points)',
      'Presentation & Communication (20 points)',
      'Prototype Quality (10 points)',
    ],
  },
  {
    id: 'conduct',
    icon: ShieldCheck,
    title: 'Code of Conduct',
    points: [
      'Original work only — plagiarism results in disqualification',
      'Respectful behavior toward all participants and judges',
      'No use of AI-generated content without disclosure',
      'Teams must be present in-person for pitching day',
    ],
  },
];

export default function RulesGrid() {
  const { isDark } = useTheme();

  return (
    <section
      id="rules"
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'
      }`}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Section Header ── */}
        <div className="text-center mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full mb-5 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <Scale size={13} className="text-[#22C55E]" />
            <span className={`text-xs font-medium ${isDark ? 'text-[#94A3B8]' : 'text-slate-600'}`}>
              Hackathon Rules
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Rules &amp;{' '}
            <span className="bg-gradient-to-r from-[#22C55E] to-[#10B981] bg-clip-text text-transparent">
              Guidelines
            </span>
          </h2>
          <p className={`mt-3 text-sm max-w-md mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            Read carefully before registering — adherence is mandatory for participation
          </p>
        </div>

        {/* ── Rules Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.id}
                id={`rule-${rule.id}`}
                className={`group border rounded-2xl p-5 transition-all duration-300 ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] hover:border-[#22C55E]/40 hover:shadow-lg hover:shadow-[#22C55E]/8'
                    : 'bg-white border-slate-200/80 shadow-sm shadow-slate-100 hover:border-[#22C55E]/40 hover:shadow-md hover:shadow-[#22C55E]/10'
                }`}
              >
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center group-hover:bg-[#22C55E]/20 transition-all duration-200">
                    <Icon size={17} className="text-[#22C55E]" />
                  </div>
                  <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {rule.title}
                  </h3>
                </div>

                {/* Highlight banner */}
                {rule.highlight && (
                  <div
                    className={`mb-3 px-3 py-2 border rounded-lg text-xs leading-relaxed ${
                      isDark
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {rule.highlight}
                  </div>
                )}

                {/* Points */}
                <ul className="space-y-2">
                  {rule.points.map((point, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        isDark ? 'text-[#94A3B8]' : 'text-slate-600'
                      }`}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
