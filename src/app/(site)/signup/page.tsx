'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpWithEmail } from '@/services/authService';
import AuthShell, { ResendEmail, SuccessNote } from '@/components/AuthShell';
import { CRICHEROES_HELP } from '@/lib/auth';
import { resolveCricHeroes } from '@/lib/cricheroes';

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
    setIsLoading(true);
    // Any form of CricHeroes link works: the app's Share link, the web page, or the player ID.
    const link = await resolveCricHeroes(cricheroes, fullName);
    if ('error' in link) {
      setError(link.error);
      setIsLoading(false);
      return;
    }
    setCricheroes(link.url);
    try {
      const { user, error } = await signUpWithEmail(email, password, fullName, link.url);
      if (!error && user && user.identities && user.identities.length === 0) {
        throw new Error('There is already an account with this email. Sign in, or use Forgot password to set a new one.');
      }
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
          <div className="mt-4 border-t border-cream/12 pt-4">
            <p className="mb-3 text-sm">No email after a few minutes? Check your spam folder, or send it again.</p>
            <ResendEmail email={email} />
            <button type="button" onClick={() => setSuccess(false)} className="mt-3 text-sm font-semibold text-gold hover:text-gold-hi">
              Wrong email address? Go back
            </button>
          </div>
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
