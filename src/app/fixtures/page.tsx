'use client';

import { useState, useEffect } from 'react';
import type { Match } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type ResultFilterType = 'all' | 'win' | 'loss' | 'draw' | 'upcoming';

export default function FixturesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(12);
  const [resultFilter, setResultFilter] = useState<ResultFilterType>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [teams, setTeams] = useState<string[]>([]);

  const resultFilters = [
    { id: 'all', name: 'All Matches' },
    { id: 'win', name: 'Wins' },
    { id: 'loss', name: 'Losses' },
    { id: 'draw', name: 'Draws' },
    { id: 'upcoming', name: 'Upcoming' }
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
        
        // Extract unique teams
        const uniqueTeams = new Set<string>();
        data?.forEach(match => {
          uniqueTeams.add(match.team1);
          uniqueTeams.add(match.team2);
        });
        setTeams(Array.from(uniqueTeams).sort());
      } catch (error) {
        console.error('Error loading matches:', error);
        setError('Failed to load matches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Filter matches when result filter or team filter changes
  useEffect(() => {
    let filtered = [...matches];
    
    // Apply result filter
    if (resultFilter !== 'all') {
      if (resultFilter === 'upcoming') {
        filtered = filtered.filter(match => match.result === 'will be played');
      } else {
        filtered = filtered.filter(match => match.result === resultFilter);
      }
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(match => 
        match.team1 === teamFilter || match.team2 === teamFilter
      );
    }
    
    setFilteredMatches(filtered);
    // Reset to first page when changing filters
    setCurrentPage(1);
  }, [resultFilter, teamFilter, matches]);

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

        {/* Filters */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Result Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Filter by Result:
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {resultFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setResultFilter(filter.id as ResultFilterType)}
                      className={`px-4 py-2 rounded-full cursor-pointer transition-all duration-300 ${
                        resultFilter === filter.id
                          ? 'bg-[#1a3049] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Filter by Team:
                </label>
                <div className="relative">
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="block w-full rounded-full border-gray-200 py-2 pl-4 pr-10 text-sm focus:border-[#1a3049] focus:ring-[#1a3049] outline-none"
                  >
                    <option value="all">All Teams</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : displayMatches.length === 0 ? (
          <div className="text-center text-gray-500 text-lg py-12">No matches found with the selected filter.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentMatches.map((match) => {
                // Tag color and label logic
                let tag = null;
                if (match.result === 'win') {
                  tag = (
                    <span className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-green-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-[#daa520] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Win
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'loss') {
                  tag = (
                    <span className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-red-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-[#b32428] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          Loss
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'draw') {
                  tag = (
                    <span className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-blue-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-[#4682b4] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Draw
                        </span>
                      </span>
                    </span>
                  );
                } else if (match.result === 'will be played') {
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

                const CardContent = (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/40 relative border-t-4 border-[#1a3049]">
                    <div className="h-36 bg-gradient-to-br from-[#1a3049] via-[#2a4a6c] to-[#213a58] flex items-center justify-center relative overflow-hidden rounded-b-3xl">
                      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent"></div>
                      </div>
                      <div className="flex flex-col items-center justify-center z-10 px-4 text-center mt-8">
                        {tag}
                        <div className="flex items-center justify-center space-x-3 mb-1">
                          {match.result === 'win' ? (
                            <>
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
                            </>
                          ) : match.result === 'loss' ? (
                            <>
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
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
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

                return match.url ? (
                  <a
                    key={match.id}
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transform transition-all duration-300 hover:translate-y-[-4px] hover:scale-[1.01]"
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