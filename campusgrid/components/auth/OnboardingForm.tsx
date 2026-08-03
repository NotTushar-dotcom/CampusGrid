'use client';

import React, { useState } from 'react';
import { X, Hash, Tag, CheckCircle, AlertCircle, Plus, User2, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

const SKILL_OPTIONS = [
  'React', 'Next.js', 'Node.js', 'Python', 'AI/ML', 'UI/UX Design',
  'Flutter', 'Java', 'C++', 'Embedded C', 'IoT', 'Blockchain',
  'Computer Vision', 'Data Science', 'DevOps', 'Arduino', 'Figma',
  'TypeScript', 'Django', 'FastAPI', 'TensorFlow',
];

type Gender = 'male' | 'female';

const GENDER_OPTIONS: { value: Gender; label: string; color: string; border: string; bg: string }[] = [
  {
    value: 'male',
    label: 'Boy',
    color: '#60A5FA',
    border: 'rgba(96,165,250,0.45)',
    bg: 'rgba(96,165,250,0.12)',
  },
  {
    value: 'female',
    label: 'Girl',
    color: '#F472B6',
    border: 'rgba(244,114,182,0.45)',
    bg: 'rgba(244,114,182,0.12)',
  },
];

interface OnboardingFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingForm({ isOpen, onClose }: OnboardingFormProps) {
  const { user } = useAuth();
  const [rollNumber, setRollNumber]     = useState('');
  const [yearOfStudy, setYearOfStudy]   = useState('');
  const [gender, setGender]             = useState<Gender | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill]   = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  const supabase = createClient();

  if (!isOpen || !user) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Not configured'); return; }
    const cleanedRoll = rollNumber.trim();
    if (!cleanedRoll) { setError('Roll number is required'); return; }
    if (!/^\d{10,15}$/.test(cleanedRoll)) {
      setError('Security error: Roll number must consist strictly of 10 to 15 numeric digits (e.g. 2200290100001).');
      return;
    }
    if (!yearOfStudy) { setError('Please select your Year of Study'); return; }
    if (!gender) { setError('Please select your gender'); return; }

    setIsLoading(true);
    setError(null);

    const { error } = await supabase
      .from('users')
      .upsert({
        id:          user.id,
        email:       user.email!,
        full_name:   user.user_metadata?.full_name ?? '',
        roll_number: cleanedRoll,
        year_of_study: yearOfStudy,
        gender,
        skills:      selectedSkills,
      });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(onClose, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-campus-card border border-campus-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-campus-card px-6 pt-6 pb-4 border-b border-campus-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
              <p className="text-sm text-campus-mint/60 mt-0.5">
                A few details before you dive in
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-campus-mint/60 hover:text-campus-mint hover:bg-campus-border/30 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 p-3 bg-campus-primary/10 border border-campus-primary/30 rounded-xl text-campus-mint text-sm">
              <CheckCircle size={15} />
              <span>Profile saved! Welcome to CampusGrid 🎉</span>
            </div>
          )}

          {/* Roll Number */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={13} />
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
              placeholder="e.g., 2200290100001"
              className="w-full px-4 py-2.5 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors font-mono"
            />
            <p className="text-[11px] text-campus-mint/50">Only numbers allowed (10-15 digits, e.g. 2200290100001).</p>
          </div>

          {/* Year of Study */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} />
              Year of Study <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              className="w-full px-4 py-2.5 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors cursor-pointer"
            >
              <option value="" disabled style={{ background: '#0F172A', color: 'rgba(255,255,255,0.4)' }}>Select Year of Study</option>
              <option value="1st Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>1st Year</option>
              <option value="2nd Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>2nd Year</option>
              <option value="3rd Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>3rd Year</option>
              <option value="4th Year" style={{ background: '#0F172A', color: '#FFFFFF' }}>4th Year</option>
            </select>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider flex items-center gap-1.5">
              <User2 size={13} />
              Gender <span className="text-red-400">*</span>
              <span className="text-campus-mint/40 font-normal normal-case tracking-normal text-[11px]">
                (required for SIH diversity compliance)
              </span>
            </label>
            <div className="flex gap-3">
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all"
                    style={{
                      background:   isSelected ? opt.bg   : 'rgba(255,255,255,0.03)',
                      border:       `2px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.08)'}`,
                      boxShadow:    isSelected ? `0 0 16px ${opt.color}22` : 'none',
                    }}
                  >
                    {/* Circle with letter */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
                      style={{
                        background: isSelected ? opt.bg : 'rgba(255,255,255,0.05)',
                        border:     `2px solid ${isSelected ? opt.color : 'rgba(255,255,255,0.10)'}`,
                        color:      isSelected ? opt.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {opt.value === 'male' ? 'B' : 'G'}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isSelected ? opt.color : 'rgba(255,255,255,0.4)' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {gender && (
              <p className="text-[11px]" style={{ color: gender === 'male' ? '#60A5FA' : '#F472B6' }}>
                {gender === 'male'   && '♂ Registered as Boy — shown as B in team roster'}
                {gender === 'female' && '♀ Registered as Girl — shown as G in team roster (counts for SIH diversity requirement)'}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-campus-mint/70 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={13} />
              Your Skills
              <span className="text-campus-primary font-normal normal-case tracking-normal">
                (select all that apply)
              </span>
            </label>

            {/* Selected badges */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="px-3 py-1 bg-campus-primary/20 border border-campus-primary/50 text-campus-mint text-xs rounded-full flex items-center gap-1 hover:bg-campus-primary/30 transition-all"
                  >
                    {skill}
                    <X size={10} />
                  </button>
                ))}
              </div>
            )}

            {/* Skill options grid */}
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.filter((s) => !selectedSkills.includes(s)).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="px-3 py-1.5 bg-campus-bg border border-campus-border text-campus-mint/60 hover:text-campus-mint hover:border-campus-primary text-xs rounded-full transition-all"
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* Custom skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                placeholder="Add a custom skill..."
                className="flex-1 px-3 py-2 bg-campus-bg border border-campus-border rounded-xl text-white placeholder-campus-mint/30 text-sm focus:outline-none focus:border-campus-primary transition-colors"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="px-3 py-2 bg-campus-primary hover:bg-[#34725d] rounded-xl text-white transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-3 bg-campus-primary hover:bg-[#34725d] disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
          >
            {isLoading ? 'Saving...' : success ? 'Saved! ✓' : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
