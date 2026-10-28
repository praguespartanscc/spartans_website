'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TeamManagement from '@/components/admin/TeamManagement';
import MatchesManagement from '@/components/admin/MatchesManagement';
import PracticesManagement from '@/components/admin/PracticesManagement';
import ApplicationsManagement from '@/components/admin/ApplicationsManagement';
import SponsorsManagement from '@/components/admin/SponsorsManagement';
import CommitteeManagement from '@/components/admin/CommitteeManagement';

// Define tab types
type Tab = 'team' | 'matches' | 'practices' | 'applications' | 'sponsors' | 'committee';

const TABS: { id: Tab; label: string }[] = [
  { id: 'team', label: 'Team' },
  { id: 'matches', label: 'Matches' },
  { id: 'practices', label: 'Practices' },
  { id: 'applications', label: 'Applications' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'committee', label: 'Committee' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('team');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClientComponentClient();
        
        // Refresh the session first to ensure we have the latest auth state
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
          // Continue anyway to check the current state
        }
        
        // Get the user
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Auth error:', error.message);
          setAuthError(error.message);
          router.push('/login?redirect=/admin');
          return;
        }

        if (!user) {
          router.push('/login?redirect=/admin');
          return;
        }

        // Check if user is admin
        const isUserAdmin = !!user.app_metadata?.isAdmin;
        
        if (!isUserAdmin) {
          router.push('/not-admin');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login?redirect=/admin');
      }
    }

    checkAuth();
  }, [router]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="container-x py-16" role="status" aria-label="Checking access">
        <div className="skeleton mb-6 h-12 w-72" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-md p-8 text-center">
          <h2 className="font-display text-3xl font-extrabold uppercase">Authentication error</h2>
          <p className="mt-3 text-muted">{authError}</p>
          <button type="button" onClick={() => router.push('/login?redirect=/admin')} className="btn btn-gold mt-6">
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-cream/10">
        <div className="container-x pb-0 pt-10">
          <p className="eyebrow mb-2">Club admin</p>
          <h1 className="font-display text-[clamp(36px,5vw,56px)] font-extrabold uppercase leading-none">Dashboard</h1>
          <nav aria-label="Admin sections" className="-mb-px mt-8 flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`relative shrink-0 whitespace-nowrap px-4 py-4 text-[15px] font-medium transition-colors ${
                  activeTab === tab.id ? 'text-cream' : 'text-faint hover:text-cream'
                }`}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-4 bottom-0 h-[2px] origin-left bg-gold transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                    activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-x py-8 sm:py-10">
        {/* Management tools keep a light, high-contrast panel for data entry. */}
        <div key={activeTab} className="page-enter rounded-lg bg-[#F5F5F5] p-3 text-gray-900 [color-scheme:light] sm:p-6">
          {activeTab === 'team' && <TeamManagement />}
          {activeTab === 'matches' && <MatchesManagement />}
          {activeTab === 'practices' && <PracticesManagement />}
          {activeTab === 'applications' && <ApplicationsManagement />}
          {activeTab === 'sponsors' && <SponsorsManagement />}
          {activeTab === 'committee' && <CommitteeManagement />}
        </div>
      </div>
    </div>
  );
}
