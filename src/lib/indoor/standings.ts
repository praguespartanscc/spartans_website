// Works a tournament out from its fixtures and the matches scored for them: who played whom,
// who won, the points table with net run rate, and which team fills each place in the
// knockout games. Nothing here is stored. It is all worked out again whenever a score changes.
// Plain types only (no enums): the tests run this file directly with Node's type stripping.

import type { TeamIndex } from './engine.ts';
import type { MatchDigest, StatsMatch } from './stats.ts';
import { chargedBalls, digestFromSummary } from './stats.ts';
import type { Fixture, FixtureState, Points, TeamRef, TournamentMatch, TournamentTeam } from './tournament.ts';
import { countedMatch, fixtureState, isKnockout, isOver } from './tournament.ts';

export type Side = { runs: number; wickets: number; balls: number };

// How one fixture stands.
export type Outcome = {
  state: FixtureState;
  home: string | null; // team ids, null while a place is not earned yet
  away: string | null;
  match: TournamentMatch | null; // the match that counts
  winner: string | null; // also who goes through after a tie, once the organiser has said
  loser: string | null;
  tie: boolean;
  score: { home: Side; away: Side } | null;
  bpo: number;
};

export type Row = {
  teamId: string;
  name: string;
  grp: string | null;
  seed: number;
  withdrawn: boolean;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
  nrr: number;
  diff: number; // runs scored minus runs conceded
  pos: number;
  why: string | null; // what put this team above the next one when they are level on points
};

export type Board = {
  outcome: (f: Fixture) => Outcome;
  resolve: (ref: TeamRef) => string | null;
  table: (grp?: string | null) => Row[];
  groups: string[];
  // Every league or group game in this group (or in the whole league) is over.
  stageDone: (grp?: string | null) => boolean;
  // The winner once it is known. Two ids when a tied final was shared.
  champions: string[];
  gamesPerTeam: number; // finished games per team on average, for the stats thresholds
  statsMatches: StatsMatch[];
};

export function digestOfMatch(m: TournamentMatch): MatchDigest | null {
  if (!m.summary) return null;
  return m.summary.digest ?? digestFromSummary(m.summary, m.team_a, m.status === 'complete');
}

const rate = (runs: number, balls: number, bpo: number) => (balls > 0 ? (runs * bpo) / balls : 0);

