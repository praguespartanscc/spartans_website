'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { board as makeBoard } from '@/lib/indoor/standings';
import { aggregate } from '@/lib/indoor/stats';
import type { Format, TournamentData } from '@/lib/indoor/tournament';
import { formatChoices } from '@/lib/indoor/schedule';
import { LOCALE, localePath, tr, type Lang } from '@/lib/i18n';
import { Champion, FixtureList, StandingsTable, StatsTables, TableKey, TeamsList } from './TournamentViews';

type Tab = 'fixtures' | 'table' | 'stats' | 'teams';
const POLL_MS = 15000;

const csPlural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

// The format in a Czech sentence: "Každý s každým dvakrát, potom finále."
function formatCs(f: Format): string {
  const after: Record<string, string> = { none: '', final: ', potom finále', semis: ', potom semifinále a finále', quarters: ', potom čtvrtfinále, semifinále a finále', page: ', potom play off' };
  if (f.kind === 'series') return `Série na ${f.legs} ${csPlural(f.legs, 'zápas', 'zápasy', 'zápasů')}.`;
  if (f.kind === 'knockout') return 'Vyřazovací turnaj.';
  const each = f.legs === 1 ? 'každý s každým' : f.legs === 2 ? 'každý s každým dvakrát' : `každý s každým ${f.legs}krát`;
  if (f.kind === 'groups') return `${f.groups} ${csPlural(f.groups, 'skupina', 'skupiny', 'skupin')}, ${each}${after[f.finals] ?? ''}.`;
  return `${each.charAt(0).toUpperCase()}${each.slice(1)}${after[f.finals] ?? ''}.`;
}

// The public page of a tournament: games and results, the table, player stats and the teams.
// It refreshes on its own while the tournament is running and the page is on screen.
export default function TournamentFollow({ initial, slug, lang }: { initial: TournamentData; slug: string; lang: Lang }) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<Tab>('fixtures');
  // Set in the browser only, so the server and browser render the same text.
  const [checked, setChecked] = useState<Date | null>(null);
  useEffect(() => setChecked(new Date()), []);
  const running = data.tournament.status !== 'complete';

  useEffect(() => {
    if (!running) return;
    const supabase = createClientComponentClient();
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: fresh } = await supabase.rpc('indoor_tournament_by_slug', { p_slug: slug });
      if (stopped || !fresh) return;
      setData(fresh as TournamentData);
      setChecked(new Date());
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, slug]);

  const t = data.tournament;
  const b = useMemo(() => makeBoard({ teams: data.teams, fixtures: data.fixtures, matches: data.matches, points: t.settings.points, bpo: t.rules.match.ballsPerOver, sharedTitle: t.settings.sharedTitle }), [data, t]);
  const players = useMemo(() => aggregate(b.statsMatches, data.teams.map((x) => ({ id: x.id, name: x.name, squad: x.squad }))), [b, data.teams]);
  const name = (id: string | null) => data.teams.find((x) => x.id === id)?.name ?? '';
  const live = data.matches.some((m) => m.status === 'live');
  const star = t.settings.playerOfTournament ?? (t.status === 'complete' ? ([...players].sort((x, y) => y.mvp - x.mvp)[0]?.key ?? null) : null);
  const starPlayer = star && t.status === 'complete' ? players.find((p) => p.key === star) : null;
  const f = t.settings.format;
  const format = formatChoices(data.teams.length).find((c) => c.format.kind === f.kind && c.format.legs === f.legs && c.format.groups === f.groups && c.format.finals === f.finals);
  const teamCount = data.teams.filter((x) => !x.withdrawn).length;
  const gameCount = data.fixtures.filter((x) => x.status !== 'cancelled').length;
  const tabs: [Tab, { en: string; cs: string }][] = [
    ['fixtures', { en: 'Games', cs: 'Zápasy' }],
    ['table', { en: 'Table', cs: 'Tabulka' }],
    ['stats', { en: 'Stats', cs: 'Statistiky' }],
    ['teams', { en: 'Teams', cs: 'Týmy' }],
  ];

  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">{tr(lang, { en: 'Indoor tournament', cs: 'Halový turnaj' })}</p>
        {live && (
          <span className="chip border-crimson-hi text-cream">
            <span className="live-dot h-2 w-2 rounded-full bg-crimson-hi" aria-hidden />
            {tr(lang, { en: 'Live', cs: 'Živě' })}
          </span>
        )}
        {t.status === 'complete' && <span className="chip">{tr(lang, { en: 'Finished', cs: 'Ukončeno' })}</span>}
      </div>
      <h1 className="display mt-3 break-words text-[clamp(32px,7vw,56px)]">{t.name}</h1>
      <p className="mt-3 text-sand">
        {tr(lang, { en: `${teamCount} teams, ${gameCount} games.`, cs: `Týmů: ${teamCount}, zápasů: ${gameCount}.` })} {lang === 'en' ? (format ? `${format.title}.` : '') : formatCs(f)}{' '}
        {tr(lang, {
          en: `${t.rules.match.oversPerInnings} ${t.rules.match.oversPerInnings === 1 ? 'over' : 'overs'} a side.`,
          cs: `${t.rules.match.oversPerInnings} ${csPlural(t.rules.match.oversPerInnings, 'over', 'overy', 'overů')} na tým.`,
        })}
      </p>

      {b.champions.length > 0 && (
        <div className="mt-6">
          <Champion lang={lang} names={b.champions.map(name)} />
        </div>
      )}
      {starPlayer && (
        <p className="mt-4 text-sand">
          {tr(lang, { en: 'Player of the tournament', cs: 'Hráč turnaje' })}: <span className="font-semibold text-cream">{starPlayer.name}</span> ({starPlayer.team})
        </p>
      )}

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-cream/12" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-12 shrink-0 border-b-2 px-4 font-display text-sm font-bold uppercase italic ${tab === id ? 'border-gold text-cream' : 'border-transparent text-muted hover:text-cream'}`}
          >
            {label[lang]}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'fixtures' && (
          <FixtureList
            lang={lang}
            fixtures={data.fixtures}
            teams={data.teams}
            board={b}
            href={(_, o) => (o.match ? localePath(lang, `/indoor/${o.match.share_slug}`) : null)}
            empty={<p className="text-muted">{tr(lang, { en: 'No games yet.', cs: 'Zatím žádné zápasy.' })}</p>}
          />
        )}
        {tab === 'table' && (
          <div className="space-y-8">
            {b.groups.length > 0 ? b.groups.map((g) => <StandingsTable key={g} lang={lang} rows={b.table(g)} title={tr(lang, { en: `Group ${g}`, cs: `Skupina ${g}` })} />) : <StandingsTable lang={lang} rows={b.table()} />}
            <TableKey lang={lang} />
          </div>
        )}
        {tab === 'stats' && <StatsTables lang={lang} players={players} bpo={t.rules.match.ballsPerOver} games={b.gamesPerTeam} star={star} />}
        {tab === 'teams' && <TeamsList lang={lang} teams={data.teams} />}
      </div>

      {running && checked && (
        <p className="mt-8 text-sm text-muted">
          {tr(lang, { en: 'This page updates on its own. Last checked', cs: 'Stránka se obnovuje sama. Naposledy' })} {checked.toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit' })}.
        </p>
      )}
    </div>
  );
}
