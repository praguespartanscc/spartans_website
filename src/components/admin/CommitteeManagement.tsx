'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

type CommitteeMember = {
  id: string;
  name: string;
  position: string;
  created_at?: string;
};

type Position = 'President' | 'Chairman' | 'Secretary' | 'Treasurer' | 'Manager';

const positions: Position[] = ['President', 'Chairman', 'Secretary', 'Treasurer', 'Manager'];

export default function CommitteeManagement() {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('President');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Fetch committee members
  useEffect(() => {
    async function fetchCommitteeMembers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('committee')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCommitteeMembers(data || []);
      } catch (error) {
        console.error('Error fetching committee members:', error);
        setError('Failed to load committee members');
        toast.error('Failed to load committee members');
      } finally {
        setLoading(false);
      }
    }

    fetchCommitteeMembers();
  }, [supabase]);

  // Reset form
  const resetForm = () => {
    setName('');
    setPosition('President');
    setIsEditing(false);
    setEditingMemberId(null);
    setError(null);
  };

  // Set up edit mode
  const handleEditMember = (member: CommitteeMember) => {
    setName(member.name);
    setPosition(member.position as Position);
    setIsEditing(true);
    setEditingMemberId(member.id);
    setError(null);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    resetForm();
  };

  // Confirm member removal
  const confirmRemoveMember = (id: string) => {
    setMemberToRemove(id);
    setShowConfirm(true);
  };

  // Add new committee member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a name');
      toast.error('Please enter a name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Show loading toast
      const loadingToast = toast.loading('Adding committee member...');

      const { data, error } = await supabase
        .from('committee')
        .insert([
          {
            name,
            position,
          },
        ])
        .select();

      if (error) throw error;

      setCommitteeMembers([...(data || []), ...committeeMembers]);
      resetForm();
      
      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast);
      toast.success('Committee member added successfully');
    } catch (error) {
      console.error('Error adding committee member:', error);
      setError('Failed to add committee member');
      toast.error('Failed to add committee member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update committee member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a name');
      toast.error('Please enter a name');
      return;
    }

    if (!editingMemberId) {
      setError('Member ID is missing');
      toast.error('Error updating: Member ID is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Show loading toast
      const loadingToast = toast.loading('Updating committee member...');

      const { error } = await supabase
        .from('committee')
        .update({
          name,
          position,
        })
        .eq('id', editingMemberId)
        .select();

      if (error) throw error;

      // Update the members list
      setCommitteeMembers(
        committeeMembers.map(member => 
          member.id === editingMemberId ? { ...member, name, position } : member
        )
      );
      
      resetForm();
      
      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast);
      toast.success('Committee member updated successfully');
    } catch (error) {
      console.error('Error updating committee member:', error);
      setError('Failed to update committee member');
      toast.error('Failed to update committee member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove committee member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Removing committee member...');
      
      const { error } = await supabase
        .from('committee')
        .delete()
        .eq('id', memberToRemove);

      if (error) throw error;

      setCommitteeMembers(committeeMembers.filter((member) => member.id !== memberToRemove));
      
      // If we were editing this member, reset the form
      if (editingMemberId === memberToRemove) {
        resetForm();
      }
      
      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast);
      toast.success('Committee member removed successfully');
    } catch (error) {
      console.error('Error removing committee member:', error);
      setError('Failed to remove committee member');
      toast.error('Failed to remove committee member');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
      setMemberToRemove(null);
    }
  };

  return (
    <div>
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold mb-6">Committee Management</h2>

      {/* Add/Edit Committee Member Form */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Edit Committee Member' : 'Add New Committee Member'}
        </h3>
        <form onSubmit={isEditing ? handleUpdateMember : handleAddMember}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
                placeholder="Enter name"
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a3049]"
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 bg-[#1a3049] text-white rounded-md hover:bg-[#152538] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3049] disabled:opacity-50"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update Committee Member' : 'Add Committee Member')}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Committee Members Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Committee Members</h3>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a3049] mx-auto"></div>
          </div>
        ) : committeeMembers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No committee members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {committeeMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer"
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
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
              <p className="text-gray-700 mb-4">Are you sure you want to remove this committee member? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="cursor-pointer inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={isSubmitting}
                  className="cursor-pointer inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 transition-colors"
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