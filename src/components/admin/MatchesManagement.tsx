'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

type Match = {
  id: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  result: string;
  division: string;
  url: string;
  created_at: string;
};

type NewMatch = {
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  result: string;
  division: string;
  url: string;
};

export default function MatchesManagement() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMatch, setNewMatch] = useState<NewMatch>({
    team1: '',
    team2: '',
    date: '',
    time: '',
    venue: '',
    type: 'friendly',
    result: 'will be played',
    division: 'division1',
    url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();

  const fetchMatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
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
      fetchMatches();
    }
    checkAdminAndFetch();
  }, [supabase.auth, fetchMatches]);

  async function handleAddMatch(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([newMatch])
        .select();

      if (error) throw error;

      setMatches([...(data || []), ...matches]);
      setNewMatch({
        team1: '',
        team2: '',
        date: '',
        time: '',
        venue: '',
        type: 'friendly',
        result: 'will be played',
        division: 'division1',
        url: ''
      });
      toast.success('Match added successfully!');
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Error adding match');
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmRemoveMatch(matchId: string) {
    setMatchToDelete(matchId);
    setShowConfirm(true);
  }

  async function handleRemoveMatch() {
    if (!matchToDelete) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchToDelete);

      if (error) throw error;

      setMatches(matches.filter(match => match.id !== matchToDelete));
      toast.success('Match removed successfully!');
    } catch (error) {
      console.error('Error removing match:', error);
      toast.error('Error removing match');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setMatchToDelete(null);
    }
  }

  async function handleEditMatch(match: Match) {
    setEditMatchId(match.id);
    setNewMatch({
      team1: match.team1,
      team2: match.team2,
      date: match.date,
      time: match.time,
      venue: match.venue,
      type: match.type,
      result: match.result,
      division: match.division,
      url: match.url
    });
  }

  async function handleUpdateMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!editMatchId) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({
          team1: newMatch.team1,
          team2: newMatch.team2,
          date: newMatch.date,
          time: newMatch.time,
          venue: newMatch.venue,
          type: newMatch.type,
          result: newMatch.result,
          division: newMatch.division,
          url: newMatch.url
        })
        .eq('id', editMatchId)
        .select();
      if (error) throw error;
      setMatches(matches.map(m => m.id === editMatchId ? (data ? data[0] : m) : m));
      setEditMatchId(null);
      setNewMatch({ 
        team1: '', 
        team2: '', 
        date: '', 
        time: '', 
        venue: '', 
        type: 'friendly',
        result: 'will be played',
        division: 'division1',
        url: ''
      });
      toast.success('Match updated successfully!');
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Error updating match');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditMatchId(null);
    setNewMatch({ 
      team1: '', 
      team2: '', 
      date: '', 
      time: '', 
      venue: '', 
      type: 'friendly',
      result: 'will be played',
      division: 'division1',
      url: ''
    });
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
          You need admin privileges to manage matches.
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
      {/* Add/Edit Match Form */}
      <form onSubmit={editMatchId ? handleUpdateMatch : handleAddMatch} className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-[#1a3049] mb-4">{editMatchId ? 'Edit Match' : 'Add New Match'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="team1" className="block text-sm font-medium text-gray-700">Team 1</label>
            <input
              type="text"
              id="team1"
              value={newMatch.team1}
              onChange={(e) => setNewMatch({ ...newMatch, team1: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          <div>
            <label htmlFor="team2" className="block text-sm font-medium text-gray-700">Team 2</label>
            <input
              type="text"
              id="team2"
              value={newMatch.team2}
              onChange={(e) => setNewMatch({ ...newMatch, team2: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={newMatch.date}
              onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              id="time"
              value={newMatch.time}
              onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700">Venue</label>
            <input
              type="text"
              id="venue"
              value={newMatch.venue}
              onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Match Type</label>
            <select
              id="type"
              value={newMatch.type}
              onChange={(e) => setNewMatch({ ...newMatch, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="friendly">Friendly</option>
              <option value="league">League</option>
              <option value="tournament">Tournament</option>
            </select>
          </div>
          <div>
            <label htmlFor="result" className="block text-sm font-medium text-gray-700">Result</label>
            <select
              id="result"
              value={newMatch.result}
              onChange={(e) => setNewMatch({ ...newMatch, result: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="will be played">Will be played</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="draw">Draw</option>
            </select>
          </div>
          <div>
            <label htmlFor="division" className="block text-sm font-medium text-gray-700">Division</label>
            <select
              id="division"
              value={newMatch.division}
              onChange={(e) => setNewMatch({ ...newMatch, division: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
            >
              <option value="division1">Division 1</option>
              <option value="division2">Division 2</option>
              <option value="division3">Division 3</option>
            </select>
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
            <input
              type="url"
              id="url"
              value={newMatch.url}
              onChange={(e) => setNewMatch({ ...newMatch, url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049]"
              placeholder="https://example.com"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="submit"
            className="bg-[#1a3049] text-white px-4 py-2 rounded-md hover:bg-[#1a3049]/90 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>{editMatchId ? 'Updating...' : 'Adding...'}</span>
            ) : (
              editMatchId ? 'Update Match' : 'Add Match'
            )}
          </button>
          {editMatchId && (
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

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No matches found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isSubmitting && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match) => (
                <tr 
                  key={match.id}
                  onClick={() => match.url && window.open(match.url, '_blank')}
                  className={match.url ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.team1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.team2}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.venue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(match.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{match.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {match.result === 'win' && (
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-green-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-green-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          Win
                        </span>
                      </span>
                    )}
                    {match.result === 'loss' && (
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-red-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-red-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Loss
                        </span>
                      </span>
                    )}
                    {match.result === 'draw' && (
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-blue-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-blue-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h8" />
                          </svg>
                          Draw
                        </span>
                      </span>
                    )}
                    {match.result === 'will be played' && (
                      <span className="relative inline-flex items-center group">
                        <span className="absolute inset-0 rounded-full opacity-25 bg-gray-400 blur-sm group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative inline-flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-gray-600 shadow-lg transform hover:scale-105 transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Upcoming
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{match.division}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMatch(match);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmRemoveMatch(match.id);
                      }}
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
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
              <p className="text-gray-700 mb-4">Are you sure you want to remove this match? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMatch}
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