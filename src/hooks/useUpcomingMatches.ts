'use client';

import { useEffect, useState } from 'react';
import { getUpcomingMatches } from '@/services/matchService';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Match } from '@/types/supabase';

// Shared by the next-match bar and the fixtures list so the page asks once.
let pending: Promise<Match[]> | null = null;

function loadOnce(): Promise<Match[]> {
  if (!isSupabaseConfigured) return Promise.resolve([]);
  if (!pending) {
    pending = getUpcomingMatches().catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}

export function useUpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadOnce()
      .then((data) => active && setMatches(data))
      .catch((err) => {
        console.error('Failed to load matches:', err);
        if (active) setError('We could not load fixtures right now. Please try again later.');
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { matches, isLoading, error };
}
