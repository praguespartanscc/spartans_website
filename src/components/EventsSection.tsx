'use client';

import Image from 'next/image';
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
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl">
      {/* Image Banner */}
      <div className="relative h-32 w-full bg-gradient-to-r from-[#1a3049] to-[#570808] flex items-center justify-center">
        <Image
          src="/prague_spartans_home_logo.jpeg"
          alt="Prague Spartans Logo"
          width={100}
          height={100}
          className="object-contain drop-shadow-lg"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      {/* Match Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">
            {formatDate(match.date)} at {match.time}
          </span>
          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
            {match.type}
          </span>
        </div>
        <div className="font-bold text-xl text-[#1a3049] mb-1">
          {match.team1} <span className="text-gray-400 font-normal">vs</span> {match.team2}
        </div>
        {match.venue && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{match.venue}</span>
          </div>
        )}
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