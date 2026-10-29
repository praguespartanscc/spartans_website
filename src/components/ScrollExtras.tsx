'use client';

import { useEffect, useState } from 'react';
import { tr, type Lang } from '@/lib/i18n';

// Shared scroll position (0–1) for the page, rAF-throttled and passive.
function useScrollProgress() {
  const [state, setState] = useState({ progress: 0, y: 0 });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setState({ progress: max > 0 ? Math.min(1, window.scrollY / max) : 0, y: window.scrollY });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return state;
}

// Thin gold bar across the top of long reading pages, filling as you read.
export function ReadingProgress() {
  const { progress } = useScrollProgress();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[3px]">
      <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

// Round "back to top" button that appears after scrolling, with a ring showing how far down the page you are.
export function BackToTop({ lang = 'en' }: { lang?: Lang }) {
  const { progress, y } = useScrollProgress();
  const visible = y > 900;
  const r = 21;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }}
      aria-label={tr(lang, { en: 'Back to top', cs: 'Zpět nahoru' })}
      tabIndex={visible ? 0 : -1}
      className={`fixed z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-ink/85 text-cream shadow-lg backdrop-blur transition-[opacity,transform,color] duration-500 ease-[var(--ease-out-expo)] hover:text-gold ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{
        right: 'max(16px, env(safe-area-inset-right, 0px))',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="2" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} strokeLinecap="round" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    </button>
  );
}
