'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Match } from '@/types/supabase';
import MatchRow from '@/components/MatchRow';
import EmptyState from '@/components/ui/EmptyState';
import { tr, type Lang } from '@/lib/i18n';

type ResultFilter = 'all' | 'upcoming' | 'win' | 'loss' | 'draw';

const FILTERS: { id: ResultFilter; name: { en: string; cs: string } }[] = [
  { id: 'all', name: { en: 'All', cs: 'Vše' } },
  { id: 'upcoming', name: { en: 'Upcoming', cs: 'Nadcházející' } },
  { id: 'win', name: { en: 'Wins', cs: 'Výhry' } },
  { id: 'loss', name: { en: 'Losses', cs: 'Prohry' } },
  { id: 'draw', name: { en: 'Draws', cs: 'Remízy' } },
];

const RESULTS_PER_PAGE = 10;

type Props = { matches: Match[]; today: string; squads: string[]; lang?: Lang };

// Filters live in the URL (?result=&team=&page=) so views can be shared. The first render
// uses the defaults, so the server HTML always lists the upcoming matches and latest results.
export default function FixturesBoard({ matches, today, squads, lang = 'en' }: Props) {
  const [result, setResult] = useState<ResultFilter>('all');
  const [team, setTeam] = useState('all');
  const [page, setPage] = useState(1);
  const [season, setSeason] = useState('all');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const r = q.get('result') as ResultFilter | null;
    if (r && FILTERS.some((f) => f.id === r)) setResult(r);
    const t = q.get('team');
    if (t) setTeam(t);
    const p = Number(q.get('page'));
    if (p > 1) setPage(p);
    const s = q.get('season');
    if (s && /^\d{4}$/.test(s)) setSeason(s);
  }, []);

  const update = (next: { result?: ResultFilter; team?: string; page?: number; season?: string }) => {
    const r = next.result ?? result;
    const t = next.team ?? team;
    const p = next.page ?? 1;
    const s = next.season ?? season;
    setResult(r);
    setTeam(t);
    setPage(p);
    setSeason(s);
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set('result', r === 'all' ? null : r);
    set('team', t === 'all' ? null : t);
    set('page', p > 1 ? String(p) : null);
    set('season', s === 'all' ? null : s);
    window.history.replaceState(null, '', url);
  };

  const teamOptions = useMemo(() => {
    const names = new Set<string>(squads);
    matches.forEach((m) => [m.team1, m.team2].forEach((n) => n && names.add(n)));
    return Array.from(names).sort((a, b) => Number(!squads.includes(a)) - Number(!squads.includes(b)) || a.localeCompare(b));
  }, [matches, squads]);

  // Seasons are calendar years (the Czech season runs spring to autumn), newest first.
  const seasons = useMemo(() => Array.from(new Set(matches.map((m) => m.date.slice(0, 4)))).sort().reverse(), [matches]);

  const byTeam = useMemo(() => {
    const inSeason = season === 'all' ? matches : matches.filter((m) => m.date.startsWith(season));
    if (team === 'all') return inSeason;
    const needle = team.toLowerCase();
    return inSeason.filter((m) => `${m.team1} ${m.team2}`.toLowerCase().includes(needle));
  }, [matches, team, season]);
  const filtered = team !== 'all' || season !== 'all' || result !== 'all';

  const upcoming = byTeam.filter((m) => m.result === 'will be played' && m.date >= today);
  const results = byTeam
    .filter((m) => !(m.result === 'will be played' && m.date >= today))
    .filter((m) => (result === 'all' || result === 'upcoming' ? true : m.result === result))
    .slice()
    .reverse();

  const showUpcoming = result === 'all' || result === 'upcoming';
  const showResults = result !== 'upcoming';
  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageResults = results.slice((current - 1) * RESULTS_PER_PAGE, current * RESULTS_PER_PAGE);

  const goToPage = (p: number) => {
    update({ page: p });
    document.getElementById('results')?.scrollIntoView({ block: 'start' });
  };

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div role="group" aria-label={tr(lang, { en: 'Filter by result', cs: 'Filtrovat podle výsledku' })} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = result === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ result: f.id })}
                className={`min-h-11 px-5 font-display text-[16px] font-bold uppercase tracking-[0.08em] transition-[background-color,color,border-color,transform] duration-300 active:scale-95 ${
                  active ? 'bg-gold text-ink' : 'border border-cream/25 text-cream hover:border-cream/60'
                }`}
              >
                {f.name[lang]}
              </button>
            );
          })}
        </div>
        <div className="flex w-full flex-wrap gap-4 sm:w-auto">
        {seasons.length > 1 && (
          <div className="w-full sm:w-40">
            <label htmlFor="season-filter" className="field-label">
              {tr(lang, { en: 'Season', cs: 'Sezóna' })}
            </label>
            <select id="season-filter" value={season} onChange={(e) => update({ season: e.target.value })} className="field">
              <option value="all">{tr(lang, { en: 'All seasons', cs: 'Všechny sezóny' })}</option>
              {seasons.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="w-full sm:w-64">
          <label htmlFor="team-filter" className="field-label">
            {tr(lang, { en: 'Team', cs: 'Tým' })}
          </label>
          <select id="team-filter" value={team} onChange={(e) => update({ team: e.target.value })} className="field">
            <option value="all">{tr(lang, { en: 'All teams', cs: 'Všechny týmy' })}</option>
            {teamOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>

      <div aria-live="polite" key={`${result}-${team}-${season}`} className="page-enter">
        {showUpcoming && (
          <section aria-labelledby="upcoming" className="mb-14">
            <h2 id="upcoming" className="h-sub mb-2 text-[30px]">
              {tr(lang, { en: 'Upcoming', cs: 'Nadcházející zápasy' })} <span className="font-display text-[18px] text-dim">{upcoming.length}</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="border-t border-cream/12 py-6 text-muted">
                {tr(lang, {
                  en: `No upcoming matches scheduled${team !== 'all' ? ` for ${team}` : ''} yet.`,
                  cs: team !== 'all' ? `Pro tým ${team} zatím nejsou naplánované žádné zápasy.` : 'Zatím nejsou naplánované žádné zápasy.',
                })}
              </p>
            ) : (
              <div className="border-t border-cream/12">
                {upcoming.map((m) => (
                  <MatchRow key={m.id} match={m} live={m.date === today && !!m.stream_url} lang={lang} />
                ))}
              </div>
            )}
          </section>
        )}

        {showResults && (
          <section aria-labelledby="results-heading" id="results" className="scroll-mt-24">
            <h2 id="results-heading" className="h-sub mb-2 text-[30px]">
              {tr(lang, { en: 'Results', cs: 'Výsledky' })} <span className="font-display text-[18px] text-dim">{results.length}</span>
            </h2>
            {results.length === 0 ? (
              <EmptyState title={tr(lang, { en: 'No results here', cs: 'Žádné výsledky' })}>
                {filtered
                  ? tr(lang, {
                      en: 'Nothing matches these filters. Try another season, team or result.',
                      cs: 'Těmto filtrům neodpovídá žádný zápas. Zkuste jinou sezónu, tým nebo výsledek.',
                    })
                  : tr(lang, {
                      en: 'No results yet this season. They appear here as soon as matches are played.',
                      cs: 'V této sezóně zatím nejsou žádné výsledky. Objeví se tu hned po odehraných zápasech.',
                    })}
              </EmptyState>
            ) : (
              <div className="border-t border-cream/12">
                {pageResults.map((m) => (
                  <MatchRow key={m.id} match={m} lang={lang} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label={tr(lang, { en: 'Result pages', cs: 'Stránky výsledků' })} className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => goToPage(current - 1)} disabled={current === 1} className="btn btn-outline min-h-11 px-4">
                  {tr(lang, { en: 'Newer', cs: 'Novější' })}
                </button>
                <span className="px-3 font-display text-[16px] font-bold uppercase tracking-[0.1em] text-muted">
                  {tr(lang, { en: `Page ${current} of ${totalPages}`, cs: `Strana ${current} z ${totalPages}` })}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(current + 1)}
                  disabled={current === totalPages}
                  className="btn btn-outline min-h-11 px-4"
                >
                  {tr(lang, { en: 'Older', cs: 'Starší' })}
                </button>
              </nav>
            )}
          </section>
        )}
      </div>
    </>
  );
}
