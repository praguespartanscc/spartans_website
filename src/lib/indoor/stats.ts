// Player figures. digestOf() boils one match down to a small record (who won, each innings,
// one line per batter, bowler and fielder) that is stored with the match score. A tournament
// adds those records up, so its table and stats never have to replay every ball.
// Plain types only (no enums): the tests run this file directly with Node's type stripping.

import type { EndReason, MatchState, Player, TeamIndex } from './engine.ts';
import { teamTotal } from './engine.ts';
import type { DismissalKind } from './rules.ts';
import { nameKey } from './names.ts';

// Short keys: this travels with every score update.
// i: batted (1) or not (0). r: runs as on the card (after wicket penalties). s: runs off the bat.
// b: balls. o: times out. x: boundary hits.
export type BatLine = { id: string; n: string; t: TeamIndex; i: 0 | 1; r: number; s: number; b: number; o: number; x: number };
// b: legal balls. r: runs conceded. w: wickets. wd, nb: wides and no balls bowled.
export type BowlLine = { id: string; n: string; t: TeamIndex; b: number; r: number; w: number; wd: number; nb: number };
// c: catches. ro: run outs. st: stumpings.
export type FieldLine = { id: string; n: string; t: TeamIndex; c: number; ro: number; st: number };
// t: batting team. r: runs (penalties included, can be negative). w: wickets. b: legal balls
// faced. q: balls the innings was allowed. e: how it ended.
export type DigestInnings = { t: TeamIndex; r: number; w: number; b: number; q: number; e: EndReason | null };

export type MatchDigest = {
  v: 1;
  teams: [string | null, string | null]; // tournament team ids, in setup order
  bpo: number;
  complete: boolean;
  winner: TeamIndex | null; // null while live, and for a tie
  inn: DigestInnings[];
  bat: BatLine[];
  bowl: BowlLine[];
  field: FieldLine[];
};

const CATCHES: DismissalKind[] = ['caught', 'caughtOffWall', 'caughtOffKeeperWall', 'ceilingCaught'];

// Dismissals where someone in the field did the work, so the scorer is asked who.
export const FIELDED: DismissalKind[] = [...CATCHES, 'runOut', 'stumped'];

export function digestOf(state: MatchState): MatchDigest {
  const bat: BatLine[] = [];
  const bowl: BowlLine[] = [];
  const fielders = new Map<string, FieldLine>();

  for (const inn of state.innings) {
    for (const p of state.teams[inn.batting].players) {
      const b = inn.batters[p.id];
      if (!b) continue;
      bat.push({ id: p.id, n: p.name, t: inn.batting, i: b.visits > 0 ? 1 : 0, r: b.runs, s: b.scored, b: b.balls, o: b.outs, x: b.boundaries });
    }
    for (const id of inn.bowlingOrder) {
      const l = inn.bowlers[id];
      bowl.push({ id, n: l.name, t: inn.bowling, b: l.balls, r: l.runs, w: l.wickets, wd: l.wides, nb: l.noBalls });
    }
    for (const over of inn.overs) {
      for (const ball of over.balls) {
        const w = ball.dismissedId ? ball.value.wicket : null;
        if (!w?.fielderId || !FIELDED.includes(w.kind)) continue;
        const who = state.teams[inn.bowling].players.find((p) => p.id === w.fielderId);
        if (!who) continue;
        const line = fielders.get(who.id) ?? { id: who.id, n: who.name, t: inn.bowling, c: 0, ro: 0, st: 0 };
        if (w.kind === 'runOut') line.ro += 1;
        else if (w.kind === 'stumped') line.st += 1;
        else line.c += 1;
        fielders.set(who.id, line);
      }
    }
  }

  return {
    v: 1,
    teams: [state.setup.teams[0].id ?? null, state.setup.teams[1].id ?? null],
    bpo: state.rules.match.ballsPerOver,
    complete: state.status === 'complete',
    winner: state.result?.winner ?? null,
    inn: state.innings
      .filter((inn) => inn.index === 0 || inn.legalBalls > 0 || inn.complete)
      .map((inn) => ({ t: inn.batting, r: teamTotal(state, inn.batting), w: inn.wickets, b: inn.legalBalls, q: inn.oversLimit * state.rules.match.ballsPerOver, e: inn.endReason })),
    bat,
    bowl,
    field: [...fielders.values()],
  };
}

