import Link from 'next/link';
import type { Match } from '@/types/supabase';
import { dateParts, formatDivision, formatTime, pragueISO, titleCase } from '@/lib/format';
import { MATCH_TYPE_LABEL } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { ArrowRight } from '@/components/ui/Icons';
import Countdown from '@/components/Countdown';

// Warrior Red scoreboard strip under the hero. On match day with a stream it becomes a "Live now" bar.
export default function NextMatchBar({ match, live, lang = 'en' }: { match: Match | null; live?: boolean; lang?: Lang }) {
  if (!match) return null;
  const d = dateParts(match.date, lang);
  const type = MATCH_TYPE_LABEL[match.type ?? '']?.[lang] ?? titleCase(match.type);
  const details = [type, formatDivision(match.division, lang)].filter(Boolean).join(' · ');

  return (
    <section
      aria-label={live ? tr(lang, { en: 'Live match', cs: 'Zápas živě' }) : tr(lang, { en: 'Next match', cs: 'Příští zápas' })}
      className="bg-crimson text-white"
    >
      <div className="container-x flex flex-wrap items-center justify-between gap-x-10 gap-y-5 py-5 sm:py-6">
        {/* Left: who and when. Right: countdown and the match link. */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.14em]">
              <span className="live-dot h-2 w-2 rounded-full bg-white" />
              {live ? tr(lang, { en: 'Live now', cs: 'Právě živě' }) : tr(lang, { en: 'Next match', cs: 'Příští zápas' })}
            </span>
            <span className="h-sub text-[26px] leading-tight sm:text-[36px]">
              {match.team1} {tr(lang, { en: 'vs', cs: 'vs.' })} {match.team2}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[15px]">
            <span>
              {d.weekday} {d.day} {d.month}
              {match.time ? ` · ${formatTime(match.time)}` : ''}
            </span>
            {match.venue && <span>{match.venue}</span>}
            {details && <span className="hidden md:inline">{details}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {!live && <Countdown start={pragueISO(match.date, match.time || '00:00').start} lang={lang} />}
          <Link
            href={localePath(lang, `/fixtures/${match.id}`)}
            className={`btn min-h-11 ${live ? 'bg-white text-crimson hover:bg-sand' : 'btn-dark'}`}
          >
            {live ? tr(lang, { en: 'Watch live', cs: 'Sledovat živě' }) : tr(lang, { en: 'Match details', cs: 'Detail zápasu' })}
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
