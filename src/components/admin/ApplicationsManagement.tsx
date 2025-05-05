'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

type TeamApplication = {
  id: number;
  name: string;
  email: string;
  age: string;
  location: string;
  specification: string;
  experience: string;
  status: string;
  created_at: string;
};

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching applications from Supabase...');
      
      // Make the API request directly without strict session validation
      // This matches the pattern used in other admin components
      const { data, error, status } = await supabase
        .from('team_applications')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response status:', status);
      
      if (error) {
        console.error('Supabase error:', error);
        
        // If we get an auth error, show a friendly message
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          setError('Your session has expired. Please refresh the page or log in again.');
        } else {
          setError(`Failed to load applications: ${error.message}`);
        }
        return;
      }
      
      console.log('Data received:', data);
      setApplications(data || []);
    } catch (error: Error | unknown) {
      console.error('Error fetching applications:', error);
      
      // Check if it's an auth error
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('auth') || message.includes('session') || message.includes('JWT')) {
        setError('Authentication error. Please refresh the page or log in again.');
      } else {
        setError('Failed to load applications. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

      // Update selected application if it's the one being modified
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication({ ...selectedApplication, status });
      }
      
      toast.success(`Application ${status} successfully`);
    } catch (error) {
      console.error(`Error updating application status:`, error);
      toast.error(`Failed to update application status`);
    } finally {
      toast.dismiss(loadingToast);
      setProcessingId(null);
    }
  }

  function confirmDeleteApplication(id: number) {
    setApplicationToDelete(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteApplication() {
    if (!applicationToDelete) return;
    
    setProcessingId(applicationToDelete);
    try {
      const { error } = await supabase
        .from('team_applications')
        .delete()
        .eq('id', applicationToDelete);

      if (error) throw error;

      // Close details modal if the deleted application was selected
      if (selectedApplication && selectedApplication.id === applicationToDelete) {
        setShowDetails(false);
        setSelectedApplication(null);
      }

      fetchApplications(); // Refresh the list
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      setProcessingId(null);
      setShowDeleteConfirm(false);
      setApplicationToDelete(null);
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

  function viewApplicationDetails(application: TeamApplication) {
    setSelectedApplication(application);
    setShowDetails(true);
  }

  const filteredApplications = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  // Complete sign out and re-authentication 
  const performFullReauthentication = async () => {
    setIsLoading(true);
    try {
      // Sign out completely to clear all auth state
      await supabase.auth.signOut({ scope: 'global' });
      
      // Brief delay to ensure logout is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to login page
      window.location.href = '/login?redirect=/admin&reauth=true';
    } catch (error) {
      console.error('Error during sign out:', error);
      // If error, still redirect to login
      window.location.href = '/login?redirect=/admin&reauth=true';
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    performFullReauthentication();
  };

  // Force session refresh without full page reload
  const forceSessionRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if we have a user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Failed to verify user. Please try logging in again.');
        return;
      }
      
      if (!userData.user) {
        setError('No authenticated user found. Please log in again.');
        return;
      }
      
      console.log('Current user data:', userData.user);
      
      // Check session status
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData.session;
      
      if (!hasSession) {
        // If no session but we have a user, we need to re-authenticate
        setError('Your session has expired. Please log in again to continue.');
        return;
      }
      
      try {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          // Handle the specific AuthSessionMissingError
          const errorMessage = typeof refreshError.message === 'string' 
            ? refreshError.message 
            : 'Unknown error';
            
          if (errorMessage.includes('Auth session missing')) {
            setError('Your authentication session is missing or expired. Please log in again.');
          } else {
            setError(`Failed to refresh session: ${errorMessage}`);
          }
          return;
        }
        
        if (refreshData.session) {
          console.log('Session successfully refreshed');
          // Reload applications with new session
          fetchApplications();
        } else {
          setError('Session refresh completed but no session was returned. Please log in again.');
        }
      } catch (refreshErr) {
        console.error('Error in session refresh:', refreshErr);
        setError('An unexpected error occurred during session refresh. Please try logging in again.');
      }
    } catch (err) {
      console.error('Error in authentication check:', err);
      setError('An unexpected error occurred. Please try logging in again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Team Applications</h2>
        <p className="text-gray-600">Manage applications from players who want to join the team.</p>
        <div className="mt-4 flex justify-between items-center">
          <button 
            onClick={forceSessionRefresh}
            className="text-sm bg-[#1a3049] text-white px-4 py-2 rounded-md hover:bg-[#2a4059] transition-colors cursor-pointer flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Applications
          </button>
          
          {/* Application stats */}
          {!isLoading && !error && applications.length > 0 && (
            <div className="flex space-x-3 text-sm">
              <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                Total: {applications.length}
              </div>
              <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                Pending: {applications.filter(a => !a.status || a.status === 'pending').length}
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-800">
                Accepted: {applications.filter(a => a.status === 'accepted').length}
              </div>
              <div className="px-3 py-1 rounded-full bg-red-100 text-red-800">
                Rejected: {applications.filter(a => a.status === 'rejected').length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug information
      {debugInfo && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <h4 className="font-bold mb-1">Debug Information</h4>
          <p className="text-sm">{debugInfo}</p>
        </div>
      )} */}

      {/* Status filter */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              filterStatus === 'all'
                ? 'bg-[#1a3049] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 cursor-pointer`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 text-sm font-medium ${
              filterStatus === 'pending'
                ? 'bg-[#1a3049] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300 cursor-pointer`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-4 py-2 text-sm font-medium ${
              filterStatus === 'accepted'
                ? 'bg-[#1a3049] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300 cursor-pointer`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              filterStatus === 'rejected'
                ? 'bg-[#1a3049] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 cursor-pointer`}
          >
            Rejected
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a3049]"></div>
        </div>
      ) : error && typeof error === 'string' && (error.includes('session') || error.includes('expired') || error.includes('Authentication')) ? (
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Issue</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#1a3049] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3049]"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
            <button
              onClick={handleLoginRedirect}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a3049] hover:bg-[#1a3049]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3049]"
            >
              Log in again
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
          <div className="mt-3">
            <button
              onClick={() => fetchApplications()}
              className="inline-flex items-center justify-center py-1 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none mr-2"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-medium text-gray-600">No applications found</h3>
          <p className="mt-2 text-gray-500">
            {filterStatus === 'all' 
              ? 'When people apply to join the team, their applications will appear here.'
              : `No ${filterStatus} applications found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => viewApplicationDetails(application)}
                      className="font-medium text-[#1a3049] hover:underline cursor-pointer"
                    >
                      {application.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {application.email}
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
                  <td className="px-6 py-4 whitespace-normal max-w-xs">
                    <div className="text-sm text-gray-600 truncate hover:text-clip hover:whitespace-normal">
                      {application.experience.length > 60 
                        ? `${application.experience.substring(0, 60)}...` 
                        : application.experience}
                      <span className="block text-xs text-blue-600 hover:underline cursor-pointer mt-1" 
                        onClick={() => viewApplicationDetails(application)}>
                        View details
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {(application.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(application.id, 'accepted')}
                            disabled={processingId === application.id}
                            className="text-green-600 hover:text-green-900 mr-2 disabled:opacity-50 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(application.id, 'rejected')}
                            disabled={processingId === application.id}
                            className="text-red-600 hover:text-red-900 mr-2 disabled:opacity-50 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => confirmDeleteApplication(application.id)}
                        disabled={processingId === application.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 cursor-pointer"
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

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-95 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Application Details</h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedApplication.status === 'accepted' 
                    ? 'bg-green-100 text-green-800' 
                    : selectedApplication.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedApplication.status || 'pending'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Name</div>
                  <div className="text-gray-900">{selectedApplication.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                  <div className="text-gray-900">{selectedApplication.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Age</div>
                  <div className="text-gray-900">{selectedApplication.age}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                  <div className="text-gray-900">{selectedApplication.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Player Type</div>
                  <div className="text-gray-900">{selectedApplication.specification}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Date Applied</div>
                  <div className="text-gray-900">{formatDate(selectedApplication.created_at)}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm font-medium text-[#1a3049] mb-2 uppercase tracking-wider">Player Experience Summary</div>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap shadow-inner">
                  <p className="italic text-gray-600 mb-2">&quot;</p>
                  <p className="leading-relaxed text-gray-800">
                    {selectedApplication.experience}
                  </p>
                  <p className="italic text-gray-600 text-right mt-2">&quot;</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'accepted')}
                      disabled={processingId === selectedApplication.id}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      Accept Application
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                      disabled={processingId === selectedApplication.id}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      Reject Application
                    </button>
                  </>
                )}
                <button
                  onClick={() => confirmDeleteApplication(selectedApplication.id)}
                  disabled={processingId === selectedApplication.id}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-95 rounded-lg max-w-md w-full shadow-xl transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-500 cursor-pointer"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">Are you sure you want to delete this application? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApplication}
                  disabled={processingId !== null}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {processingId !== null ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 