type OldSummary = { innings: { team: string; total: number; wickets: number; overs: string }[]; result: string | null };

// A stand in for a finished match that has no digest (scored before tournaments existed): the
// totals and the winner, no player lines. Overs text "7.4" is read as 7 overs and 4 balls.
export function digestFromSummary(summary: OldSummary, teamA: string, complete: boolean, bpo = 6): MatchDigest {
  const balls = (overs: string) => {
    const [o, b] = overs.split('.').map((x) => Number(x) || 0);
    return o * bpo + b;
  };
  const inn: DigestInnings[] = summary.innings.map((i) => {
    const b = balls(i.overs);
    return { t: i.team === teamA ? 0 : 1, r: i.total, w: i.wickets, b, q: b, e: null };
  });
  let winner: TeamIndex | null = null;
  if (complete && inn.length === 2 && inn[0].r !== inn[1].r) winner = inn[0].r > inn[1].r ? inn[0].t : inn[1].t;
  return { v: 1, teams: [null, null], bpo, complete, winner, inn, bat: [], bowl: [], field: [] };
}

// Balls an innings counts for in net run rate: the balls actually faced, except that a side
// bowled out, or an innings ended by hand, is charged everything it was allowed.
export function chargedBalls(inn: DigestInnings): number {
  return inn.e === 'allOut' || inn.e === 'declared' ? Math.max(inn.q, inn.b) : inn.b;
}

// ---- Adding a tournament up ----

export type StatsTeam = { id: string; name: string; squad: Player[] };
// One counted match: its digest and the tournament teams that played it, in setup order.
export type StatsMatch = { digest: MatchDigest; teams: [string | null, string | null] };

export type PlayerTotals = {
  key: string;
  name: string;
  teamId: string;
  team: string;
  matches: number;
  bat: { innings: number; runs: number; scored: number; balls: number; outs: number; best: number | null; boundaries: number };
  bowl: { innings: number; balls: number; runs: number; wickets: number; wides: number; noBalls: number; best: { w: number; r: number } | null };
  field: { catches: number; runOuts: number; stumpings: number };
  mvp: number;
};

// Most valuable player points. Simple on purpose, and printed under the table.
export const MVP = { run: 1, wicket: 10, fielding: 5 };
export const mvpPoints = (p: Pick<PlayerTotals, 'bat' | 'bowl' | 'field'>) =>
  p.bat.runs * MVP.run + p.bowl.wickets * MVP.wicket + (p.field.catches + p.field.runOuts + p.field.stumpings) * MVP.fielding;

const better = (a: { w: number; r: number }, b: { w: number; r: number } | null) => !b || a.w > b.w || (a.w === b.w && a.r < b.r);

