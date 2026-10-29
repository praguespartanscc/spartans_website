'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

export type Member = { user: User; isAdmin: boolean };

// The scorer is for approved members. Sign-in itself is enforced by the middleware.
export default function MemberGate({ children }: { children: (m: Member) => React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'pending' | 'signedOut'>('loading');

  useEffect(() => {
    const supabase = createClientComponentClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setState('signedOut');
      const isAdmin = user.app_metadata?.isAdmin === true;
      if (!isAdmin) {
        const { data } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle();
        if (data?.status !== 'approved') return setState('pending');
      }
      setMember({ user, isAdmin });
      setState('ok');
    })().catch(() => setState('signedOut'));
  }, []);

  if (state === 'loading') {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
        <div className="skeleton h-10 w-40" />
      </div>
    );
  }
  if (state === 'signedOut') {
    return (
      <Notice title="Sign in to score">
        <Link href="/login?redirect=/score" className="btn btn-gold">
          Sign in
        </Link>
      </Notice>
    );
  }
  if (state === 'pending') {
    return (
      <Notice title="Waiting for approval">
        <p className="text-sand">The scorer opens once an admin has approved your account.</p>
        <Link href="/dashboard" className="btn btn-outline mt-6">
          My dashboard
        </Link>
      </Notice>
    );
  }
  return <>{member && children(member)}</>;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="h-sub text-3xl">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}
