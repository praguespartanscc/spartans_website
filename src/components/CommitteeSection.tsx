'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

type CommitteeMember = {
  id: string;
  name: string;
  position: string;
};

export default function CommitteeSection() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommitteeMembers() {
      try {
        setLoading(true);
        
        // Handle case when Supabase is not configured (development/preview)
        if (!isSupabaseConfigured) {
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
      } finally {
        setLoading(false);
      }
    }

    fetchCommitteeMembers();
  }, []);

  // Function to get position data
  const getPositionData = (position: string) => {
    switch (position) {
      case 'President':
        return {
          icon: '👑',
          color: 'bg-purple-700'
        };
      case 'Chairman':
        return {
          icon: '🏛️',
          color: 'bg-blue-800'
        };
      case 'Secretary':
        return {
          icon: '📝',
          color: 'bg-green-700'
        };
      case 'Treasurer':
        return {
          icon: '💰',
          color: 'bg-amber-600'
        };
      case 'Manager':
        return {
          icon: '🏏',
          color: 'bg-red-700'
        };
      default:
        return {
          icon: '👤',
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1a3049] mb-2">Our Committee</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Meet the dedicated team behind Prague Spartans Cricket Club who ensure the smooth running of our club.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : committeeMembers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No committee members found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {getOrganizedMembers().map((member) => {
              const positionData = getPositionData(member.position);
              
              return (
                <div 
                  key={member.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100/40 border-t-4"
                  style={{ borderTopColor: member.position === 'President' ? '#9333ea' : 
                            member.position === 'Chairman' ? '#1e40af' : 
                            member.position === 'Secretary' ? '#15803d' : 
                            member.position === 'Treasurer' ? '#b45309' :
                            member.position === 'Manager' ? '#b91c1c' : '#4b5563' }}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1a3049] text-white text-2xl mr-3">
                        {positionData.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1a3049]">{member.name}</h3>
                        <div className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          {member.position}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/committee"
            className="cursor-pointer bg-[#1a3049] hover:bg-[#2a4059] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            Learn More About Our Committee
          </Link>
        </div>
      </div>
    </section>
  );
} 