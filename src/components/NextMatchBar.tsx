import Link from 'next/link';
import type { Match } from '@/types/supabase';
import { dateParts, formatDivision, formatTime, titleCase } from '@/lib/format';
import { ArrowRight } from '@/components/ui/Icons';

// Warrior Red scoreboard strip under the hero. On match day with a stream it becomes a "Live now" bar.
export default function NextMatchBar({ match, live }: { match: Match | null; live?: boolean }) {
  if (!match) return null;
  const d = dateParts(match.date);
  const details = [titleCase(match.type), formatDivision(match.division)].filter(Boolean).join(' · ');

  return (
    <section aria-label={live ? 'Live match' : 'Next match'} className="bg-crimson text-white">
      <div className="container-x flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-5 sm:py-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.14em]">
            <span className="live-dot h-2 w-2 rounded-full bg-white" />
            {live ? 'Live now' : 'Next match'}
          </span>
          <span className="h-sub text-[26px] leading-tight sm:text-[36px]">
            {match.team1} vs {match.team2}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          <span>
            {d.weekday} {d.day} {d.month}
            {match.time ? ` · ${formatTime(match.time)}` : ''}
          </span>
          {match.venue && <span>{match.venue}</span>}
          {details && <span className="hidden md:inline">{details}</span>}
          <Link href={`/fixtures/${match.id}`} className={`btn min-h-11 ${live ? 'bg-white text-crimson hover:bg-sand' : 'btn-dark'}`}>
            {live ? 'Watch live' : 'Match details'}
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
