'use client';

import { useEffect, useState } from 'react';
import { tr, type Lang } from '@/lib/i18n';

const UNITS = [
  { key: 'd', ms: 86_400_000, label: { en: 'Days', cs: 'Dny' } },
  { key: 'h', ms: 3_600_000, label: { en: 'Hrs', cs: 'Hod' } },
  { key: 'm', ms: 60_000, label: { en: 'Min', cs: 'Min' } },
  { key: 's', ms: 1_000, label: { en: 'Sec', cs: 'Sek' } },
] as const;

function split(ms: number) {
  let rest = ms;
  return UNITS.map((u) => {
    const n = Math.floor(rest / u.ms);
    rest -= n * u.ms;
    return n;
  });
}

// Time left until a match starts (`start` is an ISO time with its Prague offset).
// Renders placeholders on the server and starts ticking in the browser; hides once the match has begun.
export default function Countdown({ start, lang = 'en' }: { start: string; lang?: Lang }) {
  const target = new Date(start).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (Number.isNaN(target) || (now !== null && now >= target)) return null;
  const parts = now === null ? null : split(target - now);

  return (
    <div
      className="flex items-end gap-1.5 sm:gap-2"
      role="timer"
      aria-label={tr(lang, { en: 'Time until the match starts', cs: 'Čas do začátku zápasu' })}
    >
      {UNITS.map((u, i) => {
        const value = parts ? String(parts[i]).padStart(2, '0') : '--';
        return (
          <div key={u.key} className="flex min-w-[46px] flex-col items-center bg-ink/25 px-2 pb-1.5 pt-2 sm:min-w-[54px]">
            <span className="overflow-hidden font-varsity text-[22px] leading-none tabular-nums sm:text-[26px]">
              {/* Re-keyed on change so each new digit slides in */}
              <span key={value} className={parts ? 'tick' : ''}>
                {value}
              </span>
            </span>
            <span className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">{tr(lang, u.label)}</span>
          </div>
        );
      })}
    </div>
  );
}