export function board(input: { teams: TournamentTeam[]; fixtures: Fixture[]; matches: TournamentMatch[]; points: Points; bpo: number; sharedTitle?: boolean }): Board {
  const { teams, fixtures, matches, points, bpo } = input;
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));
  const outcomes = new Map<string, Outcome>();
  const tables = new Map<string, Row[]>();
  const busy = new Set<string>(); // guards against a fixture that depends on itself

  const league = (grp: string | null) => fixtures.filter((f) => !isKnockout(f.stage) && (grp == null || f.grp === grp));

  function stageDone(grp: string | null = null): boolean {
    const list = league(grp);
    return list.length > 0 && list.every((f) => isOver(fixtureState(f, matches)));
  }

  function resolve(ref: TeamRef): string | null {
    if (ref.kind === 'team') return teamById.has(ref.id) ? ref.id : null;
    if (ref.kind === 'groupPos') return stageDone(ref.group) ? (table(ref.group)[ref.pos - 1]?.teamId ?? null) : null;
    if (ref.kind === 'tablePos') return stageDone(null) ? (table(null)[ref.pos - 1]?.teamId ?? null) : null;
    const f = fixtureById.get(ref.fixture);
    if (!f) return null;
    const o = outcome(f);
    return ref.kind === 'winner' ? o.winner : o.loser;
  }

  // Which tournament team is first and second in a match. The match knows (the scorer may have
  // picked the teams by hand). Old or odd matches fall back to the fixture, by name.
  function matchTeams(m: TournamentMatch, home: string | null, away: string | null): [string | null, string | null] {
    const d = m.summary?.digest;
    if (d?.teams[0] && d.teams[1] && teamById.has(d.teams[0]) && teamById.has(d.teams[1])) return [d.teams[0], d.teams[1]];
    const name = (id: string | null) => (id ? (teamById.get(id)?.name.trim().toLowerCase() ?? '') : '');
    if (away && name(away) === m.team_a.trim().toLowerCase() && name(home) !== name(away)) return [away, home];
    return [home, away];
  }

  function outcome(f: Fixture): Outcome {
    const done = outcomes.get(f.id);
    if (done) return done;
    const blank: Outcome = { state: 'scheduled', home: null, away: null, match: null, winner: null, loser: null, tie: false, score: null, bpo };
    if (busy.has(f.id)) return blank;
    busy.add(f.id);

    const state = fixtureState(f, matches);
    const match = countedMatch(f, matches);
    let home = resolve(f.home);
    let away = resolve(f.away);
    const o: Outcome = { ...blank, state, match };

    if (match) {
      const [first, second] = matchTeams(match, home, away);
      // A game started with teams picked by hand: the match says who played.
      if (first && second && (first !== home || second !== away) && first !== away) {
        home = first;
        away = second;
      }
      const d = digestOfMatch(match);
      if (d) {
        o.bpo = d.bpo;
        const idOf = (t: TeamIndex) => (t === 0 ? first : second);
        const side = (id: string | null): Side => {
          const inn = d.inn.find((i) => idOf(i.t) === id);
          return inn ? { runs: inn.r, wickets: inn.w, balls: inn.b } : { runs: 0, wickets: 0, balls: 0 };
        };
        o.score = { home: side(home), away: side(away) };
        if (state === 'complete') {
          if (d.winner != null) {
            o.winner = idOf(d.winner);
            o.loser = idOf(d.winner === 0 ? 1 : 0);
          } else {
            o.tie = true;
          }
        }
      }
    }
    o.home = home;
    o.away = away;

    // The organiser's word: a walkover winner, or who goes through when nothing separated them.
    const said = f.winner_id && (f.winner_id === home || f.winner_id === away) ? f.winner_id : null;
    if (said && (state === 'walkover' || state === 'no_result' || o.tie)) {
      o.winner = said;
      o.loser = said === home ? away : home;
    }

    busy.delete(f.id);
    outcomes.set(f.id, o);
    return o;
  }

  function table(grp: string | null = null): Row[] {
    const key = grp ?? '';
    const cached = tables.get(key);
    if (cached) return cached;

    const rows = new Map<string, Row>();
    for (const t of teams) {
      if (grp != null && t.grp !== grp) continue;
      rows.set(t.id, { teamId: t.id, name: t.name, grp: t.grp, seed: t.seed, withdrawn: t.withdrawn, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0, nrr: 0, diff: 0, pos: 0, why: null });
    }
    // Points won by each team against each other team, and how often they met, for head to head.
    const versus = new Map<string, { points: number; games: number }>();
    const meet = (a: string, b: string, pts: number) => {
      const v = versus.get(`${a}|${b}`) ?? { points: 0, games: 0 };
      v.points += pts;
      v.games += 1;
      versus.set(`${a}|${b}`, v);
    };

    for (const f of league(grp)) {
      const o = outcome(f);
      const a = o.home ? rows.get(o.home) : null;
      const b = o.away ? rows.get(o.away) : null;
      if (!a || !b) continue;
      if (o.state === 'no_result') {
        for (const r of [a, b]) {
          r.played += 1;
          r.noResult += 1;
          r.points += points.noResult;
        }
        meet(a.teamId, b.teamId, points.noResult);
        meet(b.teamId, a.teamId, points.noResult);
        continue;
      }
      if (o.state !== 'complete' && o.state !== 'walkover') continue;
      a.played += 1;
      b.played += 1;
      if (o.state === 'complete' && o.tie) {
        for (const r of [a, b]) {
          r.tied += 1;
          r.points += points.tie;
        }
        meet(a.teamId, b.teamId, points.tie);
        meet(b.teamId, a.teamId, points.tie);
      } else if (o.winner) {
        const w = o.winner === a.teamId ? a : b;
        const l = w === a ? b : a;
        w.won += 1;
        w.points += points.win;
        l.lost += 1;
        l.points += points.loss;
        meet(w.teamId, l.teamId, points.win);
        meet(l.teamId, w.teamId, points.loss);
      }
      // Net run rate only counts games that were played to a result. A walkover adds nothing.
      const d = o.state === 'complete' && o.match ? digestOfMatch(o.match) : null;
      if (!d || !o.score) continue;
      const [first] = matchTeams(o.match!, o.home, o.away);
      for (const inn of d.inn) {
        const batting = (inn.t === 0) === (first === a.teamId) ? a : b;
        const bowling = batting === a ? b : a;
        const balls = chargedBalls(inn);
        batting.runsFor += inn.r;
        batting.ballsFor += balls;
        bowling.runsAgainst += inn.r;
        bowling.ballsAgainst += balls;
      }
    }

    const list = [...rows.values()].filter((r) => !(r.withdrawn && r.played === 0));
    for (const r of list) {
      r.nrr = rate(r.runsFor, r.ballsFor, bpo) - rate(r.runsAgainst, r.ballsAgainst, bpo);
      r.diff = r.runsFor - r.runsAgainst;
    }

    // Level on points and wins: head to head between exactly those teams, but only when each of
    // them has met each of the others equally often. Otherwise it would favour whoever happened
    // to have played the weaker side twice.
    const tier = (r: Row) => `${r.points}|${r.won}`;
    const tiers = new Map<string, Row[]>();
    for (const r of list) tiers.set(tier(r), [...(tiers.get(tier(r)) ?? []), r]);
    const h2h = new Map<string, number>();
    for (const group of tiers.values()) {
      if (group.length < 2) continue;
      const counts = new Set<number>();
      for (const x of group) for (const y of group) if (x !== y) counts.add(versus.get(`${x.teamId}|${y.teamId}`)?.games ?? 0);
      if (counts.size !== 1 || counts.has(0)) continue;
      for (const x of group) h2h.set(x.teamId, group.reduce((sum, y) => sum + (x === y ? 0 : (versus.get(`${x.teamId}|${y.teamId}`)?.points ?? 0)), 0));
    }

    const steps: { name: string; score: (r: Row) => number }[] = [
      { name: 'points', score: (r) => r.points },
      { name: 'wins', score: (r) => r.won },
      { name: 'head to head', score: (r) => h2h.get(r.teamId) ?? 0 },
      { name: 'net run rate', score: (r) => Math.round(r.nrr * 1000) },
      { name: 'run difference', score: (r) => r.diff },
      { name: 'seeding', score: (r) => -r.seed },
    ];
    list.sort((x, y) => {
      for (const s of steps) {
        const d = s.score(y) - s.score(x);
        if (d !== 0) return d;
      }
      return x.name.localeCompare(y.name);
    });
    list.forEach((r, i) => {
      r.pos = i + 1;
      const next = list[i + 1];
      if (!next || next.points !== r.points || r.played === 0) return;
      const step = steps.slice(1).find((s) => s.score(r) !== s.score(next));
      if (step) r.why = `Ahead of ${next.name} on ${step.name}`;
    });

    tables.set(key, list);
    return list;
  }

  const groups = [...new Set(teams.map((t) => t.grp).filter((g): g is string => !!g))].sort();

  // The champion: the winner of the final, or the top of the table when there is no final.
  let champions: string[] = [];
  const final = fixtures.find((f) => f.stage === 'final');
  if (final) {
    const o = outcome(final);
    if (o.winner) champions = [o.winner];
    else if (o.tie && input.sharedTitle && o.home && o.away) champions = [o.home, o.away];
  } else if (fixtures.length && fixtures.every((f) => !isKnockout(f.stage))) {
    const rows = table(null);
    const total = league(null).filter((f) => f.status !== 'cancelled').length;
    // A series is won as soon as one side cannot be caught.
    const clinched = fixtures.every((f) => f.stage === 'series') && rows[0] && rows[0].won > total / 2;
    if ((stageDone(null) || clinched) && rows[0] && rows[0].played > 0) {
      champions = [rows[0].teamId];
      if (!clinched && rows[1] && !rows[0].why && rows[1].points === rows[0].points && input.sharedTitle) champions.push(rows[1].teamId);
    }
  }

  const statsMatches: StatsMatch[] = [];
  let finished = 0;
  for (const f of fixtures) {
    const o = outcome(f);
    if (o.state === 'complete' || o.state === 'walkover' || o.state === 'no_result') finished += 1;
    if (!o.match || f.status === 'cancelled') continue;
    const d = digestOfMatch(o.match);
    if (d) statsMatches.push({ digest: d, teams: matchTeams(o.match, o.home, o.away) });
  }
  const active = teams.filter((t) => !t.withdrawn).length || 1;

  return { outcome, resolve, table, groups, stageDone, champions, gamesPerTeam: (finished * 2) / active, statsMatches };
}

// "+1.250" as tables show it.
export const nrrText = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(3)}`;
