'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

type CommitteeMember = {
  id: string;
  name: string;
  position: string;
  created_at?: string;
};

export default function CommitteePage() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommitteeMembers() {
      try {
        setLoading(true);
        
        // Handle case when Supabase is not configured (development/preview)
        if (!isSupabaseConfigured) {
          console.log('Supabase not configured, using mock data');
          setCommitteeMembers([
            { id: '1', name: 'John Smith', position: 'Chairman' },
            { id: '2', name: 'Sarah Johnson', position: 'President' },
            { id: '3', name: 'Mike Davis', position: 'Secretary' },
            { id: '4', name: 'Emma Wilson', position: 'Treasurer' },
            { id: '5', name: 'Robert Lee', position: 'Manager' },
          ]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('committee')
          .select('*')
          .order('position', { ascending: true });

        if (error) throw error;
        setCommitteeMembers(data || []);
      } catch (error) {
        console.error('Error fetching committee members:', error);
        setError('Failed to load committee members');
      } finally {
        setLoading(false);
      }
    }

    fetchCommitteeMembers();
  }, []);

  // Function to get position-specific data
  const getPositionData = (position: string) => {
    switch (position) {
      case 'President':
        return {
          icon: '👑',
          description: 'Serves as the figurehead and leads the club\'s official functions.',
          color: 'bg-purple-700'
        };
      case 'Chairman':
        return {
          icon: '🏛️',
          description: 'Chairs committee meetings and oversees the club\'s direction.',
          color: 'bg-blue-800'
        };
      case 'Secretary':
        return {
          icon: '📝',
          description: 'Manages correspondence, keeps records and handles administrative duties.',
          color: 'bg-green-700'
        };
      case 'Treasurer':
        return {
          icon: '💰',
          description: 'Manages the club\'s finances, budget, and financial reporting.',
          color: 'bg-amber-600'
        };
      case 'Manager':
        return {
          icon: '🏏',
          description: 'Oversees team selection, training and cricket operations.',
          color: 'bg-red-700'
        };
      default:
        return {
          icon: '👤',
          description: 'Serves on the committee for the club.',
          color: 'bg-gray-700'
        };
    }
  };

  // Helper function to organize members by position
  const getOrganizedMembers = () => {
    const positionOrder = ['President', 'Chairman', 'Secretary', 'Treasurer', 'Manager'];
    
    // Sort members by position order
    return [...committeeMembers].sort((a, b) => {
      return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1a3049] mb-4">Club Committee</h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Meet the dedicated team behind Prague Spartans Cricket Club. Our committee members work tirelessly to ensure the smooth running of the club and to create the best possible experience for all our members.
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center my-8">
              {error}
            </div>
          )}

          {/* Committee Members Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getOrganizedMembers().map((member) => {
                const positionData = getPositionData(member.position);
                
                return (
                  <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                    <div className={`${positionData.color} h-2`}></div>
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1a3049] text-white text-2xl mr-4">
                          {positionData.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[#1a3049]">{member.name}</h3>
                          <div className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium mt-1">
                            {member.position}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{positionData.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && committeeMembers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No committee members found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 