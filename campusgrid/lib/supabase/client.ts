import { createBrowserClient } from '@supabase/ssr';
import { IS_SUPABASE_CONFIGURED, supabaseUrl, supabaseAnonKey } from './fallback';

/**
 * Browser-side Supabase client.
 * Returns null if Supabase is not configured (fallback mode).
 */
export function createClient() {
  if (!IS_SUPABASE_CONFIGURED) return null;
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
