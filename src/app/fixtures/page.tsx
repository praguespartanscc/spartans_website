'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Match } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function FixturesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(8);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  const teams = [
    { id: 'all', name: 'All Teams' },
    { id: 'Vanguards', name: 'Vanguards' },
    { id: 'Mobilizers', name: 'Mobilizers' },
    { id: 'Strikers', name: 'Strikers' }
  ];

  useEffect(() => {
    async function loadMatches() {
      try {
        if (!isSupabaseConfigured) {
          setMatches([]);
          setFilteredMatches([]);
          setIsLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: true });
        if (error) throw error;
        setMatches(data || []);
        setFilteredMatches(data || []);
      } catch (error) {
        console.error('Error loading matches:', error);
        setError('Failed to load matches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Filter matches when selectedTeam changes
  useEffect(() => {
    if (selectedTeam === 'all') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(
        match => match.team1 === selectedTeam || match.team2 === selectedTeam
      );
      setFilteredMatches(filtered);
    }
    // Reset to first page when changing teams
    setCurrentPage(1);
  }, [selectedTeam, matches]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Use filtered matches for display
  const displayMatches = filteredMatches;
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

        {/* Team Selection */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Team:
            </label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] py-2 px-3"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : displayMatches.length === 0 ? (
          <div className="text-center text-gray-500 text-lg py-12">No matches found for the selected team.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentMatches.map((match) => {
                // Tag color and label logic
                let tag = null;
                if (match.result === 'win') {
                  tag = (
                    <span className="absolute top-2 right-2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-green-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-green-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Win
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'loss') {
                  tag = (
                    <span className="absolute top-2 right-2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-red-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-red-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Loss
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'draw') {
                  tag = (
                    <span className="absolute top-2 right-2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-blue-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-blue-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h8" />
                          </svg>
                          Draw
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'will be played') {
                  tag = (
                    <span className="absolute top-2 right-2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-gray-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-gray-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Upcoming
                        </span>
                      </span>
                    </span>
                  );
                }

                const CardContent = (
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 relative">
                    <div className="h-32 bg-gradient-to-r from-[#1a3049] to-[#570808] flex items-center justify-center relative">
                      {tag}
                      <Image
                        src={match.image_url || '/prague_spartans_home_logo.jpeg'}
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
                        <span className="text-xs text-blue-500">{match.division}</span>
                      </div>
                    </div>
                  </div>
                );

                return match.url ? (
                  <a
                    key={match.id}
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:scale-[1.02] transition-transform duration-200"
                    style={{ textDecoration: 'none' }}
                  >
                    {CardContent}
                  </a>
                ) : (
                  <div key={match.id}>{CardContent}</div>
                );
              })}
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