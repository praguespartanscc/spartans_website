'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Player } from '@/lib/indoor/engine';
import type { Board, Outcome } from '@/lib/indoor/standings';
import { board as makeBoard } from '@/lib/indoor/standings';
import { aggregate } from '@/lib/indoor/stats';
import { listLocal } from '@/lib/indoor/store';
import { uploadWaiting } from '@/lib/indoor/sync';
import type { Fixture, TournamentData, TournamentMatch, TournamentTeam } from '@/lib/indoor/tournament';
import { isKnockout, otherMatches } from '@/lib/indoor/tournament';
import type { CachedTournament } from '@/lib/indoor/tstore';
import { cacheTournament, forgetTournament, loadTournament, mergeMatches } from '@/lib/indoor/tstore';
import type { Problem, Saved } from '@/lib/indoor/tsync';
import { PROBLEM_TEXT, fetchTournament, updateFixture, updateTeam } from '@/lib/indoor/tsync';
import { formatChoices } from '@/lib/indoor/schedule';
import type { Member } from './MemberGate';
import Scorer from './Scorer';
import SetupWizard from './SetupWizard';
import type { StartFrom } from './SetupWizard';
import { ConfirmButton, Stepper } from './RulesEditor';
import Sheet from './Sheet';
import SquadEditor from './SquadEditor';
import TournamentManage from './TournamentManage';
import { Champion, FixtureList, StandingsTable, StatsTables, TableKey, TeamsList, dayTitle, resultLine, stageLabel } from './TournamentViews';
import { ArrowLeft, ArrowRight, Share } from '@/components/ui/Icons';

type Tab = 'fixtures' | 'table' | 'stats' | 'teams' | 'manage';
const REFRESH_MS = 15000;

