import type { Match } from '@/types/supabase';
import { dateParts, formatDivision, formatTime, titleCase } from '@/lib/format';
import { ArrowUpRight, MapPin } from '@/components/ui/Icons';

export function ResultChip({ result }: { result: string }) {
  switch (result) {
    case 'win':
      return <span className="chip bg-cream text-ink">Won</span>;
    case 'loss':
      return <span className="chip border border-cream/30 text-muted">Lost</span>;
    case 'draw':
      return <span className="chip border border-cream/30 text-sand">Draw</span>;
    default:
      return (
        <span className="chip bg-gold/15 text-gold-hi">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold-hi" />
          Upcoming
        </span>
      );
  }
}

// One fixture laid out like a results board: date, teams, details, status.
export default function MatchRow({ match }: { match: Match }) {
  const d = dateParts(match.date);
  const meta = [formatTime(match.time), titleCase(match.type), formatDivision(match.division)].filter(Boolean).join(' · ');

  const content = (
    <div className="group grid grid-cols-[64px_1fr] items-center gap-x-5 gap-y-3 border-b border-cream/12 py-5 sm:grid-cols-[96px_1fr_auto] sm:gap-x-8 sm:py-6">
      <div className="font-display uppercase leading-none">
        <div className="text-[34px] font-semibold sm:text-[40px]">{d.day}</div>
        <div className="mt-1 text-[12px] tracking-[0.16em] text-faint">
          {d.month} · {d.weekday}
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-display text-[20px] font-semibold uppercase leading-tight sm:text-[26px]">
          {match.team1} <span className="text-dim">vs</span> {match.team2}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted sm:text-[15px]">
          {match.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-faint" />
              {match.venue}
            </span>
          )}
          {meta && <span>{meta}</span>}
        </div>
      </div>
      <div className="col-start-2 flex items-center gap-3 sm:col-start-3">
        <ResultChip result={match.result} />
        {match.url && (
          <ArrowUpRight
            size={20}
            className="text-faint transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
          />
        )}
      </div>
    </div>
  );

  if (match.url) {
    return (
      <a
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-sm transition-colors duration-300 hover:bg-cream/[0.03]"
      >
        {content}
        <span className="sr-only">(match details open in a new tab)</span>
      </a>
    );
  }
  return content;
}
