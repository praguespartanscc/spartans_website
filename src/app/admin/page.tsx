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
          console.log('No user found, redirecting to login');
          router.push('/login?redirect=/admin');
          return;
        }

        // Check if user is admin
        const isUserAdmin = !!user.user_metadata?.isAdmin;
        
        if (!isUserAdmin) {
          console.log('User is not an admin, redirecting to not-admin page');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a3049] hover:bg-[#1a3049]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3049]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-8">
          <nav className="-mb-px flex space-x-3 sm:space-x-8 overflow-x-auto py-1 sm:py-0 scrollbar-hide">
            <button
              onClick={() => handleTabChange('team')}
              className={ `${
                activeTab === 'team'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Team Management
            </button>
            <button
              onClick={() => handleTabChange('matches')}
              className={`${
                activeTab === 'matches'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Upcoming Matches  
            </button>
            <button
              onClick={() => handleTabChange('practices')}
              className={`${
                activeTab === 'practices'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Upcoming Practices
            </button>
            <button
              onClick={() => handleTabChange('applications')}
              className={`${
                activeTab === 'applications'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Team Applications  
            </button>
            <button
              onClick={() => handleTabChange('sponsors')}
              className={`${
                activeTab === 'sponsors'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Sponsors
            </button>
            <button
              onClick={() => handleTabChange('committee')}
              className={`${
                activeTab === 'committee'
                  ? 'border-[#1a3049] text-[#1a3049]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm cursor-pointer flex-shrink-0`}
            >
              Committee
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="bg-white shadow-md rounded-lg p-3 sm:p-6">
          {activeTab === 'team' && <TeamManagement />}
          {activeTab === 'matches' && <MatchesManagement />}
          {activeTab === 'practices' && <PracticesManagement />}
          {activeTab === 'applications' && <ApplicationsManagement />}
          {activeTab === 'sponsors' && <SponsorsManagement />}
          {activeTab === 'committee' && <CommitteeManagement />}
        </div>
      </main>
    </div>
  );
} 