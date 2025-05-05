'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Player = {
  id: number;
  name: string;
  player_type: string;
  age: number;
  email: string;
  role: string;
};

export default function PlayersTree() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase
        .from('players')
        .select('*');
      if (!error) setPlayers(data || []);
      setIsLoading(false);
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

  // Group players by role
  const captain = players.find(p => p.role === 'captain');
  const viceCaptain = players.find(p => p.role === 'vice-captain');
  const teamPlayers = players.filter(p => p.role !== 'captain' && p.role !== 'vice-captain');

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-center text-[#1a3049] mb-8">Team Structure</h1>
      <div className="bg-white shadow-md rounded-lg p-8">
        <ul className="space-y-6">
          {captain && (
            <li>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-[#1a3049]">Captain</span>
                <span className="text-lg font-semibold mt-1">{captain.name} ({captain.player_type}, Age: {captain.age})</span>
                <span className="text-gray-500 text-sm">{captain.email}</span>
              </div>
            </li>
          )}
          {viceCaptain && (
            <li>
              <div className="flex flex-col items-center ml-8">
                <span className="text-lg font-bold text-[#1a3049]">Vice Captain</span>
                <span className="text-base font-semibold mt-1">{viceCaptain.name} ({viceCaptain.player_type}, Age: {viceCaptain.age})</span>
                <span className="text-gray-500 text-sm">{viceCaptain.email}</span>
              </div>
            </li>
          )}
          {teamPlayers.length > 0 && (
            <li>
              <div className="flex flex-col items-center ml-16">
                <span className="text-base font-bold text-[#1a3049]">Team Members</span>
                <ul className="mt-2 space-y-2">
                  {teamPlayers.map(player => (
                    <li key={player.id} className="text-sm text-gray-800">
                      <span className="font-medium">{player.name}</span> ({player.player_type}, Age: {player.age}) - {player.email}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 