export default function TournamentHome({ id, member }: { id: string; member: Member }) {
  const [data, setData] = useState<TournamentData | CachedTournament | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [tab, setTab] = useState<Tab>('fixtures');
  const [openFixture, setOpenFixture] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // local matches changed
  // Setting a game up and scoring it happen on this screen, not on pages of their own: a page
  // load needs a signal, and the hall may have none. The address still follows along, so a
  // refresh comes back to the same place.
  const [screen, setScreen] = useState<{ kind: 'home' } | { kind: 'start'; from: StartFrom } | { kind: 'match'; id: string }>({ kind: 'home' });
  const show = (next: typeof screen) => {
    window.history.replaceState(null, '', next.kind === 'match' ? `/score/${next.id}` : `/score/t/${id}`);
    window.scrollTo({ top: 0 });
    setOpenFixture(null);
    setScreen(next);
    if (next.kind === 'home') setTick((n) => n + 1);
  };

  const load = useCallback(async () => {
    const res = await fetchTournament(createClientComponentClient(), id).catch(() => ({ data: null, problem: 'offline' as Problem }));
    if (res.data) {
      cacheTournament(res.data);
      setData(res.data);
      setProblem(null);
      setState('ok');
    } else if (res.problem) {
      // No answer: carry on with the copy on this phone, if there is one.
      setProblem(res.problem);
      setState((s) => (s === 'loading' ? (loadTournament(id) ? 'ok' : 'missing') : s));
    } else {
      forgetTournament(id);
      setData(null);
      setState('missing');
    }
    setTick((n) => n + 1);
  }, [id]);

  useEffect(() => {
    const cached = loadTournament(id);
    if (cached) {
      setData(cached);
      setState('ok');
    }
    // Anything scored with no signal goes up first, so the table is right when it loads.
    const first = listLocal().some((lm) => lm.pending.length > 0 || lm.matchPending) ? uploadWaiting(createClientComponentClient()).catch(() => 0) : Promise.resolve(0);
    void first.then(load);
    const t = window.setInterval(() => document.visibilityState === 'visible' && void load(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [id, load]);

  const matches = useMemo(() => (data ? mergeMatches(id, data.matches, listLocal()) : []), [data, id, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(
    () => (data ? makeBoard({ teams: data.teams, fixtures: data.fixtures, matches, points: data.tournament.settings.points, bpo: data.tournament.rules.match.ballsPerOver, sharedTitle: data.tournament.settings.sharedTitle }) : null),
    [data, matches],
  );
  const players = useMemo(() => (data && b ? aggregate(b.statsMatches, data.teams.map((t) => ({ id: t.id, name: t.name, squad: t.squad }))) : []), [data, b]);

  if (screen.kind === 'start') {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', borderRadius: 0 } }} />
        <SetupWizard start={screen.from} onStarted={(matchId) => show({ kind: 'match', id: matchId })} onExit={() => show({ kind: 'home' })} />
      </>
    );
  }
  if (screen.kind === 'match') return <Scorer id={screen.id} member={member} onTournament={() => (show({ kind: 'home' }), void load())} />;

  if (state === 'loading' && !data) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 pt-6" role="status" aria-label="Loading the tournament">
        <div className="skeleton h-24" />
        <div className="skeleton h-12" />
        <div className="skeleton h-64" />
      </div>
    );
  }
  if (!data || !b) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="h-sub text-3xl">Tournament not found</h1>
        <p className="mt-3 text-sand">{problem ? PROBLEM_TEXT[problem] : 'It may have been deleted.'}</p>
        <Link href="/score" className="btn btn-gold mt-6">
          My matches
        </Link>
      </div>
    );
  }

  const t = data.tournament;
  const canRun = member.isAdmin || t.created_by === member.user.id || (t.organisers ?? []).includes(member.user.id);
  const name = (teamId: string | null) => data.teams.find((x) => x.id === teamId)?.name ?? '';
  const format = formatChoices(data.teams.length).find((c) => c.format.kind === t.settings.format.kind && c.format.legs === t.settings.format.legs && c.format.groups === t.settings.format.groups && c.format.finals === t.settings.format.finals);
  const fixture = openFixture ? data.fixtures.find((f) => f.id === openFixture) : null;
  const team = openTeam ? data.teams.find((x) => x.id === openTeam) : null;
  const star = t.settings.playerOfTournament ?? (t.status === 'complete' ? ([...players].sort((x, y) => y.mvp - x.mvp)[0]?.key ?? null) : null);
  const starPlayer = star ? players.find((p) => p.key === star) : null;
  const tabs: [Tab, string][] = [['fixtures', 'Games'], ['table', 'Table'], ['stats', 'Stats'], ['teams', 'Teams'], ...(canRun ? ([['manage', 'Manage']] as [Tab, string][]) : [])];

  const share = async () => {
    const url = `${window.location.origin}/indoor/t/${t.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: t.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // share sheet closed
    }
  };

  // After a change by the organiser: say so, then read the tournament again.
  const done = async (res: Saved, ok: string): Promise<boolean> => {
    if (!res.ok) {
      toast.error(PROBLEM_TEXT[res.problem]);
      return false;
    }
    toast.success(ok);
    await load();
    return true;
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-2">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', borderRadius: 0 } }} />
      <div className="flex items-center justify-between">
        <Link href="/score" className="-ml-2 grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Back to my matches">
          <ArrowLeft size={22} />
        </Link>
        <button type="button" onClick={share} className="chip min-h-11 hover:border-gold">
          <Share size={16} /> Share
        </button>
      </div>
      <p className="eyebrow mt-2">Tournament{t.status === 'complete' ? ', finished' : ''}</p>
      <h1 className="display mt-2 break-words text-[clamp(30px,8.5vw,48px)]">{t.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {data.teams.filter((x) => !x.withdrawn).length} teams, {data.fixtures.filter((f) => f.status !== 'cancelled').length} games{format ? `. ${format.title}.` : '.'}
      </p>
      {problem && (
        <p role="status" className="mt-3 border border-cream/22 px-3 py-2 text-sm text-sand">
          {problem === 'offline' ? 'No connection. This is the copy saved on this phone. Games can still be started and scored.' : PROBLEM_TEXT[problem]}
        </p>
      )}
      {b.champions.length > 0 && (
        <div className="mt-5">
          <Champion lang="en" names={b.champions.map(name)} />
        </div>
      )}
      {starPlayer && t.status === 'complete' && (
        <p className="mt-3 text-sand">
          Player of the tournament: <span className="font-semibold text-cream">{starPlayer.name}</span> ({starPlayer.team})
        </p>
      )}

      <div className="sticky top-0 z-40 -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-cream/12 bg-ink/95 px-4 backdrop-blur" role="tablist">
        {tabs.map(([id2, label]) => (
          <button
            key={id2}
            type="button"
            role="tab"
            aria-selected={tab === id2}
            onClick={() => setTab(id2)}
            className={`min-h-12 shrink-0 border-b-2 px-3 font-display text-sm font-bold uppercase italic ${tab === id2 ? 'border-gold text-cream' : 'border-transparent text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={tab} className="page-enter mt-6">
        {tab === 'fixtures' && <FixtureList lang="en" fixtures={data.fixtures} teams={data.teams} board={b} onOpen={(f) => setOpenFixture(f.id)} empty={<p className="text-muted">No games yet.</p>} />}

        {tab === 'table' && (
          <div className="space-y-6">
            {b.groups.length > 0 ? b.groups.map((g) => <StandingsTable key={g} lang="en" rows={b.table(g)} title={`Group ${g}`} />) : <StandingsTable lang="en" rows={b.table()} />}
            <TableKey lang="en" />
          </div>
        )}

        {tab === 'stats' && <StatsTables lang="en" players={players} bpo={t.rules.match.ballsPerOver} games={b.gamesPerTeam} star={star} />}

        {tab === 'teams' && (
          <>
            <TeamsList lang="en" teams={data.teams} onOpen={canRun ? (x) => setOpenTeam(x.id) : undefined} />
            {canRun && <p className="mt-4 text-sm text-muted">Tap a team to change its name or squad.</p>}
          </>
        )}

        {tab === 'manage' && canRun && <TournamentManage data={{ ...data, matches }} board={b} players={players} member={member} reload={load} />}
      </div>

      {fixture && (
        <FixtureSheet
          f={fixture}
          data={{ ...data, matches }}
          board={b}
          canRun={canRun}
          onClose={() => setOpenFixture(null)}
          onStart={(from) => show({ kind: 'start', from })}
          onMatch={(matchId) => show({ kind: 'match', id: matchId })}
          save={async (patch, ok) => {
            if (await done(await updateFixture(createClientComponentClient(), fixture.id, patch), ok)) setOpenFixture(null);
          }}
        />
      )}
      {team && canRun && (
        <TeamSheet
          team={team}
          others={data.teams.filter((x) => x.id !== team.id).map((x) => x.name)}
          minPlayers={t.rules.match.minPlayers}
          onClose={() => setOpenTeam(null)}
          save={async (patch) => {
            if (await done(await updateTeam(createClientComponentClient(), team.id, patch), 'Team saved')) setOpenTeam(null);
          }}
        />
      )}
    </div>
  );
}

function when(f: Fixture): string {
  return [f.day ? dayTitle('en', f.day) : null, f.starts, f.court != null ? `Court ${f.court}` : null, f.venue].filter(Boolean).join(', ');
}

function MatchLine({ m, tag }: { m: TournamentMatch; tag: string }) {
  const inn = m.summary?.innings ?? [];
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-cream">{inn.length ? inn.map((i) => `${i.team} ${i.total}/${i.wickets}`).join(', ') : `${m.team_a} v ${m.team_b}`}</p>
      <p className="text-xs text-muted">
        {tag}
        {m.status === 'live' ? ', live' : ''}
      </p>
    </div>
  );
}

