'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a context for Supabase with a default value
export const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

// Create a hook to use the Supabase context
export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

// Create a provider for the Supabase client
export default function SupabaseProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  const [client, setClient] = useState<SupabaseClient | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    // Initialize the Supabase client on the client side only
    const supabaseClient = createClientComponentClient();
    setClient(supabaseClient);

    // Set up auth state listener
    if (supabaseClient) {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(() => {
        // Refresh the current route when auth state changes
        router.refresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [router]);

  // Don't render children until the client is ready
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
} 