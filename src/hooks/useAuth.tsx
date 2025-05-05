'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

export function useAuth(): UseAuthReturn {
  const supabase = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    async function getUser() {
      try {
        // Get user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError && userError.name !== 'AuthSessionMissingError') {
          console.error('Error getting user:', userError);
        }
        
        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError && sessionError.name !== 'AuthSessionMissingError') {
          console.error('Error getting session:', sessionError);
        }

        if (mounted) {
          setUser(userData?.user || null);
          setSession(sessionData?.session || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth hook:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    }

    getUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (provider: 'google') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
      throw error;
    }
  };

  const isAdmin = user?.user_metadata?.isAdmin === true;

  return { user, session, loading, signIn, signOut, isAdmin };
} 