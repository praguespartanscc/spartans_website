'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/services/authService';
import AuthShell, { SuccessNote } from '@/components/AuthShell';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while sending the reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-gold hover:text-gold-hi">
            Back to sign in
          </Link>
        </>
      }
    >
      {success ? (
        <SuccessNote title="Check your email">
          <p>We sent a password reset link to your email address. Follow the instructions inside to choose a new password.</p>
        </SuccessNote>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <div>
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-gold btn-lg mt-2 w-full">
            {isLoading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
