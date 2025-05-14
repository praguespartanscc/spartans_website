'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Player = {
  id: string;
  name: string;
  player_type: string;
  age: number;
  email: string;
  role: string;
  team: string;
  created_at?: string;
  updated_at?: string;
};

export default function PlayersTree() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('Vanguards');

  const teams = [
    { id: 'Vanguards', name: 'Vanguards' },
    { id: 'Mobilizers', name: 'Mobilizers' },
    { id: 'Strikers', name: 'Strikers' }
  ];

  useEffect(() => {
    async function fetchPlayers() {
      try {
        console.log('Fetching players...');
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Players data received:', data);
        setPlayers(data || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load players.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  if (players.length === 0) {
    return <div className="text-center text-gray-500 py-8">No players found. Please add players through the Team Management page.</div>;
  }

  // Filter players by selected team
  const teamPlayers = players.filter(p => p.team === selectedTeam || (!p.team && selectedTeam === 'Vanguards'));

  // Group players by role within the selected team
  const captain = teamPlayers.find(p => p.role === 'captain');
  const viceCaptain = teamPlayers.find(p => p.role === 'vice-captain');
  const regularPlayers = teamPlayers.filter(p => p.role !== 'captain' && p.role !== 'vice-captain');
  
  // Get team color scheme
  const getTeamColors = () => {
    switch (selectedTeam) {
      case 'Mobilizers':
        return {
          primary: 'from-blue-700 to-blue-900',
          secondary: 'from-blue-600 to-blue-800',
          accent: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-blue-900'
        };
      case 'Strikers':
        return {
          primary: 'from-green-700 to-green-900',
          secondary: 'from-green-600 to-green-800',
          accent: 'bg-green-500',
          border: 'border-green-600',
          text: 'text-green-900'
        };
      default: // Vanguards
        return {
          primary: 'from-[#1a3049] to-[#2c4769]',
          secondary: 'from-[#2c4769] to-[#1a3049]',
          accent: 'bg-yellow-500',
          border: 'border-[#1a3049]',
          text: 'text-[#1a3049]'
        };
    }
  };

  const colors = getTeamColors();

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center text-[#1a3049] mb-8">Team Structure</h1>
      
      {/* Team Selection */}
      <div className="mb-12">
        <div className="max-w-md mx-auto">
          <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Select Team:
          </label>
          <div className="flex justify-center gap-4">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer ${
                  selectedTeam === team.id
                    ? `bg-gradient-to-r ${colors.primary} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Tree structure with connections - fixed lines */}
        {captain && (
          <div className="absolute left-1/2 top-[140px] w-1 h-80 bg-gray-300 -translate-x-1/2 z-0"></div>
        )}
        
        {captain && viceCaptain && (
          <div className="absolute left-1/2 top-[320px] w-40 h-1 bg-gray-300 -translate-x-1/2 z-0"></div>
        )}
        
        {regularPlayers.length > 0 && (
          <div className="absolute left-1/2 top-[500px] w-80 h-1 bg-gray-300 -translate-x-1/2 z-0"></div>
        )}
        
        {/* Additional diagonal connections for team members */}
        {regularPlayers.length > 0 && (
          <>
            <div className="absolute left-1/4 top-[500px] w-1 h-40 bg-gray-300 z-0"></div>
            <div className="absolute left-3/4 top-[500px] w-1 h-40 bg-gray-300 z-0"></div>
          </>
        )}

        {/* Captain */}
        <div className="flex justify-center mb-32 relative z-10">
          {captain ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${colors.primary} flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative overflow-hidden border-2 border-white`}>
                  <div className="text-center text-white p-4">
                    <div className="font-bold text-lg">{captain.name}</div>
                    <div className="text-xs capitalize mt-1">{captain.player_type}</div>
                  </div>
                </div>
                <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${colors.accent} text-white text-xs font-bold py-1 px-3 rounded-full shadow-md`}>
                  Captain
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No captain assigned for {selectedTeam}</div>
          )}
        </div>

        {/* Vice Captain */}
        <div className="flex justify-center mb-32 relative z-10">
          {viceCaptain ? (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${colors.secondary} flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative overflow-hidden border-2 border-white`}>
                  <div className="text-center text-white p-4">
                    <div className="font-bold">{viceCaptain.name}</div>
                    <div className="text-xs capitalize mt-1">{viceCaptain.player_type}</div>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-md">
                  Vice Captain
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">No vice captain assigned for {selectedTeam}</div>
          )}
        </div>

        {/* Team Members */}
        <div className="mt-12 relative z-10">
          <h2 className="text-xl font-bold text-center text-[#1a3049] mb-8">{selectedTeam} Players</h2>
          {regularPlayers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 justify-items-center">
              {regularPlayers.map(player => (
                <div key={player.id} className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center shadow hover:shadow-md transition-all border-2 ${colors.border}`}>
                    <div className={`text-center ${colors.text} p-2`}>
                      <div className="font-bold text-sm">{player.name}</div>
                      <div className="text-xs capitalize">{player.player_type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">No regular players in {selectedTeam} team</div>
          )}
        </div>
      </div>
    </div>
  );
} 