// One record per player per team. A player is matched by the id their tournament squad gave
// them. A late arrival typed in by hand has a new id, so they are matched by name instead.
export function aggregate(matches: StatsMatch[], teams: StatsTeam[]): PlayerTotals[] {
  const byId = new Map(teams.map((t) => [t.id, t]));
  const out = new Map<string, PlayerTotals>();
  const get = (teamId: string, id: string, name: string): PlayerTotals => {
    const team = byId.get(teamId);
    const member = team?.squad.find((p) => p.id === id) ?? team?.squad.find((p) => nameKey(p.name) === nameKey(name));
    const key = member ? `${teamId}:${member.id}` : `${teamId}:~${nameKey(name)}`;
    let p = out.get(key);
    if (!p) {
      p = {
        key,
        name: member?.name ?? name,
        teamId,
        team: team?.name ?? '',
        matches: 0,
        bat: { innings: 0, runs: 0, scored: 0, balls: 0, outs: 0, best: null, boundaries: 0 },
        bowl: { innings: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, best: null },
        field: { catches: 0, runOuts: 0, stumpings: 0 },
        mvp: 0,
      };
      out.set(key, p);
    }
    return p;
  };

  for (const m of matches) {
    const played = new Set<string>();
    const teamOf = (t: TeamIndex) => m.teams[t] ?? m.digest.teams[t];
    for (const l of m.digest.bat) {
      const teamId = teamOf(l.t);
      if (!teamId) continue;
      const p = get(teamId, l.id, l.n);
      played.add(p.key);
      if (!l.i) continue;
      p.bat.innings += 1;
      p.bat.runs += l.r;
      p.bat.scored += l.s;
      p.bat.balls += l.b;
      p.bat.outs += l.o;
      p.bat.boundaries += l.x;
      if (p.bat.best == null || l.r > p.bat.best) p.bat.best = l.r;
    }
    for (const l of m.digest.bowl) {
      const teamId = teamOf(l.t);
      if (!teamId) continue;
      const p = get(teamId, l.id, l.n);
      played.add(p.key);
      p.bowl.innings += 1;
      p.bowl.balls += l.b;
      p.bowl.runs += l.r;
      p.bowl.wickets += l.w;
      p.bowl.wides += l.wd;
      p.bowl.noBalls += l.nb;
      if (better({ w: l.w, r: l.r }, p.bowl.best)) p.bowl.best = { w: l.w, r: l.r };
    }
    for (const l of m.digest.field) {
      const teamId = teamOf(l.t);
      if (!teamId) continue;
      const p = get(teamId, l.id, l.n);
      played.add(p.key);
      p.field.catches += l.c;
      p.field.runOuts += l.ro;
      p.field.stumpings += l.st;
    }
    for (const key of played) out.get(key)!.matches += 1;
  }

  const list = [...out.values()];
  for (const p of list) p.mvp = mvpPoints(p);
  return list;
}

export const strikeRate = (p: PlayerTotals) => (p.bat.balls ? (100 * p.bat.scored) / p.bat.balls : 0);
export const economy = (p: PlayerTotals, bpo: number) => (p.bowl.balls ? (p.bowl.runs * bpo) / p.bowl.balls : 0);
export const dismissals = (p: PlayerTotals) => p.field.catches + p.field.runOuts + p.field.stumpings;

// How much a player must have done to appear in a rate table (strike rate, economy), so one
// lucky over does not top the list. Grows with the tournament: games is the number of finished
// games per team on average.
export function thresholds(games: number, bpo: number): { balls: number; bowled: number } {
  const g = Math.max(1, Math.round(games));
  return { balls: Math.max(6, 3 * g), bowled: Math.max(bpo, Math.ceil(g / 2) * bpo) };
}

type Board = 'runs' | 'strikeRate' | 'wickets' | 'economy' | 'fielding' | 'mvp';

// The players for one table, best first. Rate tables leave out anyone under the threshold.
export function leaders(players: PlayerTotals[], board: Board, opts: { bpo: number; games: number }): PlayerTotals[] {
  const min = thresholds(opts.games, opts.bpo);
  const by = (score: (p: PlayerTotals) => number, tie: (p: PlayerTotals) => number) => (a: PlayerTotals, b: PlayerTotals) => score(b) - score(a) || tie(b) - tie(a) || a.name.localeCompare(b.name);
  switch (board) {
    case 'runs':
      return players.filter((p) => p.bat.innings > 0).sort(by((p) => p.bat.runs, (p) => -p.bat.balls));
    case 'strikeRate':
      return players.filter((p) => p.bat.balls >= min.balls).sort(by(strikeRate, (p) => p.bat.runs));
    case 'wickets':
      return players.filter((p) => p.bowl.balls > 0).sort(by((p) => p.bowl.wickets, (p) => -economy(p, opts.bpo)));
    case 'economy':
      return players.filter((p) => p.bowl.balls >= min.bowled).sort(by((p) => -economy(p, opts.bpo), (p) => p.bowl.wickets));
    case 'fielding':
      return players.filter((p) => dismissals(p) > 0).sort(by(dismissals, (p) => p.field.catches));
    case 'mvp':
      return players.filter((p) => p.matches > 0).sort(by((p) => p.mvp, (p) => p.bat.runs));
  }
}
