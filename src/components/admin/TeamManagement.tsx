'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

type Player = {
  id: string;
  name: string;
  email: string;
  age: number;
  player_type: string;
  role: string;
  team: string;
  created_at: string;
};

export default function TeamManagement() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    age: '',
    player_type: 'batsman',
    role: 'player',
    team: 'Vanguards'
  });
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();

  const fetchPlayers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function checkAdminAndFetch() {
      await supabase.auth.refreshSession();
      const { data: { user } } = await supabase.auth.getUser();
      const admin = !!user?.user_metadata?.isAdmin;
      setIsAdmin(admin);
      fetchPlayers();
    }
    checkAdminAndFetch();
  }, [supabase.auth, fetchPlayers]);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate age is a number
    const age = parseInt(newPlayer.age);
    if (isNaN(age)) {
      toast.error('Please enter a valid age');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ ...newPlayer, age }])
        .select();

      if (error) throw error;

      setPlayers([...(data || []), ...players]);
      setNewPlayer({ name: '', email: '', age: '', player_type: 'batsman', role: 'player', team: 'Vanguards' });
      toast.success('Player added successfully!');
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Error adding player');
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmRemovePlayer(playerId: string) {
    setPlayerToDelete(playerId);
    setShowConfirm(true);
  }

  async function handleRemovePlayer() {
    if (!playerToDelete) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerToDelete);

      if (error) throw error;

      setPlayers(players.filter(player => player.id !== playerToDelete));
      toast.success('Player removed successfully!');
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Error removing player');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setPlayerToDelete(null);
    }
  }

  async function handleEditPlayer(player: Player) {
    setEditPlayerId(player.id);
    setNewPlayer({
      name: player.name,
      email: player.email,
      age: player.age.toString(),
      player_type: player.player_type,
      role: player.role,
      team: player.team || 'Vanguards'
    });
  }

  async function handleUpdatePlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!editPlayerId) return;
    const age = parseInt(newPlayer.age);
    if (isNaN(age)) {
      toast.error('Please enter a valid age');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .update({
          name: newPlayer.name,
          email: newPlayer.email,
          age,
          player_type: newPlayer.player_type,
          role: newPlayer.role,
          team: newPlayer.team
        })
        .eq('id', editPlayerId)
        .select();
      if (error) throw error;
      setPlayers(players.map(p => p.id === editPlayerId ? (data ? data[0] : p) : p));
      setEditPlayerId(null);
      setNewPlayer({ name: '', email: '', age: '', player_type: 'batsman', role: 'player', team: 'Vanguards' });
      toast.success('Player updated successfully!');
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Error updating player');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditPlayerId(null);
    setNewPlayer({ name: '', email: '', age: '', player_type: 'batsman', role: 'player', team: 'Vanguards' });
  }

  if (isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <p className="text-red-600 font-semibold text-lg">
          You need admin privileges to manage players.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Add Player Form */}
      <form onSubmit={editPlayerId ? handleUpdatePlayer : handleAddPlayer} className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-[#1a3049] mb-4">{editPlayerId ? 'Edit Player' : 'Add New Player'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={newPlayer.email}
              onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              id="age"
              min="12"
              max="80"
              value={newPlayer.age}
              onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="player_type" className="block text-sm font-medium text-gray-700">Player Type</label>
            <select
              id="player_type"
              value={newPlayer.player_type}
              onChange={(e) => setNewPlayer({ ...newPlayer, player_type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="allrounder">All-rounder</option>
              <option value="wicketkeeper">Wicketkeeper</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Team Role</label>
            <select
              id="role"
              value={newPlayer.role}
              onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="player">Player</option>
              <option value="captain">Captain</option>
              <option value="vice-captain">Vice Captain</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700">Team</label>
            <select
              id="team"
              value={newPlayer.team}
              onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="Vanguards">Vanguards</option>
              <option value="Mobilizers">Mobilizers</option>
              <option value="Strikers">Strikers</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="submit"
            className="bg-[#1a3049] text-white px-4 py-2 rounded-md hover:bg-[#1a3049]/90 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>{editPlayerId ? 'Updating...' : 'Adding...'}</span>
            ) : (
              editPlayerId ? 'Update Player' : 'Add Player'
            )}
          </button>
          {editPlayerId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Players List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isSubmitting && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.age}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{player.player_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{player.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{player.team || 'Vanguards'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => confirmRemovePlayer(player.id)}
                    className="text-red-600 hover:text-red-900 mr-4 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-blue-600 hover:text-blue-900 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-95 rounded-lg max-w-md w-full shadow-xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Confirm Removal</h3>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">Are you sure you want to remove this player? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemovePlayer}
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 