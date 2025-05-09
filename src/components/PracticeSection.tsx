'use client';

import Image from 'next/image';
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
      {/* Practice Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">
            {formatDate(practice.date)} at {practice.time}
          </span>
          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
            {practice.type} Practice
          </span>
        </div>
        <div className="font-bold text-xl text-[#1a3049] mb-1">
          {practice.venue}
        </div>
        {(practice.first_team || practice.second_team) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Teams:</span> {practice.first_team} vs {practice.second_team}
          </div>
        )}
        {practice.notes && practice.notes.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            <span className="font-medium">Notes:</span> {practice.notes}
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