import Image from 'next/image';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
};

// Split layout for sign-in, sign-up and password pages: photo on large screens, form card always.
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <section className="grid min-h-[calc(100svh-72px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/home_carousel1.jpeg" alt="" fill priority sizes="50vw" className="kenburns object-cover object-[center_35%]" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <Image src="/crest.png" alt="" width={72} height={88} className="mb-6 h-[88px] w-[72px] object-contain" />
          <p className="display max-w-md text-[56px] font-bold">
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
      <h2 className="font-display text-2xl font-semibold uppercase">{title}</h2>
      <div className="text-muted">{children}</div>
    </div>
  );
}
