// =============================================================
// Supabase configuration & fallback detection
// =============================================================

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * True when both Supabase env vars are present, non-empty, and form a valid HTTP/HTTPS URL.
 * When false, the app uses mock/fallback data throughout.
 */
export const IS_SUPABASE_CONFIGURED =
  isValidUrl(rawUrl) &&
  rawUrl !== 'https://your_supabase_project_url_here' &&
  rawUrl !== 'your_supabase_project_url_here' &&
  Boolean(rawKey) &&
  rawKey !== 'your_supabase_anon_key_here';

// Always export valid URL strings to prevent @supabase/ssr from throwing during prerender/build
export const supabaseUrl = IS_SUPABASE_CONFIGURED ? rawUrl!.trim() : 'https://placeholder.supabase.co';
export const supabaseAnonKey = IS_SUPABASE_CONFIGURED ? rawKey!.trim() : 'placeholder-anon-key';
