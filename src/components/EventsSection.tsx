'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUpcomingMatches } from '@/services/matchService';
import type { Match } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

// Add a MatchCard component similar to PracticeSessionCard
function MatchCard({ match }: { match: Match }) {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Tag for match status
  let tag = null;
  if (match.result === 'will be played') {
    tag = (
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
    );
  }
  
  return (
    <div className="cursor-pointer bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/40 relative border-t-4 border-[#1a3049] hover:scale-105"
    onClick={() => {
      window.open(match.url, '_blank', 'noopener,noreferrer');
    }}>
      <div className="h-36 bg-gradient-to-br from-[#1a3049] via-[#2a4a6c] to-[#213a58] flex items-center justify-center relative overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent"></div>
        </div>
        <div className="flex flex-col items-center justify-center z-10 px-4 text-center mt-8">
          {tag}
          <div className="flex items-center justify-center space-x-3 mb-1">
            <span className="text-xl font-semibold text-white max-w-[40%]" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
              {match.team1}
            </span>
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-white/60 uppercase font-medium">vs</span>
              <div className="w-6 h-0.5 bg-white/10 rounded-full mt-1"></div>
            </div>
            <span className="text-xl font-semibold text-white max-w-[40%]" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
              {match.team2}
            </span>
          </div>
          {match.division && (
            <span className="inline-flex items-center mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white backdrop-blur-sm shadow-inner border border-white/10 absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h.01" />
                <path d="M7 20v-4" />
                <path d="M12 20v-8" />
                <path d="M17 20v-6" />
                <path d="M22 20v-10" />
              </svg>
              {match.division}
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
          <span className="text-sm font-medium">{formatDate(match.date)} at {match.time}</span>
        </div>
        <div className="flex items-center text-gray-700 mb-4">
          <div className="p-1.5 bg-[#f2f7fc] rounded-full mr-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <span className="text-sm font-medium">{match.venue}</span>
        </div>
        <div className="pt-3 border-t border-gray-100/70 flex justify-between items-center">
          <span className="text-xs py-1.5 px-3 bg-[#f2f7fc] text-[#1a3049] rounded-full font-medium border border-[#1a3049]/10 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2v2" />
              <path d="M18 20v2" />
              <path d="M18 8v8" />
              <path d="M6 2v2" />
              <path d="M6 20v2" />
              <path d="M6 8v8" />
              <path d="M2 6h4" />
              <path d="M2 18h4" />
              <path d="M18 18h4" />
              <path d="M18 6h4" />
            </svg>
            {match.type}
          </span>
        </div>
      </div>
    </div>
  );
}

const EventsSection = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        if (!isSupabaseConfigured) {
          setUpcomingMatches([]);
          setIsLoading(false);
          return;
        }
        const matches = await getUpcomingMatches();
        setUpcomingMatches(matches);
      } catch (err) {
        console.error('Failed to load matches:', err);
        setError('Failed to load upcoming matches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Only use actual API data
  const displayMatches = upcomingMatches;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Upcoming Matches</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Support the Prague Spartans at our upcoming cricket matches
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : displayMatches.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No upcoming matches found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link 
            href="/fixtures"
            className="bg-[#1a3049] hover:bg-[#2a4059] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            View All Fixtures
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsSection; 