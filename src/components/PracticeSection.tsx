'use client';

import { useEffect, useState } from 'react';
import { getUpcomingPractices } from '@/services/practiceService';
import type { Practice } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

type PracticeCardProps = {
  practice: {
    id: string | number;
    date: string;
    time: string;
    venue: string;
    type: string;
    notes?: string;
    first_team?: string;
    second_team?: string;
    created_at?: string;
    description?: string;
    title?: string;
  };
};

function PracticeSessionCard({ practice }: PracticeCardProps) {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Tag for practice session
  const tag = (
    <span className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
      <span className="relative inline-flex items-center group">
        <span className="absolute inset-0 rounded-full opacity-25 bg-gray-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
        <span className="relative inline-flex items-center gap-2 bg-[#1a3049] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Practice
        </span>
      </span>
    </span>
  );
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/40 relative border-t-4 border-[#1a3049]">
      <div className="h-36 bg-gradient-to-br from-[#1a3049] via-[#2a4a6c] to-[#213a58] flex items-center justify-center relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent"></div>
        </div>
        <div className="flex flex-col items-center justify-center z-10 px-4 text-center mt-8">
          {tag}
          <div className="flex items-center justify-center space-x-3 mb-1">
            <span className="text-xl font-semibold text-white" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
              {practice.venue}
            </span>
          </div>
          {practice.first_team && practice.second_team && (
            <span className="inline-flex items-center mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white backdrop-blur-sm shadow-inner border border-white/10 absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {practice.first_team} & {practice.second_team}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 bg-gradient-to-b from-white to-gray-50/80">
        <div className="flex items-center text-gray-700 mb-3">
          <div className="p-1.5 bg-[#f2f7fc] rounded-full mr-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <span className="text-sm font-medium">{formatDate(practice.date)} at {practice.time}</span>
        </div>
        <div className="flex items-center text-gray-700 mb-4">
          <div className="p-1.5 bg-[#f2f7fc] rounded-full mr-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2v2"></path>
              <path d="M18 20v2"></path>
              <path d="M18 8v8"></path>
              <path d="M6 2v2"></path>
              <path d="M6 20v2"></path>
              <path d="M6 8v8"></path>
              <path d="M2 6h4"></path>
              <path d="M2 18h4"></path>
              <path d="M18 18h4"></path>
              <path d="M18 6h4"></path>
            </svg>
          </div>
          <span className="text-sm font-medium">{practice.type} Practice</span>
        </div>
        {practice.notes && (
          <div className="pt-3 border-t border-gray-100/70">
            <div className="text-xs text-gray-600 mt-1">
              <span className="font-medium">Notes:</span> {practice.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PracticeSection = () => {
  const [upcomingPractices, setUpcomingPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPractices() {
      try {
        // Skip API call if Supabase isn't configured
        if (!isSupabaseConfigured) {
          console.warn('Supabase is not configured. Using fallback practice data.');
          setUpcomingPractices([]);
          setIsLoading(false);
          return;
        }

        const practices = await getUpcomingPractices();
        setUpcomingPractices(practices);
      } catch (err) {
        console.error('Failed to load practices:', err);
        setError('Failed to load upcoming practices. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPractices();
  }, []);

  // Use only actual API data
  const displayPractices = upcomingPractices;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Practice Sessions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join us for our regular practice sessions to improve your cricket skills
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : displayPractices.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No practice sessions found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPractices.map((practice) => (
              <PracticeSessionCard key={practice.id} practice={practice} />
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <a 
            href="/practices"
            className="bg-[#1a3049] hover:bg-[#2a4059] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            View All Practices
          </a>
        </div>
      </div>
    </section>
  );
};

export default PracticeSection; 