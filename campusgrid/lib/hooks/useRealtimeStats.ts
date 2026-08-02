'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface RealtimeStats {
  studentRegistrations: number;
  teamsFormed: number;
  problemStatements: string | number;
  isLoading: boolean;
}

export function useRealtimeStats(): RealtimeStats {
  const [stats, setStats] = useState<RealtimeStats>({
    studentRegistrations: 0,
    teamsFormed: 0,
    problemStatements: 'Releasing Soon',
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        // 1. Primary: Fetch from API route (uses server session cookies if available)
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && (data.studentRegistrations > 0 || data.teamsFormed > 0)) {
            setStats({
              studentRegistrations: data.studentRegistrations ?? 0,
              teamsFormed: data.teamsFormed ?? 0,
              problemStatements: data.problemStatements ?? 'Releasing Soon',
              isLoading: false,
            });
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load stats via API', err);
      }

      // 2. Secondary Fallback: Query directly via browser client
      const supabase = createClient();
      if (supabase) {
        try {
          // Attempt RPC if installed
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_portal_stats');
          if (!rpcError && rpcData && isMounted) {
            setStats({
              studentRegistrations: rpcData.studentRegistrations ?? 0,
              teamsFormed: rpcData.teamsFormed ?? 0,
              problemStatements: rpcData.problemStatements ?? 'Releasing Soon',
              isLoading: false,
            });
            return;
          }

          // Direct select count using active browser session
          const [u, t] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('teams').select('*', { count: 'exact', head: true }),
          ]);

          if (isMounted) {
            setStats({
              studentRegistrations: u.count ?? 0,
              teamsFormed: t.count ?? 0,
              problemStatements: 'Releasing Soon',
              isLoading: false,
            });
          }
        } catch (err) {
          console.error('Browser client stats error:', err);
          if (isMounted) {
            setStats((prev) => ({ ...prev, isLoading: false }));
          }
        }
      } else if (isMounted) {
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    }

    loadStats();

    // Supabase Realtime subscription with unique channel name
    const supabase = createClient();
    if (!supabase) return;

    const channelName = `realtime-stats-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          if (isMounted) loadStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          if (isMounted) loadStats();
        }
      );

    channel.subscribe();

    // Fallback polling interval (every 15s)
    const interval = setInterval(() => {
      if (isMounted) loadStats();
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return stats;
}
