'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Match } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/ui/PageHero';
import MatchRow from '@/components/MatchRow';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';

type ResultFilterType = 'all' | 'win' | 'loss' | 'draw' | 'upcoming';

const resultFilters: { id: ResultFilterType; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'upcoming', name: 'Upcoming' },
  { id: 'win', name: 'Wins' },
  { id: 'loss', name: 'Losses' },
  { id: 'draw', name: 'Draws' },
];

const MATCHES_PER_PAGE = 12;

export default function FixturesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultFilter, setResultFilter] = useState<ResultFilterType>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  useEffect(() => {
    async function loadMatches() {
      try {
        if (!isSupabaseConfigured) {
          setMatches([]);
          return;
        }
        const { data, error } = await supabase.from('matches').select('*').order('date', { ascending: true });
        if (error) throw error;
        setMatches(data || []);
      } catch (error) {
        console.error('Error loading matches:', error);
        setError('We could not load fixtures right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, []);

  const teams = useMemo(() => {
    const unique = new Set<string>();
    matches.forEach((m) => {
      unique.add(m.team1);
      unique.add(m.team2);
    });
    return Array.from(unique).filter(Boolean).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let filtered = matches;
    if (resultFilter === 'upcoming') filtered = filtered.filter((m) => m.result === 'will be played');
    else if (resultFilter !== 'all') filtered = filtered.filter((m) => m.result === resultFilter);
    if (teamFilter !== 'all') filtered = filtered.filter((m) => m.team1 === teamFilter || m.team2 === teamFilter);
    return filtered;
  }, [matches, resultFilter, teamFilter]);

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [resultFilter, teamFilter]);

  const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE);
  const currentMatches = filteredMatches.slice((currentPage - 1) * MATCHES_PER_PAGE, currentPage * MATCHES_PER_PAGE);

  const paginate = (page: number) => {
    setCurrentPage(page);
    document.getElementById('fixture-list')?.scrollIntoView({ block: 'start' });
  };

  return (
    <>
      <PageHero
        eyebrow="Season calendar"
        title={
          <>
            Fixtures <span className="text-gold">&amp;</span> results
          </>
        }
        intro="Every match across the Vanguards, Mobilizers and Strikers. Tap a match for the full scorecard where one is available."
        image="/home_carousel1.jpeg"
      />

      <section className="py-12 sm:py-16">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div role="group" aria-label="Filter by result" className="flex flex-wrap gap-2">
              {resultFilters.map((filter) => {
                const active = resultFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setResultFilter(filter.id)}
                    className={`min-h-11 px-5 font-display text-[16px] font-bold uppercase tracking-[0.08em] transition-[background-color,color,border-color,transform] duration-300 active:scale-95 ${
                      active ? 'bg-gold text-ink' : 'border border-cream/25 text-cream hover:border-cream/60'
                    }`}
                  >
                    {filter.name}
                  </button>
                );
              })}
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="team-filter" className="field-label">
                Team
              </label>
              <select
                id="team-filter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="field"
              >
                <option value="all">All teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div id="fixture-list" aria-live="polite">
            {isLoading ? (
              <SkeletonList rows={6} label="Loading fixtures" />
            ) : error ? (
              <p className="alert-error">{error}</p>
            ) : filteredMatches.length === 0 ? (
              <EmptyState title="No matches here">
                Nothing matches these filters. Try another team or result.
              </EmptyState>
            ) : (
              <>
                <p className="mb-2 text-[14px] text-faint">
                  {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
                </p>
                <div key={`${resultFilter}-${teamFilter}-${currentPage}`} className="page-enter border-t border-cream/12">
                  {currentMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </>
            )}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Fixture pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline min-h-11 px-4"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => paginate(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`h-11 w-11 rounded-full text-[15px] font-semibold transition-colors ${
                    currentPage === page ? 'bg-gold text-ink' : 'text-muted hover:bg-cream/10 hover:text-cream'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline min-h-11 px-4"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
