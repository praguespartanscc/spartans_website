'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type Writer = { loading: boolean; isAdmin: boolean; canWrite: boolean };

// News and achievements can be written by admins and committee members. Only admins delete.
export function useWriter(): Writer {
  const [w, setW] = useState<Writer>({ loading: true, isAdmin: false, canWrite: false });
  useEffect(() => {
    const supabase = createClientComponentClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isAdmin = user?.app_metadata?.isAdmin === true;
      const committee = isAdmin || !user ? { data: false } : await supabase.rpc('is_committee');
      setW({ loading: false, isAdmin, canWrite: isAdmin || committee.data === true });
    })().catch(() => setW({ loading: false, isAdmin: false, canWrite: false }));
  }, []);
  return w;
}
