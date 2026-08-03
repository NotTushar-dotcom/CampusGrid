'use client';

import React, { useState, useEffect } from 'react';
import { X, Hash, Tag, CheckCircle, AlertCircle, Plus, User2, User, Edit3, Loader2, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

const PRESET_SKILLS = [
  'React', 'Python', 'AI/ML', 'Node.js', 'UI/UX Design', 'Java', 'Flutter',
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setRollNumber(profile.roll_number ?? '');
      setYearOfStudy((profile as any).year_of_study ?? '');
      setGender((profile as any).gender ?? null);
      setSkills(profile.skills ?? []);
    }
  }, [profile, isOpen]);

  if (!isOpen || !user) return null;

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Supabase service unavailable'); return; }

    const cleanedName = fullName.trim();
    if (!cleanedName || cleanedName.length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[a-zA-Z\s.-]+$/.test(cleanedName)) {
      setError('Full name can only contain letters, spaces, dots, and hyphens.');
      return;
    }

    const cleanedRoll = rollNumber.trim();
    if (!cleanedRoll) {
      setError('Roll number is required.');
      return;
    }
    if (!/^\d{10,15}$/.test(cleanedRoll)) {
      setError('Security error: Roll number must consist strictly of 10 to 15 numeric digits (e.g. 2200290100001).');
      return;
    }

    if (!gender) {
      setError('Please select your gender (Boy or Girl).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: cleanedName,
        roll_number: cleanedRoll,
        year_of_study: yearOfStudy || null,
        gender,
        skills,
      })
      .eq('id', user.id);

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => {
        setSuccess(false);
        onClose();
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0E1318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#12181F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Your Profile</h2>
              <p className="text-xs text-slate-400">Update your name, roll number, gender, and skills</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Feedback alerts */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 p-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl text-[#22C55E] text-xs">
              <CheckCircle size={15} className="shrink-0" />
              <span>Profile updated successfully! Refreshing details…</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-[#22C55E]" />
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              value={fullName}
              onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm outline-none focus:border-[#22C55E] transition-colors"
            />
          </div>

          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={13} className="text-[#22C55E]" />
              Roll Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={15}
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="e.g. 2200290100001"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm outline-none focus:border-[#22C55E] transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500">Only numbers allowed (10-15 digits, e.g. 2200290100001).</p>
          </div>

          {/* Year of Study */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} className="text-[#22C55E]" />
              Year of Study
            </label>
            <select
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm outline-none focus:border-[#22C55E] transition-colors cursor-pointer text-white"
            >
              <option value="" disabled style={{ background: '#0F172A', color: 'rgba(255,255,255,0.4)' }}>Select Year of Study</option>
              <option value="1st Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>1st Year</option>
              <option value="2nd Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>2nd Year</option>
              <option value="3rd Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>3rd Year</option>
              <option value="4th Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>4th Year</option>
            </select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User2 size={13} className="text-[#22C55E]" />
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all"
                style={{
                  background: gender === 'male' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: gender === 'male' ? '#60A5FA' : 'rgba(255,255,255,0.10)',
                  color: gender === 'male' ? '#60A5FA' : '#94A3B8',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    background: gender === 'male' ? '#60A5FA' : 'rgba(255,255,255,0.05)',
                    color: gender === 'male' ? '#000' : '#94A3B8',
                  }}
                >
                  B
                </div>
                Boy
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all"
                style={{
                  background: gender === 'female' ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: gender === 'female' ? '#F472B6' : 'rgba(255,255,255,0.10)',
                  color: gender === 'female' ? '#F472B6' : '#94A3B8',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    background: gender === 'female' ? '#F472B6' : 'rgba(255,255,255,0.05)',
                    color: gender === 'female' ? '#000' : '#94A3B8',
                  }}
                >
                  G
                </div>
                Girl
              </button>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={13} className="text-[#22C55E]" />
              Your Skills
            </label>

            {/* Preset skill chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SKILLS.map((skill) => {
                const active = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.10)'}`,
                      color: active ? '#22C55E' : '#94A3B8',
                    }}
                  >
                    {skill}
                    {active && <X size={10} />}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                placeholder="Type & add custom skill..."
                className="flex-1 px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs outline-none focus:border-[#22C55E] transition-colors"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] hover:bg-[#22C55E]/25 transition-all disabled:opacity-50"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Selected Skills Badges */}
            {skills.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-semibold text-[#22C55E]">Selected ({skills.length}):</span>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E]"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="hover:opacity-75 ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#22C55E] to-[#10B981] text-black shadow-lg shadow-[#22C55E]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Saving Changes…</>
              ) : success ? (
                <><CheckCircle size={16} /> Saved Successfully!</>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
