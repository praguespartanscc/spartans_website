'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

type Practice = {
  id: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  notes: string;
  first_team: string;
  second_team: string;
  created_at: string;
};

export default function PracticesManagement() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPractice, setNewPractice] = useState({
    date: '',
    time: '',
    venue: '',
    type: 'regular',
    notes: '',
    first_team: '',
    second_team: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editPracticeId, setEditPracticeId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();

  const fetchPractices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPractices(data || []);
    } catch (error) {
      console.error('Error fetching practices:', error);
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
      fetchPractices();
    }
    checkAdminAndFetch();
  }, [supabase.auth, fetchPractices]);

  async function handleAddPractice(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('practices')
        .insert([newPractice])
        .select();

      if (error) throw error;

      setPractices([...(data || []), ...practices]);
      setNewPractice({
        date: '',
        time: '',
        venue: '',
        type: 'regular',
        notes: '',
        first_team: '',
        second_team: ''
      });
    } catch (error) {
      console.error('Error adding practice:', error);
    }
  }

  function confirmRemovePractice(practiceId: string) {
    setPracticeToDelete(practiceId);
    setShowConfirm(true);
  }

  async function handleRemovePractice() {
    if (!practiceToDelete) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('practices')
        .delete()
        .eq('id', practiceToDelete);

      if (error) throw error;

      setPractices(practices.filter(practice => practice.id !== practiceToDelete));
      toast.success('Practice removed successfully!');
    } catch (error) {
      console.error('Error removing practice:', error);
      toast.error('Error removing practice');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setPracticeToDelete(null);
    }
  }

  async function handleEditPractice(practice: Practice) {
    setEditPracticeId(practice.id);
    setNewPractice({
      date: practice.date,
      time: practice.time,
      venue: practice.venue,
      type: practice.type,
      notes: practice.notes,
      first_team: practice.first_team,
      second_team: practice.second_team
    });
  }

  async function handleUpdatePractice(e: React.FormEvent) {
    e.preventDefault();
    if (!editPracticeId) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('practices')
        .update({
          date: newPractice.date,
          time: newPractice.time,
          venue: newPractice.venue,
          type: newPractice.type,
          notes: newPractice.notes,
          first_team: newPractice.first_team,
          second_team: newPractice.second_team
        })
        .eq('id', editPracticeId)
        .select();
      if (error) throw error;
      setPractices(practices.map(p => p.id === editPracticeId ? (data ? data[0] : p) : p));
      setEditPracticeId(null);
      setNewPractice({ date: '', time: '', venue: '', type: 'regular', notes: '', first_team: '', second_team: '' });
      toast.success('Practice updated successfully!');
    } catch (error) {
      console.error('Error updating practice:', error);
      toast.error('Error updating practice');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditPracticeId(null);
    setNewPractice({ date: '', time: '', venue: '', type: 'regular', notes: '', first_team: '', second_team: '' });
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
          You need admin privileges to manage practices.
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
      
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Practice Management</h2>
        <p className="text-sm sm:text-base text-gray-600">Add, edit, and manage team practice sessions.</p>
      </div>
      
      {/* Add/Edit Practice Form */}
      <form onSubmit={editPracticeId ? handleUpdatePractice : handleAddPractice} className="bg-gray-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-[#1a3049] mb-3 sm:mb-4">{editPracticeId ? 'Edit Practice' : 'Add New Practice'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              value={newPractice.date}
              onChange={(e) => setNewPractice({ ...newPractice, date: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              id="time"
              value={newPractice.time}
              onChange={(e) => setNewPractice({ ...newPractice, time: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="venue" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              id="venue"
              value={newPractice.venue}
              onChange={(e) => setNewPractice({ ...newPractice, venue: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="first_team" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Team</label>
            <input
              type="text"
              id="first_team"
              value={newPractice.first_team}
              onChange={(e) => setNewPractice({ ...newPractice, first_team: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="second_team" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Second Team</label>
            <input
              type="text"
              id="second_team"
              value={newPractice.second_team}
              onChange={(e) => setNewPractice({ ...newPractice, second_team: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Practice Type</label>
            <select
              id="type"
              value={newPractice.type}
              onChange={(e) => setNewPractice({ ...newPractice, type: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
            >
              <option value="regular">Regular Practice</option>
              <option value="batting">Batting Practice</option>
              <option value="bowling">Bowling Practice</option>
              <option value="fielding">Fielding Practice</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              id="notes"
              value={newPractice.notes}
              onChange={(e) => setNewPractice({ ...newPractice, notes: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1a3049] focus:ring-[#1a3049] text-sm"
              placeholder="Add any additional notes or requirements for the practice..."
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="submit"
            className="bg-[#1a3049] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-[#1a3049]/90 transition-colors cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center"><span className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white mr-2"></span>{editPracticeId ? 'Updating...' : 'Adding...'}</span>
            ) : (
              editPracticeId ? 'Update Practice' : 'Add Practice'
            )}
          </button>
          {editPracticeId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-gray-400 transition-colors cursor-pointer text-xs sm:text-sm w-full sm:w-auto" 
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Practices List */}
      {practices.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500 text-sm sm:text-base">No practices found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isSubmitting && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049]"></div>
            </div>
          )}
          
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Second Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {practices.map((practice) => (
                  <tr key={practice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(practice.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{practice.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{practice.venue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{practice.first_team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{practice.second_team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{practice.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{practice.notes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPractice(practice)}
                        className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmRemovePractice(practice.id)}
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
          
          {/* Mobile card view */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4 px-2 py-3">
              {practices.map((practice) => (
                <div key={practice.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {new Date(practice.date).toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-gray-600">{practice.time}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                      {practice.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                    <div className="text-gray-500">Venue:</div>
                    <div className="text-gray-900">{practice.venue}</div>
                    
                    <div className="text-gray-500">First Team:</div>
                    <div className="text-gray-900">{practice.first_team}</div>
                    
                    <div className="text-gray-500">Second Team:</div>
                    <div className="text-gray-900">{practice.second_team}</div>
                  </div>
                  
                  {practice.notes && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">NOTES:</div>
                      <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md">
                        {practice.notes.length > 100 ? `${practice.notes.substring(0, 100)}...` : practice.notes}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEditPractice(practice)}
                      className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 py-1 px-2 rounded disabled:opacity-50 cursor-pointer"
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmRemovePractice(practice.id)}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 py-1 px-2 rounded disabled:opacity-50 cursor-pointer"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-95 rounded-lg max-w-md w-full shadow-xl transform transition-all">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Confirm Removal</h3>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">Are you sure you want to remove this practice session? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex justify-center py-1.5 sm:py-2 px-3 sm:px-4 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemovePractice}
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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