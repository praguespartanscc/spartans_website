'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/services/authService';
import toast, { Toaster } from 'react-hot-toast';

type TeamApplication = {
  id: number;
  name: string;
  email: string;
  age: string;
  location: string;
  specification: string;
  experience: string;
  created_at: string;
  status?: 'pending' | 'accepted' | 'rejected';
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    async function checkAdmin() {
      try {
        const currentUser = await supabase.auth.getUser();
        if (!currentUser.data.user) {
          window.location.href = '/login';
          return;
        }

        const isAdmin = await isUserAdmin(currentUser.data.user);
        if (!isAdmin) {
          window.location.href = '/not-admin';
          return;
        }

        fetchApplications();
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Error loading admin status');
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, []);

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('team_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteApplication(id: number) {
    setProcessingId(id);
    const loadingToast = toast.loading('Deleting application...');
    
    try {
      const { error } = await supabase
        .from('team_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setApplications(applications.filter(app => app.id !== id));
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      toast.dismiss(loadingToast);
      setProcessingId(null);
    }
  }

  async function handleUpdateStatus(id: number, status: 'accepted' | 'rejected') {
    setProcessingId(id);
    const loadingToast = toast.loading(`${status === 'accepted' ? 'Accepting' : 'Rejecting'} application...`);
    
    try {
      const { error } = await supabase
        .from('team_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Update the local state
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      
      toast.success(`Application ${status} successfully`);
    } catch (error) {
      console.error(`Error updating application status:`, error);
      toast.error(`Failed to update application status`);
    } finally {
      toast.dismiss(loadingToast);
      setProcessingId(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const filteredApplications = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus || 
        (filterStatus === 'pending' && !app.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-black">Team Applications</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Status filter */}
            <div className="mb-6 flex justify-end">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    filterStatus === 'all'
                      ? 'bg-[#1a3049] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 text-sm font-medium ${
                    filterStatus === 'pending'
                      ? 'bg-[#1a3049] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-t border-b border-gray-300`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('accepted')}
                  className={`px-4 py-2 text-sm font-medium ${
                    filterStatus === 'accepted'
                      ? 'bg-[#1a3049] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-t border-b border-gray-300`}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    filterStatus === 'rejected'
                      ? 'bg-[#1a3049] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300`}
                >
                  Rejected
                </button>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-medium text-gray-600">No applications found</h2>
                <p className="mt-2 text-gray-500">
                  {filterStatus === 'all' 
                    ? 'When people apply to join the team, their applications will appear here.'
                    : `No ${filterStatus} applications found.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{application.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {application.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {application.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {application.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {application.specification}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            application.status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : application.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(application.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {(!application.status || application.status === 'pending') && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'accepted')}
                                  disabled={processingId === application.id}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(application.id, 'rejected')}
                                  disabled={processingId === application.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteApplication(application.id)}
                              disabled={processingId === application.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 