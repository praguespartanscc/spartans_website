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
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      // Refresh only when the user actually signs in or out. Refreshing on the
      // INITIAL_SESSION event fired on every load re-rendered each page twice and
      // sent not-found pages into a reload loop.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Render the page straight away (server-rendered HTML, no blank spinner);
  // the client becomes available to context consumers once mounted.
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}
