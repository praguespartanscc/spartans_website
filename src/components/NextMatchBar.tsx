'use client';

import Link from 'next/link';
import { useUpcomingMatches } from '@/hooks/useUpcomingMatches';
import { dateParts, formatDivision, formatTime, titleCase } from '@/lib/format';
import { ArrowRight } from '@/components/ui/Icons';

// Kit-red scoreboard strip under the hero. Hidden when no match is scheduled.
export default function NextMatchBar() {
  const { matches, isLoading } = useUpcomingMatches();
  const next = matches.find((m) => m.result === 'will be played') ?? matches[0];

  // Sits just below the full-height hero, so appearing after load causes no visible jump.
  if (isLoading || !next) return null;

  const d = dateParts(next.date);
  const details = [titleCase(next.type), formatDivision(next.division)].filter(Boolean).join(' · ');

  return (
    <section aria-label="Next match" className="bg-crimson text-white">
      <div className="container-x flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-5 sm:py-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.2em]">
            <span className="live-dot h-2 w-2 rounded-full bg-white" />
            Next match
          </span>
          <span className="font-display text-[22px] font-semibold uppercase leading-tight sm:text-[28px]">
            {next.team1} vs {next.team2}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          <span>
            {d.weekday} {d.day} {d.month}
            {next.time ? ` · ${formatTime(next.time)}` : ''}
          </span>
          {next.venue && <span>{next.venue}</span>}
          {details && <span className="hidden md:inline">{details}</span>}
          {next.url ? (
            <a href={next.url} target="_blank" rel="noopener noreferrer" className="btn btn-dark min-h-11">
              Match details
              <ArrowRight size={16} className="btn-arrow" />
            </a>
          ) : (
            <Link href="/fixtures" className="btn btn-dark min-h-11">
              All fixtures
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
