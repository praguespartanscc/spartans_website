'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpWithEmail } from '@/services/authService';
import AuthShell, { SuccessNote } from '@/components/AuthShell';
import { CRICHEROES_HELP, isCricHeroesProfile } from '@/lib/auth';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cricheroes, setCricheroes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isCricHeroesProfile(cricheroes)) {
      setError('Please paste your CricHeroes player profile link. It looks like https://cricheroes.com/player-profile/12345/your-name');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signUpWithEmail(email, password, fullName, cricheroes);
      if (error) {
        if (error.message === 'Email not confirmed') {
          setSuccess(true); // Show success message even though email needs confirmation
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
      }
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle={
        <>
          Already a member?{' '}
          <Link href="/login" className="font-semibold text-gold hover:text-gold-hi">
            Sign in
          </Link>
        </>
      }
    >
      {success ? (
        <SuccessNote title="Check your inbox">
          <p>
            We sent a confirmation email to {email}. Click the link inside to activate your account. A committee member
            will then approve you as a club member, and your member dashboard will open up.
          </p>
        </SuccessNote>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <div>
            <label htmlFor="fullName" className="field-label">
              Full name
            </label>
            <input id="fullName" name="fullName" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="cricheroes" className="field-label">
              CricHeroes profile link
            </label>
            <input
              id="cricheroes"
              name="cricheroes"
              type="url"
              inputMode="url"
              required
              placeholder="https://cricheroes.com/player-profile/…"
              aria-describedby="cricheroes-hint"
              value={cricheroes}
              onChange={(e) => setCricheroes(e.target.value)}
              className="field"
            />
            <p id="cricheroes-hint" className="mt-2 text-[14px] text-faint">
              {CRICHEROES_HELP} No account yet? Create one free in the CricHeroes app first.
            </p>
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} aria-describedby="password-hint" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            <p id="password-hint" className="mt-2 text-[14px] text-faint">
              At least 6 characters.
            </p>
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-gold btn-lg mt-2 w-full">
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
