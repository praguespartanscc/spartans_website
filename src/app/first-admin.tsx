'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/authService';
import AuthShell from '@/components/AuthShell';

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

  return (
    <AuthShell
      title="First admin"
      subtitle="Make yourself an admin. Only use this once, to set up the first admin user."
    >
      <button type="button" onClick={makeAdmin} disabled={loading} className="btn btn-gold btn-lg w-full">
        {loading ? 'Processing...' : 'Make me admin'}
      </button>
      {message && (
        <div className={`mt-4 ${message.includes('Error') ? 'alert-error' : 'card p-4 text-gold'}`} role="status">
          {message}
        </div>
      )}
    </AuthShell>
  );
}
