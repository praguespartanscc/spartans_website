'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/services/authService';
import { User } from '@supabase/supabase-js';
import AuthShell from '@/components/AuthShell';

export default function NotAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [router]);

  return (
    <AuthShell title="Admins only" subtitle="This area is restricted to club administrators.">
      {isLoading ? (
        <div className="skeleton h-40" />
      ) : (
        <div className="card flex flex-col gap-4 p-6">
          <p className="text-muted">
            {user?.email ? (
              <>
                Your account (<span className="text-cream">{user.email}</span>) doesn&apos;t have administrator access.
              </>
            ) : (
              "Your account doesn't have administrator access."
            )}{' '}
            If you think it should, contact a committee member.
          </p>
          <Link href="/dashboard" className="btn btn-gold w-full">
            Go to my member dashboard
          </Link>
          <Link href="/" className="btn btn-outline w-full">
            Back to the home page
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
