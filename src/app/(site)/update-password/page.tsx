'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/services/authService';
import AuthShell, { SuccessNote } from '@/components/AuthShell';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while updating your password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="New password" subtitle="Choose a new password for your account.">
      {success ? (
        <SuccessNote title="Password updated">
          <p>You&apos;ll be taken to the sign-in page in a moment.</p>
        </SuccessNote>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <div>
            <label htmlFor="password" className="field-label">
              New password
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="field-label">
              Confirm new password
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="field" />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-gold btn-lg mt-2 w-full">
            {isLoading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
