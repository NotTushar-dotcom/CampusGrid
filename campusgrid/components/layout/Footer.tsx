'use client';

import Image from 'next/image';
import { GitFork, Link2, ExternalLink, Heart, Zap } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

const footerLinks = {
  Platform: [
    { label: 'Home', href: '#home' },
    { label: 'Active Events', href: '#events' },
    { label: 'Find Teammates', href: '#matchmaker' },
    { label: 'Problem Statements', href: '#ps-directory' },
  ],
  'SIH 2026': [
    { label: 'Timeline', href: '#timeline' },
    { label: 'Rules & Guidelines', href: '#rules' },
    { label: 'Official SIH Portal', href: 'https://www.sih.gov.in', external: true },
  ],
  Institute: [
    { label: 'GL Bajaj', href: 'https://www.glbajajgroup.org', external: true },
    { label: 'Student Portal', href: '#', external: true },
    { label: 'SPOC Contact', href: '#' },
  ],
};

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer
      className={`border-t transition-colors duration-300 ${isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main footer content ── */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-2.5 group w-fit">
              <Image
                src="/GL-BAJAJ-LOGO-1.png"
                alt="GL Bajaj Logo"
                width={36}
                height={36}
                className="object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-extrabold text-base tracking-widest group-hover:text-[#22C55E] transition-colors ${isDark ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  GL BAJAJ
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 leading-none">
                  SIH 2026
                </span>
              </div>
            </a>
            <p className={`mt-4 text-sm leading-relaxed max-w-xs ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              Your college&apos;s hub for innovation, team formation, and hackathon management.
              Powering the SIH 2026 internal selection at GL Bajaj.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg border text-[#52525B] hover:text-[#22C55E] hover:border-[#22C55E]/40 transition-all duration-200 ${isDark ? 'bg-[#0B0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <GitFork size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg border text-[#52525B] hover:text-[#22C55E] hover:border-[#22C55E]/40 transition-all duration-200 ${isDark ? 'bg-[#0B0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <Link2 size={16} />
              </a>
            </div>

            {/* Active event badge */}
            <div
              className={`mt-5 inline-flex items-center gap-2 px-3 py-2 border border-[#22C55E]/25 rounded-xl ${isDark ? 'bg-[#0B0F12]' : 'bg-slate-50'
                }`}
            >
              <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              <span className="text-xs text-[#22C55E] font-medium">SIH 2026 — Registration Open</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className={`text-xs font-semibold uppercase tracking-widest mb-4 ${isDark ? 'text-[#52525B]' : 'text-slate-400'
                  }`}
              >
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={'external' in link && link.external ? '_blank' : undefined}
                      rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                      className={`flex items-center gap-1.5 text-sm hover:text-[#22C55E] transition-colors duration-200 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'
                        }`}
                    >
                      {link.label}
                      {'external' in link && link.external && (
                        <ExternalLink size={11} className="opacity-50" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          className={`py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-[#27272A]' : 'border-slate-200'
            }`}
        >
          <p className={`text-xs ${isDark ? 'text-[#3F3F46]' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} GL Bajaj SIH 2026 Campus Portal. Built for GL Bajaj students.
          </p>
          <p className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#3F3F46]' : 'text-slate-400'}`}>
            Made with <Heart size={11} className="text-[#22C55E] fill-[#22C55E]" /> by IIC GL Bajaj
          </p>
        </div>
      </div>
    </footer>
  );
}