function FixtureSheet({
  f,
  data,
  board,
  canRun,
  onClose,
  onStart,
  onMatch,
  save,
}: {
  f: Fixture;
  data: TournamentData;
  board: Board;
  canRun: boolean;
  onClose: () => void;
  onStart: (from: StartFrom) => void;
  onMatch: (matchId: string) => void;
  save: (patch: Partial<Fixture>, ok: string) => Promise<void>;
}) {
  const o: Outcome = board.outcome(f);
  const name = (id: string | null) => data.teams.find((t) => t.id === id)?.name ?? '';
  const active = data.teams.filter((t) => !t.withdrawn);
  // Teams picked by hand, for a game whose places are not decided yet.
  const [home, setHome] = useState<string>(o.home ?? '');
  const [away, setAway] = useState<string>(o.away ?? '');
  const [edit, setEdit] = useState<'none' | 'time' | 'rule'>('none');
  const [day, setDay] = useState(f.day ?? '');
  const [starts, setStarts] = useState(f.starts ?? '');
  const [court, setCourt] = useState(f.court ?? 1);
  const [venue, setVenue] = useState(f.venue ?? '');
  const [note, setNote] = useState(f.note ?? '');
  const others = otherMatches(f, data.matches);
  const result = resultLine('en', o, name);
  const canStart = !!home && !!away && home !== away;
  const undecided = !o.home || !o.away;
  const needsRuling = o.state === 'complete' && o.tie && isKnockout(f.stage) && !o.winner;
  const select = 'field';

  return (
    <Sheet title={stageLabel('en', f)} onClose={onClose}>
      <p className="text-sm text-muted">{when(f) || 'No time yet'}</p>
      <p className="h-sub mt-3 text-2xl">
        {o.home ? name(o.home) : <span className="text-muted">To be decided</span>} <span className="text-muted">v</span> {o.away ? name(o.away) : <span className="text-muted">To be decided</span>}
      </p>
      {o.score && o.match && (
        <p className="mt-2 text-sand">
          {name(o.home)} {o.score.home.runs}/{o.score.home.wickets}, {name(o.away)} {o.score.away.runs}/{o.score.away.wickets}
        </p>
      )}
      {result && <p className="mt-2 text-gold">{result}</p>}
      {f.note && <p className="mt-1 text-sm text-muted">{f.note}</p>}

      {o.state === 'scheduled' && (
        <div className="mt-5 space-y-3">
          {undecided && (
            <>
              <p className="text-sand">The teams for this game are not decided yet. If you know who is playing, pick them.</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [home, setHome, 'First team'],
                    [away, setAway, 'Second team'],
                  ] as [string, (v: string) => void, string][]
                ).map(([value, setValue, label]) => (
                  <label key={label} className="block">
                    <span className="field-label">{label}</span>
                    <select className={select} value={value} onChange={(e) => setValue(e.target.value)}>
                      <option value="">Choose</option>
                      {active.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </>
          )}
          <button type="button" disabled={!canStart} onClick={() => onStart({ t: f.tournament_id, f: f.id, h: home, a: away })} className="btn btn-gold btn-lg w-full">
            Start this game
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </div>
      )}

      {o.match && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onMatch(o.match!.id)} className="btn btn-gold min-h-14 justify-center">
            {o.state === 'live' ? 'Open the match' : 'Match'}
          </button>
          <Link href={`/score/${o.match.id}/card`} className="btn btn-outline min-h-14 justify-center">
            Scorecard
          </Link>
        </div>
      )}

      {others.length > 0 && o.match && (
        <div className="mt-5 border border-gold bg-gold/10 p-3">
          <p className="text-sand">This game was scored more than once. Only one match counts.</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2">
              <MatchLine m={o.match} tag="Counts" />
            </li>
            {others.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <MatchLine m={m} tag={f.voided.includes(m.id) ? 'Set aside' : 'Does not count'} />
                <Link href={`/score/${m.id}/card`} className="min-h-11 content-center px-2 text-sm text-muted underline underline-offset-4">
                  View
                </Link>
                {canRun && m.status !== 'abandoned' && (
                  <button type="button" className="min-h-11 border border-cream/22 px-3 text-sm text-cream" onClick={() => save({ match_id: m.id, voided: f.voided.filter((x) => x !== m.id) }, 'That match now counts')}>
                    Use this one
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsRuling && (
        <div className="mt-5 border border-gold bg-gold/10 p-3">
          <p className="font-semibold text-cream">A tie. Who goes through?</p>
          {canRun ? (
            <>
              <label htmlFor="rule-note" className="field-label mt-3">
                How it was decided (shown with the result)
              </label>
              <input id="rule-note" className="field" maxLength={120} placeholder="Super over 12 to 9" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[o.home, o.away].map((id) => (
                  <button key={id} type="button" className="btn btn-gold min-h-14 justify-center" onClick={() => save({ winner_id: id, note: note.trim() || null }, `${name(id)} go through`)}>
                    {name(id)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sand">The organiser decides, and the next game then shows the team.</p>
          )}
        </div>
      )}

      {canRun && (
        <div className="mt-6 border-t border-cream/12 pt-4">
          <p className="eyebrow">Organiser</p>
          {edit === 'none' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-outline min-h-12 justify-center" onClick={() => setEdit('time')}>
                Time and court
              </button>
              <button type="button" className="btn btn-outline min-h-12 justify-center" onClick={() => setEdit('rule')}>
                Result without play
              </button>
            </div>
          )}
          {edit === 'time' && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="field-label">Date</span>
                  <input type="date" className="field" value={day} onChange={(e) => setDay(e.target.value)} />
                </label>
                <label className="block">
                  <span className="field-label">Start</span>
                  <input type="time" className="field" value={starts} onChange={(e) => setStarts(e.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="field-label">Hall</span>
                <input className="field" maxLength={80} value={venue} onChange={(e) => setVenue(e.target.value)} />
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream">Court</span>
                <Stepper value={court} min={1} max={8} label="Court" onChange={setCourt} />
              </div>
              <p className="text-sm text-muted">A game moved by hand stays where you put it when the schedule is planned again.</p>
              <button type="button" className="btn btn-gold btn-lg w-full" onClick={() => save({ day: day || null, starts: starts ? starts.slice(0, 5) : null, court: day ? court : null, venue: venue.trim() || null, locked: true }, 'Game moved')}>
                Save
              </button>
            </div>
          )}
          {edit === 'rule' && (
            <div className="mt-3 space-y-2">
              {o.home && o.away && (
                <div className="grid grid-cols-2 gap-2">
                  {[o.home, o.away].map((id) => (
                    <button key={id} type="button" className="min-h-12 border border-cream/22 px-3 text-left text-cream" onClick={() => save({ status: 'walkover', winner_id: id }, `Walkover to ${name(id)}`)}>
                      Walkover to {name(id)}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="min-h-12 border border-cream/22 px-3 text-left text-cream" onClick={() => save({ status: 'no_result', winner_id: null }, 'Marked as no result')}>
                  No result
                </button>
                <button type="button" className="min-h-12 border border-cream/22 px-3 text-left text-cream" onClick={() => save({ status: 'cancelled', winner_id: null }, 'Game cancelled')}>
                  Cancel the game
                </button>
              </div>
              {f.status !== 'scheduled' && (
                <button type="button" className="min-h-12 w-full border border-cream/22 px-3 text-left text-cream" onClick={() => save({ status: 'scheduled', winner_id: null, note: null }, 'Back on the list')}>
                  Undo: put the game back on the list
                </button>
              )}
              {o.match && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-sm text-sand">Order a replay. The match that was scored no longer counts.</span>
                  <ConfirmButton label="Replay" confirm="Tap again" onConfirm={() => save({ voided: [...f.voided, o.match!.id], match_id: null, winner_id: null }, 'Replay ordered')} />
                </div>
              )}
              <p className="text-sm text-muted">A walkover gives the points of a win and a loss. Walkovers and no results do not change net run rate.</p>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function TeamSheet({ team, others, minPlayers, onClose, save }: { team: TournamentTeam; others: string[]; minPlayers: number; onClose: () => void; save: (patch: Partial<TournamentTeam>) => Promise<void> }) {
  const [name, setName] = useState(team.name);
  const [squad, setSquad] = useState<Player[]>(team.squad);
  const clean = name.trim().replace(/\s+/g, ' ');
  const clash = others.some((n) => n.trim().toLowerCase() === clean.toLowerCase());
  return (
    <Sheet title="Team" onClose={onClose}>
      <label htmlFor="team-name" className="field-label">
        Name
      </label>
      <input id="team-name" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      {clash && <p className="mt-2 text-sm text-gold">Another team has that name.</p>}
      <div className="mt-5">
        <SquadEditor names={[clean || team.name]} squads={[squad]} setSquads={(s) => setSquad(s[0] ?? [])} minPlayers={minPlayers} unique="team" heading="Squad" listLabel="Players" />
      </div>
      <p className="mt-3 text-sm text-muted">Taking a player out of the squad keeps the figures from games they already played.</p>
      <button type="button" disabled={!clean || clash} className="btn btn-gold btn-lg sticky bottom-0 mt-5 w-full" onClick={() => save({ name: clean.slice(0, 40), squad })}>
        Save the team
      </button>
    </Sheet>
  );
}
