import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { IS_SUPABASE_CONFIGURED, supabaseUrl, supabaseAnonKey } from './fallback';

/**
 * Server-side Supabase client for React Server Components and Route Handlers.
 * Returns null if Supabase is not configured (fallback mode).
 */
export async function createServerClient() {
  if (!IS_SUPABASE_CONFIGURED) return null;

  const cookieStore = await cookies();

  return createSSRServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — safe to ignore
        }
      },
    },
  });
}
