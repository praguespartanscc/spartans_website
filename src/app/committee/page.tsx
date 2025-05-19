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

  // Helper function to organize members as a tree
  const getTreeStructure = () => {
    const president = committeeMembers.find(m => m.position === 'President');
    const chairman = committeeMembers.find(m => m.position === 'Chairman');
    const others = committeeMembers.filter(m => !['President', 'Chairman'].includes(m.position));
    return { president, chairman, others };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-16 overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="max-w-full sm:max-w-8xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1a3049] mb-4">Club Committee</h1>
            <p className="text-gray-600 max-w-full sm:max-w-3xl mx-auto text-base sm:text-lg">
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

          {/* Committee Members Tree Structure */}
          {!loading && !error && (
            <div className="flex flex-col items-center w-full">
              {(() => {
                const { president, chairman, others } = getTreeStructure();
                return (
                  <>
                    {/* President */}
                    {president && (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-white rounded-lg shadow-md w-full max-w-xs sm:w-80 mb-2">
                          <div className={`${getPositionData(president.position).color} h-2`}></div>
                          <div className="p-4 sm:p-6 flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#1a3049] text-white text-xl sm:text-2xl mr-3 sm:mr-4">
                              {getPositionData(president.position).icon}
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-[#1a3049]">{president.name}</h3>
                              <div className="inline-block bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mt-1">
                                {president.position}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm px-4 sm:px-6 pb-3 sm:pb-4">{getPositionData(president.position).description}</p>
                        </div>
                        {/* Line to Chairman */}
                        {chairman && <div className="h-4 sm:h-6 w-1 bg-gray-300 mx-auto" />}
                      </div>
                    )}
                    {/* Chairman */}
                    {chairman && (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-white rounded-lg shadow-md w-full max-w-xs sm:w-72 mb-2">
                          <div className={`${getPositionData(chairman.position).color} h-2`}></div>
                          <div className="p-4 sm:p-6 flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#1a3049] text-white text-xl sm:text-2xl mr-3 sm:mr-4">
                              {getPositionData(chairman.position).icon}
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-[#1a3049]">{chairman.name}</h3>
                              <div className="inline-block bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mt-1">
                                {chairman.position}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm px-4 sm:px-6 pb-3 sm:pb-4">{getPositionData(chairman.position).description}</p>
                        </div>
                        {/* Lines to other members */}
                        {others.length > 0 && (
                          <div className="flex flex-col items-center w-full">
                            <div className="h-4 sm:h-6 w-1 bg-gray-300 mx-auto" />
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-0 w-full items-center justify-center">
                              {others.map(member => (
                                <div key={member.id} className="flex flex-col items-center w-full max-w-xs">
                                  <div className="bg-white rounded-lg shadow-md w-full">
                                    <div className={`${getPositionData(member.position).color} h-2`}></div>
                                    <div className="p-4 sm:p-6 flex items-center">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#1a3049] text-white text-xl sm:text-2xl mr-3 sm:mr-4">
                                        {getPositionData(member.position).icon}
                                      </div>
                                      <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-[#1a3049]">{member.name}</h3>
                                        <div className="inline-block bg-gray-100 text-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mt-1">
                                          {member.position}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm px-4 sm:px-6 pb-3 sm:pb-4">{getPositionData(member.position).description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
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