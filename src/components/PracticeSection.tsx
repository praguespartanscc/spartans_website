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
  
  return (
    <div className=" bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/40 relative border-t-4 border-[#1a3049] hover:scale-105">
      <div className="h-36 bg-gradient-to-br from-[#1a3049] via-[#2a4a6c] to-[#213a58] flex items-center justify-center relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent"></div>
        </div>
        <div className="flex flex-col items-center justify-center z-10 px-4 text-center mt-8">
          <span className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
            <span className="relative inline-flex items-center group">
              <span className="absolute inset-0 rounded-full opacity-25 bg-gray-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative inline-flex items-center gap-2 bg-[#1a3049] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Upcoming
              </span>
            </span>
          </span>
          <div className="flex items-center justify-center space-x-3 mb-1">
            <span className="text-xl font-semibold text-white max-w-[40%]" style={{ textShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 2px' }}>
              {practice.first_team || "Spartans CC Vanguards"}
            </span>
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-white/60 uppercase font-medium">vs</span>
              <div className="w-6 h-0.5 bg-white/10 rounded-full mt-1"></div>
            </div>
            <span className="text-xl font-semibold text-white max-w-[40%]" style={{ textShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 2px' }}>
              {practice.second_team || "Team 2"}
            </span>
          </div>
          
        </div>
      </div>
      <div className="p-5 bg-gradient-to-b from-white to-gray-50/80">
        <div className="flex items-center text-gray-700 mb-3">
          <div className="p-1.5 bg-[#f2f7fc] rounded-full mr-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" x2="8" y1="2" y2="6"></line>
              <line x1="3" x2="21" y1="10" y2="10"></line>
            </svg>
          </div>
          <span className="text-sm font-medium">{formatDate(practice.date)} at {practice.time}</span>
        </div>
        <div className="flex items-center text-gray-700 mb-4">
          <div className="p-1.5 bg-[#f2f7fc] rounded-full mr-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <span className="text-sm font-medium">{practice.venue}</span>
        </div>
        <div className="pt-3 border-t border-gray-100/70 flex justify-between items-center">
          <span className="text-xs py-1.5 px-3 bg-[#f2f7fc] text-[#1a3049] rounded-full font-medium border border-[#1a3049]/10 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            {practice.type}
          </span>
        </div>
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
          console.log('Supabase is not configured. Using fallback practice data.');
          setUpcomingPractices([]);
          setIsLoading(false);
          return;
        }

        const practices = await getUpcomingPractices();
        console.log('Loaded practices:', practices);
        
        if (Array.isArray(practices)) {
          setUpcomingPractices(practices);
        } else {
          console.error('Expected array of practices but got:', practices);
          setUpcomingPractices([]);
        }
      } catch (err) {
        console.error('Failed to load practices:', err);
        setError('Failed to load upcoming practices. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPractices();
  }, []);

  // Example practice for dev/test purposes
  const examplePractice: Practice = {
    id: "example-1",
    date: new Date().toISOString().split('T')[0], // Today's date
    time: "18:00",
    venue: "Olsanke Tennis Centrum, Prague",
    type: "regular",
    notes: "Regular practice session for all team members",
    first_team: "Vanguards",
    second_team: "Mobilizers"
  };

  // Use actual API data if available, otherwise show an example for development
  const displayPractices = upcomingPractices.length > 0 
    ? upcomingPractices 
    : (process.env.NODE_ENV === 'development' ? [examplePractice] : []);

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
          <div className="text-center py-8">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Upcoming Practices</h3>
              <p className="text-gray-500 mb-4">
                There are no upcoming practice sessions scheduled at the moment. Please check back later.
              </p>
              <a 
                href="/contact"
                className="inline-block bg-[#1a3049] hover:bg-[#2a4059] text-white font-medium py-2 px-4 rounded-full text-sm transition-colors"
              >
                Contact Us For Information
              </a>
            </div>
          </div>
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