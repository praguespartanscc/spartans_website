'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/authService';

export default function FirstAdmin() {
  const [message, setMessage] = useState<string>('');
  const [loading, setIsLoading] = useState<boolean>(false);

  const makeAdmin = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const user = await getCurrentUser();
      
      if (!user) {
        setMessage('Error: No user is logged in');
        return;
      }
      
      // Update user metadata to include isAdmin: true
      const { error } = await supabase.auth.updateUser({
        data: { isAdmin: true }
      });
      
      if (error) throw error;
      
      setMessage(`Success! User ${user.email} is now an admin. Please reload the application.`);
    } catch (error: Error | unknown) {
      console.error('Error making admin:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSetAdmin = async (user: User) => {
  //   // ... 
  // };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-[#1a3049]">Setup First Admin</h1>
        
        <p className="mb-6 text-gray-600">
          This page allows you to make yourself an admin. You should only use this once to set up the first admin user.
        </p>
        
        <button
          onClick={makeAdmin}
          disabled={loading}
          className="w-full bg-[#1a3049] text-white py-2 px-4 rounded-md hover:bg-[#1a3049]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Make Me Admin'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 