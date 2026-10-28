'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { initials, titleCase } from '@/lib/format';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import JoinCta from '@/components/JoinCta';

type Player = {
  id: string;
  name: string;
  player_type: string;
  age: number;
  email: string;
  role: string;
  team: string;
  created_at?: string;
  updated_at?: string;
};

const TEAMS = ['Vanguards', 'Mobilizers', 'Strikers'];

function Leader({ player, label, primary }: { player: Player; label: string; primary?: boolean }) {
  return (
    <div className={`card relative overflow-hidden p-6 sm:p-8 ${primary ? 'border-gold/50' : ''}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${primary ? 'bg-gold' : 'bg-crimson'}`} />
      <div className="flex items-center gap-5">
        <span
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full font-display text-3xl font-extrabold ${
            primary ? 'bg-gold text-ink' : 'bg-crimson text-white'
          }`}
        >
          {initials(player.name)}
        </span>
        <div className="min-w-0">
          <p className="eyebrow mb-1">{label}</p>
          <p className="font-display text-[28px] font-extrabold uppercase leading-tight sm:text-[34px]">{player.name}</p>
          <p className="text-muted">{titleCase(player.player_type)}</p>
        </div>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('Vanguards');

  // Squad cards on the home page link here with ?team=Name.
  useEffect(() => {
    const team = new URLSearchParams(window.location.search).get('team');
    if (team && TEAMS.includes(team)) setSelectedTeam(team);
  }, []);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('We could not load the squads right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const selectTeam = (team: string) => {
    setSelectedTeam(team);
    const url = new URL(window.location.href);
    url.searchParams.set('team', team);
    window.history.replaceState(null, '', url);
  };

  const teamPlayers = players.filter((p) => p.team === selectedTeam || (!p.team && selectedTeam === 'Vanguards'));
  const captain = teamPlayers.find((p) => p.role === 'captain');
  const viceCaptain = teamPlayers.find((p) => p.role === 'vice-captain');
  const regularPlayers = teamPlayers.filter((p) => p.role !== 'captain' && p.role !== 'vice-captain');

  return (
    <>
      <PageHero
        eyebrow="The squads"
        title={
          <>
            Meet the <span className="text-gold">Spartans</span>
          </>
        }
        intro="Three squads, one badge. Pick a team to see its captain, vice-captain and players."
        image="/spartan_team.PNG"
      />

      <section className="py-14 sm:py-20">
        <div className="container-x">
          <div role="group" aria-label="Choose a squad" className="mb-10 flex flex-wrap gap-2">
            {TEAMS.map((team) => {
              const active = selectedTeam === team;
              return (
                <button
                  key={team}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectTeam(team)}
                  className={`min-h-12 px-6 font-display text-[17px] font-medium uppercase tracking-[0.06em] transition-[background-color,color,border-color,transform] duration-300 active:scale-95 ${
                    active
                      ? 'bg-gold text-ink'
                      : 'border border-cream/25 text-cream hover:border-cream/60'
                  }`}
                >
                  {team}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <SkeletonGrid items={6} height={120} label="Loading players" />
          ) : error ? (
            <p className="alert-error">{error}</p>
          ) : teamPlayers.length === 0 ? (
            <EmptyState title={`The ${selectedTeam} squad is being picked`}>
              Players will appear here once the squad is announced.
            </EmptyState>
          ) : (
            // Keyed by team so the whole squad animates in when you switch.
            <div key={selectedTeam} className="page-enter">
              {(captain || viceCaptain) && (
                <div className="mb-12 grid gap-4 md:grid-cols-2">
                  {captain && (
                    <Reveal>
                      <Leader player={captain} label="Captain" primary />
                    </Reveal>
                  )}
                  {viceCaptain && (
                    <Reveal delay={90}>
                      <Leader player={viceCaptain} label="Vice-captain" />
                    </Reveal>
                  )}
                </div>
              )}

              {regularPlayers.length > 0 && (
                <>
                  <h2 className="mb-5 font-display text-2xl font-extrabold uppercase">
                    {selectedTeam} players <span className="text-dim">· {regularPlayers.length}</span>
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {regularPlayers.map((player, i) => (
                      <Reveal as="li" key={player.id} delay={Math.min(i, 8) * 40}>
                        <div className="card card-hover flex items-center gap-4 p-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-panel-2 font-display text-lg font-extrabold text-gold ring-1 ring-cream/10">
                            {initials(player.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{player.name}</p>
                            <p className="text-[14px] text-faint">{titleCase(player.player_type)}</p>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <JoinCta title="Want a spot in the squad?" />
    </>
  );
}
