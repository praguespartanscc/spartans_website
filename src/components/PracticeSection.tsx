'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUpcomingPractices } from '@/services/practiceService';
import type { Practice } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

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

  // Fallback data for when we're loading or if there's an error
  const fallbackPractices = [
    {
      id: 1,
      title: 'Evening Net Practice',
      date: '2025-05-12',
      time: '18:00',
      venue: 'Prague Cricket Ground',
      description: 'Regular net session for all members. Bring your own gear if possible.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Weekend Training Session',
      date: '2025-05-16',
      time: '10:00',
      venue: 'Prague Cricket Academy',
      description: 'Full team practice with coach. Focus on batting and fielding drills.',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Bowling Workshop',
      date: '2025-05-19',
      time: '18:30',
      venue: 'Prague Cricket Ground',
      description: 'Special workshop focused on pace and spin bowling techniques.',
      created_at: new Date().toISOString()
    }
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Use fallback data if loading or error
  const displayPractices = (isLoading || error || upcomingPractices.length === 0) 
    ? fallbackPractices 
    : upcomingPractices;

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPractices.map((practice) => (
              <div 
                key={practice.id} 
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200"
              >
                <div className="h-32 bg-gradient-to-r from-[#1a3049] to-[#570808] flex items-center justify-center">
                  <Image
                    src="/prague_spartans_home_logo.jpeg"
                    alt="Prague Spartans"
                    width={120}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
                
                <div className="p-4">
                  <span className="block text-lg font-bold text-[#1a3049] mb-2">
                    {practice.title}
                  </span>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(practice.date)} at {practice.time}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#1a3049]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{practice.venue}</span>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{practice.description}</span>
                  </div>
                </div>
              </div>
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