'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllPractices } from '@/services/practiceService';
import type { Practice } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

// Fallback data for when we're loading or if there's an error


export default function PracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const practicesPerPage = 20;

  useEffect(() => {
    async function loadPractices() {
      try {
        if (!isSupabaseConfigured) {
          console.warn('Supabase is not configured. Using fallback practice data.');
          setPractices([]);
          setIsLoading(false);
          return;
        }

        const allPractices = await getAllPractices();
        setPractices(allPractices);
      } catch (err) {
        console.error('Failed to load practices:', err);
        setError('Failed to load practices. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPractices();
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
  const displayPractices = (isLoading || error || practices.length === 0) 
    ? []
    : practices;
    
  const indexOfLastPractice = currentPage * practicesPerPage;
  const indexOfFirstPractice = indexOfLastPractice - practicesPerPage;
  const currentPractices = displayPractices.slice(indexOfFirstPractice, indexOfLastPractice);
  const totalPages = Math.ceil(displayPractices.length / practicesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a3049] mb-3">Practice Sessions</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View all upcoming practice sessions for the Prague Spartans Cricket Club
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPractices.map((practice) => (
                <div 
                  key={practice.id} 
                  className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/40 relative border-t-4 border-[#1a3049] hover:scale-105"
                >
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
                          {practice.first_team || "Spartans CC"}
                        </span>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-xs text-white/60 uppercase font-medium">vs</span>
                          <div className="w-6 h-0.5 bg-white/10 rounded-full mt-1"></div>
                        </div>
                        <span className="text-xl font-semibold text-white max-w-[40%]" style={{ textShadow: 'rgba(0, 0, 0, 0.3) 0px 1px 2px' }}>
                          {practice.second_team || "Training"}
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
                        {practice.type || "practice"}
                      </span>
                      {practice.description && (
                        <span className="text-xs text-gray-500 truncate max-w-[70%]" title={practice.description}>
                          {practice.description}
                        </span>
                      )}
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