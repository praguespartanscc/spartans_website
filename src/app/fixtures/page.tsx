'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Match } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Fallback data for when we're loading or if there's an error
const fallbackMatches = [
  {
    id: 1,
    team1: 'Prague Spartans',
    team2: 'Prague Eagles',
    date: '2025-05-15',
    time: '14:00',
    venue: 'Prague Cricket Ground',
    type: 'T20 Match - Czech Cricket League',
    image_url: '/prague_spartans_home_logo.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    team1: 'Prague Spartans',
    team2: 'Vienna CC',
    date: '2025-05-28',
    time: '13:30',
    venue: 'Prague Cricket Ground',
    type: 'T20 Match - Central European League',
    image_url: '/prague_spartans_home_logo.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    team1: 'Dresden CC',
    team2: 'Prague Spartans',
    date: '2025-06-05',
    time: '13:00',
    venue: 'Dresden Cricket Field',
    type: 'International Friendly Match',
    image_url: '/prague_spartans_home_logo.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    team1: 'Prague Spartans',
    team2: 'Brno CC',
    date: '2025-06-12',
    time: '14:30',
    venue: 'Prague Cricket Ground',
    type: 'T20 Match - Czech Cricket League',
    image_url: '/prague_spartans_home_logo.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    team1: 'Prague Spartans',
    team2: 'Vinohrady CC',
    date: '2025-06-19',
    time: '15:00',
    venue: 'Prague Cricket Ground',
    type: 'T20 Match - Czech Cricket League',
    image_url: '/prague_spartans_home_logo.jpeg',
    created_at: new Date().toISOString()
  }
];

export default function FixturesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(8);

  useEffect(() => {
    async function loadMatches() {
      try {
        // Skip API call when Supabase is not configured (development/test)
        if (!isSupabaseConfigured) {
          setMatches([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;
        setMatches(data || []);
      } catch (error) {
        console.error('Error loading matches:', error);
        setError('Failed to load matches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMatches();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate pagination
  const displayMatches = (isLoading || error || matches.length === 0) 
    ? fallbackMatches 
    : matches;
    
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = displayMatches.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(displayMatches.length / matchesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a3049] mb-3">All Fixtures</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View all upcoming and past matches for the Prague Spartans Cricket Club
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentMatches.map((match) => (
                <div 
                  key={match.id} 
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                >
                  <div className="h-32 bg-gradient-to-r from-[#1a3049] to-[#570808] flex items-center justify-center">
                    <Image
                      src={match.image_url || "/prague_spartans_home_logo.jpeg"}
                      alt="Match"
                      width={120}
                      height={80}
                      className="object-contain"
                      priority
                    />
                  </div>
                  
                  <div className="p-4">
                    <span className="block text-lg font-bold text-[#1a3049] mb-2">
                      {match.team1} vs {match.team2}
                    </span>
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(match.date)} at {match.time}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{match.venue}</span>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{match.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border border-gray-300 ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-[#1a3049] hover:bg-gray-50'
                    }`}
                  >
                    Prev
                  </button>
                  
                  {[...Array(totalPages).keys()].map((number) => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`px-3 py-1 border-t border-b border-gray-300 ${
                        currentPage === number + 1
                          ? 'bg-[#1a3049] text-white' 
                        : 'bg-white text-[#1a3049] hover:bg-gray-50'
                      }`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-r-md border border-gray-300 ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-[#1a3049] hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 