'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Match } from '@/types/supabase';
import MatchRow from '@/components/MatchRow';
import EmptyState from '@/components/ui/EmptyState';

type ResultFilter = 'all' | 'upcoming' | 'win' | 'loss' | 'draw';

const FILTERS: { id: ResultFilter; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'upcoming', name: 'Upcoming' },
  { id: 'win', name: 'Wins' },
  { id: 'loss', name: 'Losses' },
  { id: 'draw', name: 'Draws' },
];

const RESULTS_PER_PAGE = 10;

type Props = { matches: Match[]; today: string; squads: string[] };

// Filters live in the URL (?result=&team=&page=) so views can be shared. The first render
// uses the defaults, so the server HTML always lists the upcoming matches and latest results.
export default function FixturesBoard({ matches, today, squads }: Props) {
  const [result, setResult] = useState<ResultFilter>('all');
  const [team, setTeam] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const r = q.get('result') as ResultFilter | null;
    if (r && FILTERS.some((f) => f.id === r)) setResult(r);
    const t = q.get('team');
    if (t) setTeam(t);
    const p = Number(q.get('page'));
    if (p > 1) setPage(p);
  }, []);

  const update = (next: { result?: ResultFilter; team?: string; page?: number }) => {
    const r = next.result ?? result;
    const t = next.team ?? team;
    const p = next.page ?? 1;
    setResult(r);
    setTeam(t);
    setPage(p);
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set('result', r === 'all' ? null : r);
    set('team', t === 'all' ? null : t);
    set('page', p > 1 ? String(p) : null);
    window.history.replaceState(null, '', url);
  };

  const teamOptions = useMemo(() => {
    const names = new Set<string>(squads);
    matches.forEach((m) => [m.team1, m.team2].forEach((n) => n && names.add(n)));
    return Array.from(names).sort((a, b) => Number(!squads.includes(a)) - Number(!squads.includes(b)) || a.localeCompare(b));
  }, [matches, squads]);

  const byTeam = useMemo(() => {
    if (team === 'all') return matches;
    const needle = team.toLowerCase();
    return matches.filter((m) => `${m.team1} ${m.team2}`.toLowerCase().includes(needle));
  }, [matches, team]);

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
        <div role="group" aria-label="Filter by result" className="flex flex-wrap gap-2">
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
                {f.name}
              </button>
            );
          })}
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="team-filter" className="field-label">
            Team
          </label>
          <select id="team-filter" value={team} onChange={(e) => update({ team: e.target.value })} className="field">
            <option value="all">All teams</option>
            {teamOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite" key={`${result}-${team}`} className="page-enter">
        {showUpcoming && (
          <section aria-labelledby="upcoming" className="mb-14">
            <h2 id="upcoming" className="h-sub mb-2 text-[30px]">
              Upcoming <span className="font-display text-[18px] text-dim">{upcoming.length}</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="border-t border-cream/12 py-6 text-muted">No upcoming matches scheduled{team !== 'all' ? ` for ${team}` : ''} yet.</p>
            ) : (
              <div className="border-t border-cream/12">
                {upcoming.map((m) => (
                  <MatchRow key={m.id} match={m} live={m.date === today && !!m.stream_url} />
                ))}
              </div>
            )}
          </section>
        )}

        {showResults && (
          <section aria-labelledby="results-heading" id="results" className="scroll-mt-24">
            <h2 id="results-heading" className="h-sub mb-2 text-[30px]">
              Results <span className="font-display text-[18px] text-dim">{results.length}</span>
            </h2>
            {results.length === 0 ? (
              <EmptyState title="No results here">Nothing matches these filters. Try another team or result.</EmptyState>
            ) : (
              <div className="border-t border-cream/12">
                {pageResults.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Result pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => goToPage(current - 1)} disabled={current === 1} className="btn btn-outline min-h-11 px-4">
                  Newer
                </button>
                <span className="px-3 font-display text-[16px] font-bold uppercase tracking-[0.1em] text-muted">
                  Page {current} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(current + 1)}
                  disabled={current === totalPages}
                  className="btn btn-outline min-h-11 px-4"
                >
                  Older
                </button>
              </nav>
            )}
          </section>
        )}
      </div>
    </>
  );
}
