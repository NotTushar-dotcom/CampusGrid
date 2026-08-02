// =============================================================
// CampusGrid — TypeScript Type Definitions
// Mirrors the Supabase PostgreSQL schema
// =============================================================

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  roll_number: string | null;
  role: 'student' | 'faculty' | 'faculty_mentor' | 'admin_spoc';
  skills: string[];
  gender?: 'male' | 'female' | null;
  // Optional faculty profile fields
  designation?: string | null;
  department?: string | null;
  contact_number?: string | null;
  sih_themes?: string[];
  created_at?: string;
}

export interface ProblemStatement {
  id: string; // e.g. "SIH2026-SW-001"
  title: string;
  category: 'Software' | 'Hardware';
  organization: string;
  description: string;
  official_url: string;
  tags: string[];
}

export interface Event {
  id: string;
  title: string;
  slug?: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  ps_links: ProblemStatement[] | any;
  created_at?: string;
}

export interface FacultyMentor {
  id: string;
  user_id: string;
  designation: string | null;
  department: string | null;
  contact_number: string | null;
  areas_of_expertise: string[];
  created_at?: string;
  // Joined fields
  user?: User;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  leader_id: string;
  problem_statement_id: string | null;
  assigned_mentor_id: string | null;
  join_code: string | null;
  open_roles: string[];
  status: 'draft' | 'recruiting' | 'full' | 'submitted' | 'approved' | string;
  created_at?: string;
  // Joined fields
  leader?: User;
  mentor?: FacultyMentor;
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  applicant_id: string;
  pitch_message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | string;
  reject_reason: string | null;
  created_at?: string;
  // Joined fields
  team?: Team;
  applicant?: User;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  roll_number: string | null;
  role_in_team: string | null;
  // Joined fields
  user?: User;
  team?: Team;
}

export interface MentorRequest {
  id: string;
  team_id: string;
  mentor_id: string;
  pitch_message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | string;
  created_at?: string;
  // Joined fields
  team?: Team;
  mentor?: FacultyMentor;
}

/** Mentor request with nested team + leader data for the dashboard */
export interface MentorRequestWithTeam extends MentorRequest {
  team: Team & {
    leader: Pick<User, 'id' | 'full_name' | 'email' | 'contact_number' | 'roll_number'>;
  };
}

export interface Evaluation {
  id: string;
  judge_id: string;
  team_id: string;
  problem_understanding: number;
  technical_feasibility: number;
  prototype_progress: number;
  impact_viability: number;
  presentation_pitch: number;
  feedback_notes: string | null;
  created_at?: string;
  // Joined fields
  judge?: User;
  team?: Team;
}

export interface SoloMatchmaker {
  id: string;
  user_id: string;
  event_id: string;
  offered_skills: string[];
  bio: string | null;
  status: 'open' | 'placed';
  created_at?: string;
  // Joined fields
  user?: User;
}

export interface TeamRequest {
  id: string;
  team_id: string;
  event_id: string;
  required_role: string;
  description: string | null;
  status: 'open' | 'filled';
  created_at?: string;
  // Joined fields
  team?: Team;
}

// Auth context shape
export interface AuthContextType {
  user: import('@supabase/supabase-js').User | null;
  profile: User | null;
  session: import('@supabase/supabase-js').Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
