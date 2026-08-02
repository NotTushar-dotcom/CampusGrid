// =============================================================
// Supabase configuration & fallback detection
// =============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both Supabase env vars are present and non-empty.
 * When false, the app uses mock/fallback data throughout.
 */
export const IS_SUPABASE_CONFIGURED =
  Boolean(supabaseUrl) &&
  supabaseUrl !== 'your_supabase_project_url_here' &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== 'your_supabase_anon_key_here';

export { supabaseUrl, supabaseAnonKey };
