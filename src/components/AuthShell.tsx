'use client';

import { useEffect, useState } from 'react';
import { PHOTO_SLOT } from '@/lib/photos';
import { resendConfirmation } from '@/services/authService';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
};

// Split layout for sign-in, sign-up and password pages: photo on large screens, form card always.
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <section className="grid min-h-[calc(100svh-64px)] lg:min-h-[calc(100svh-152px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- a photo from the Drive Thumbnails folder, see /api/site-photo */}
        <img
          src={`/api/site-photo/${PHOTO_SLOT.auth}?w=1600`}
          alt=""
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="kenburns absolute inset-0 h-full w-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-ink/80" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="display max-w-md text-[56px]">
            Members <span className="text-gold">area</span>
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="display rise text-[44px] sm:text-[52px]" style={{ ['--d' as string]: '60ms' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="rise mt-3 text-muted" style={{ ['--d' as string]: '140ms' }}>
              {subtitle}
            </p>
          )}
          <div className="rise mt-8" style={{ ['--d' as string]: '220ms' }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SuccessNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card flex flex-col gap-3 p-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
      <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
      <div className="text-muted">{children}</div>
    </div>
  );
}

// "Didn't get the email?" Sends the confirmation again, then waits a minute before the next try.
export function ResendEmail({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function send() {
    if (!email.trim()) {
      setState('error');
      setMessage('Type your email address above first.');
      return;
    }
    setState('sending');
    try {
      await resendConfirmation(email);
      setState('sent');
      setMessage(`Sent again to ${email.trim()}. It can take a few minutes. Check your spam or promotions folder too.`);
      setWait(60);
    } catch (err) {
      const text = err instanceof Error ? err.message : '';
      setState('error');
      setMessage(/rate|seconds|security purposes/i.test(text) ? 'Please wait a minute before asking again.' : text || 'Could not send the email. Try again in a minute.');
      setWait(30);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={send} disabled={state === 'sending' || wait > 0} className="btn btn-outline w-full">
        {state === 'sending' ? 'Sending…' : wait > 0 ? `Send again in ${wait}s` : 'Resend the confirmation email'}
      </button>
      {message && (
        <p role="status" className={`text-sm ${state === 'error' ? 'text-gold' : 'text-muted'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
