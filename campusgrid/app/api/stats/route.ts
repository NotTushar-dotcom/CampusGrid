import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { IS_SUPABASE_CONFIGURED, supabaseUrl, supabaseAnonKey } from '@/lib/supabase/fallback';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!IS_SUPABASE_CONFIGURED) {
    return NextResponse.json({
      studentRegistrations: 0,
      teamsFormed: 0,
      problemStatements: 'Releasing Soon',
      isConfigured: false,
    });
  }

  try {
    // 1. Try server client (inherits user auth session cookies if present)
    const serverSupabase = await createServerClient();
    const supabase = serverSupabase || createClient(supabaseUrl, supabaseAnonKey);

    // 2. Try RPC get_portal_stats first (bypasses RLS for public counts)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_portal_stats');

    if (!rpcError && rpcData) {
      return NextResponse.json({
        studentRegistrations: rpcData.studentRegistrations ?? 0,
        teamsFormed: rpcData.teamsFormed ?? 0,
        problemStatements: rpcData.problemStatements ?? 'Releasing Soon',
        isConfigured: true,
      });
    }

    // 3. Fallback: Direct table count queries using active session / anon client
    const [usersRes, teamsRes, psRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('problem_statements').select('*', { count: 'exact', head: true }),
    ]);

    const studentRegistrations = usersRes.count ?? 0;
    const teamsFormed = teamsRes.count ?? 0;
    const psCount = psRes.count ?? 0;

    return NextResponse.json({
      studentRegistrations,
      teamsFormed,
      problemStatements: psCount > 0 ? psCount : 'Releasing Soon',
      isConfigured: true,
    });
  } catch (error) {
    console.error('Error fetching realtime stats:', error);
    return NextResponse.json({
      studentRegistrations: 0,
      teamsFormed: 0,
      problemStatements: 'Releasing Soon',
      isConfigured: false,
    });
  }
}
