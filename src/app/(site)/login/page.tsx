'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signInWithEmail } from '@/services/authService';
import { homeFor, safeRedirect } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectPath = safeRedirect(searchParams.get('redirect'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { user } = await signInWithEmail(email, password);
      window.location.href = redirectPath ?? homeFor(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <div>
        <label htmlFor="email" className="field-label">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <Link href="/reset-password" className="mb-2 text-[14px] font-medium text-gold hover:text-gold-hi">
            Forgot password?
          </Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
      </div>
      <button type="submit" disabled={isLoading} className="btn btn-gold btn-lg mt-2 w-full">
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

export default function Login() {
  return (
    <AuthShell
      title="Sign in"
      subtitle={
        <>
          New here?{' '}
          <Link href="/signup" className="font-semibold text-gold hover:text-gold-hi">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="skeleton h-72" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
