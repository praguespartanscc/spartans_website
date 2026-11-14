// Tournament planning for the indoor scorer: which games a format has, and where and when each
// one is played. Pure functions only (no DOM, no Node), so the same code runs in the browser
// and in the tests.

import type { Finals, Fixture, Format, Settings, Stage, TeamRef } from './tournament.ts';
import { isKnockout, toClock, toMinutes } from './tournament.ts';

export type Rand = () => number;

// mulberry32: tiny, fast and the same on every machine for a given seed.
export function rng(seed: number): Rand {
  let a = (Math.floor(seed) || 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Entrant = { id: string; seed: number }; // seed 1 is the strongest

const bySeed = (teams: Entrant[]) => [...teams].sort((a, b) => a.seed - b.seed);
const plural = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
const TIMES = ['', 'once', 'twice', 'three times'];
const times = (k: number) => TIMES[k] ?? `${k} times`;

// ---------------------------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------------------------

export function suggestFormat(n: number): Format {
  if (n <= 2) return { kind: 'series', legs: 3, groups: 1, finals: 'none', thirdPlace: false };
  if (n === 3) return { kind: 'roundRobin', legs: 2, groups: 1, finals: 'final', thirdPlace: false };
  if (n <= 6) return { kind: 'roundRobin', legs: 1, groups: 1, finals: 'final', thirdPlace: false };
  if (n <= 12) return { kind: 'groups', legs: 1, groups: 2, finals: 'semis', thirdPlace: false };
  return { kind: 'groups', legs: 1, groups: 4, finals: 'quarters', thirdPlace: false };
}

// Finals are only wired for 2 and 4 groups, and a group needs at least 2 teams.
function groupCount(n: number, wanted: number): number {
  const g = Math.floor(wanted) || 1;
  if (g >= 4 && n >= 8) return 4;
  if (g >= 2 && n >= 4) return 2;
  return 1;
}

// The finals stage that is actually possible: the one asked for, or the largest one below it.
function possibleFinals(n: number, groups: number, want: Finals): Finals {
  if (want === 'none' || n < 2) return 'none';
  if (groups === 1) {
    if (want === 'page') return n >= 4 ? 'page' : 'final';
    if (want === 'quarters' && n >= 8) return 'quarters';
    if (want !== 'final' && n >= 4) return 'semis';
    return 'final';
  }
  const smallest = Math.floor(n / groups);
  if (want === 'quarters' && (groups === 4 ? smallest >= 2 : smallest >= 4)) return 'quarters';
  if (want !== 'final' && (groups === 4 || smallest >= 2)) return 'semis'; // a page playoff needs one league
  return 'final';
}

// With 4 groups a 'final' still needs semi finals between the group winners.
const hasSemis = (f: Format) => f.finals === 'semis' || f.finals === 'quarters' || (f.finals === 'final' && f.groups === 4);

// The format that is really played for n teams: impossible choices fall back to the nearest
// possible one (quarters with 5 teams become semis), and fields a kind does not use are reset.
// buildFixtures and gameCount both go through here, so they always agree.
export function resolveFormat(n: number, format: Format): Format {
  const legs = Math.max(1, Math.floor(format.legs) || 1);
  if (format.kind === 'knockout') return { kind: 'knockout', legs: 1, groups: 1, finals: 'none', thirdPlace: format.thirdPlace && n >= 4 };
  if (format.kind === 'series' && n <= 2) return { kind: 'series', legs, groups: 1, finals: 'none', thirdPlace: false };
  // A series is for two teams. With more it can only mean everyone plays everyone.
  const groups = format.kind === 'groups' ? groupCount(n, format.groups) : 1;
  const finals = format.kind === 'series' ? 'none' : possibleFinals(n, groups, format.finals);
  const resolved: Format = { kind: groups > 1 ? 'groups' : 'roundRobin', legs, groups, finals, thirdPlace: false };
  resolved.thirdPlace = format.thirdPlace && hasSemis(resolved);
  return resolved;
}

const sameFormat = (a: Format, b: Format) => a.kind === b.kind && a.legs === b.legs && a.groups === b.groups && a.finals === b.finals && a.thirdPlace === b.thirdPlace;

// Snake seeding: 1 2 / 4 3 / 5 6 / 8 7, so the groups are as even in strength as they can be.
const snake = (i: number, groups: number) => {
  const col = i % groups;
  return Math.floor(i / groups) % 2 ? groups - 1 - col : col;
};
const groupName = (i: number) => String.fromCharCode(65 + i);

function groupSizes(n: number, groups: number): number[] {
  const sizes = Array.from({ length: groups }, () => 0);
  for (let i = 0; i < n; i++) sizes[snake(i, groups)] += 1;
  return sizes;
}

export function assignGroups(teams: Entrant[], groups: number): Record<string, string> {
  const g = Math.max(1, Math.floor(groups) || 1);
  const out: Record<string, string> = {};
  bySeed(teams).forEach((t, i) => {
    out[t.id] = groupName(snake(i, g));
  });
  return out;
}

function finalsGames(f: Format): number {
  const base = f.finals === 'none' ? 0 : f.finals === 'final' ? (f.groups === 4 ? 3 : 1) : f.finals === 'semis' ? 3 : f.finals === 'quarters' ? 7 : 4;
  return base + (f.thirdPlace ? 1 : 0);
}

export function gameCount(n: number, format: Format): number {
  if (n < 2) return 0;
  const f = resolveFormat(n, format);
  if (f.kind === 'series') return f.legs;
  if (f.kind === 'knockout') return n - 1 + (f.thirdPlace ? 1 : 0);
  const stage = groupSizes(n, f.groups).reduce((sum, k) => sum + (k * (k - 1)) / 2, 0) * f.legs;
  return stage + finalsGames(f);
}

// Title and one line of detail for the format picker.
function describe(n: number, f: Format): { title: string; detail: string } {
  const third = f.thirdPlace ? ' The semi final losers play for third place.' : '';
  if (f.kind === 'series') {
    if (f.legs === 1) return { title: 'One game', detail: 'A single game decides it.' };
    if (f.legs % 2 === 0) return { title: `Series of ${f.legs} games`, detail: `The two teams play each other ${times(f.legs)}.` };
    return { title: `Best of ${f.legs} series`, detail: `Up to ${f.legs} games. The first team to win ${(f.legs + 1) / 2} takes the series.` };
  }
  if (f.kind === 'knockout') {
    let size = 1;
    while (size < n) size *= 2;
    const byes = size - n;
    const bye = byes ? ` The top ${byes === 1 ? 'seed gets' : `${byes} seeds get`} a bye in the first round.` : '';
    return { title: 'Straight knockout', detail: `Lose once and you are out.${bye}${third}` };
  }
  if (f.kind === 'roundRobin') {
    const tail = { none: '', final: ', then a final', semis: ', then semi finals', quarters: ', then quarter finals', page: ', then playoffs' }[f.finals];
    const next = {
      none: 'The top of the table wins.',
      final: 'The top two meet in the final.',
      semis: 'The top four go to the semi finals.',
      quarters: 'The top eight go to the quarter finals.',
      page: 'The top four go to the playoffs and the top two get a second chance.',
    }[f.finals];
    return {
      title: `Everyone plays everyone${f.legs > 1 ? ` ${times(f.legs)}` : ''}${tail}`,
      detail: `Every team plays ${plural((n - 1) * f.legs, 'league game')}. ${next}${third}`,
    };
  }
  const sizes = groupSizes(n, f.groups);
  const low = Math.min(...sizes);
  const high = Math.max(...sizes);
  const range = (a: number, b: number) => (a === b ? `${a}` : `${a} or ${b}`);
  const tail = f.finals === 'quarters' ? 'quarter finals' : hasSemis(f) ? 'semi finals' : f.finals === 'final' ? 'a final' : '';
  const next =
    f.finals === 'none'
      ? 'The group tables decide it.'
      : f.groups === 4
        ? f.finals === 'quarters' ? 'The top two of each group go to the quarter finals.' : 'The group winners go to the semi finals.'
        : f.finals === 'quarters' ? 'The top four of each group go to the quarter finals.' : f.finals === 'semis' ? 'The top two of each group go to the semi finals.' : 'The group winners meet in the final.';
  return {
    title: `${f.groups === 4 ? 'Four' : 'Two'} groups${tail ? `, then ${tail}` : ''}`,
    detail: `Groups of ${low === high ? low : `${low} and ${high}`}. Every team plays ${range((low - 1) * f.legs, (high - 1) * f.legs)} group ${(high - 1) * f.legs === 1 ? 'game' : 'games'}. ${next}${third}`,
  };
}

export function formatChoices(n: number): { format: Format; title: string; detail: string; games: number }[] {
  if (n < 2) return [];
  const make = (kind: Format['kind'], legs: number, groups: number, finals: Finals): Format => ({ kind, legs, groups, finals, thirdPlace: false });
  const list: Format[] = [suggestFormat(n)];
  if (n === 2) {
    list.push(make('series', 5, 1, 'none'), make('series', 1, 1, 'none'));
  } else {
    list.push(make('roundRobin', 1, 1, 'final'), make('roundRobin', 1, 1, 'semis'), make('roundRobin', 1, 1, 'page'));
    if (n <= 8) list.push(make('roundRobin', 2, 1, 'final'));
    list.push(make('roundRobin', 1, 1, 'none'));
    // A group of two is a single game, so every group needs at least three teams.
    if (n >= 6) list.push(make('groups', 1, 2, 'semis'), make('groups', 1, 2, 'final'), make('groups', 1, 2, 'quarters'));
    if (n >= 12) list.push(make('groups', 1, 4, 'quarters'), make('groups', 1, 4, 'semis'));
    list.push(make('roundRobin', 1, 1, 'quarters'), make('knockout', 1, 1, 'none'));
  }
  const out: { format: Format; title: string; detail: string; games: number }[] = [];
  for (const format of list) {
    // Only what is possible as asked: anything resolveFormat would have to change is left out.
    if (!sameFormat(resolveFormat(n, format), format)) continue;
    if (out.some((c) => sameFormat(c.format, format))) continue;
    out.push({ format, ...describe(n, format), games: gameCount(n, format) });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------

// Circle method. Returns rounds of [home, away] indexes into the seeded team list. An odd count
// gets a bye. Who is listed first comes from the two indexes alone, which keeps every team's
// home and away counts within one of each other whatever the order of the rounds.
function circle(n: number, legs: number): [number, number][][] {
  if (n < 2) return [];
  const m = n % 2 ? n + 1 : n;
  let ring = Array.from({ length: m }, (_, i) => i);
  const single: [number, number][][] = [];
  for (let r = 0; r < m - 1; r++) {
    const round: [number, number][] = [];
    for (let i = 0; i < m / 2; i++) {
      const a = Math.min(ring[i], ring[m - 1 - i]);
      const b = Math.max(ring[i], ring[m - 1 - i]);
      if (b >= n) continue; // the bye
      round.push((a + b) % 2 ? [a, b] : [b, a]);
    }
    single.push(round);
    ring = [ring[0], ring[m - 1], ...ring.slice(1, m - 1)];
  }
  const rounds: [number, number][][] = [];
  for (let leg = 0; leg < legs; leg++) {
    for (const round of single) rounds.push(leg % 2 ? round.map(([h, a]): [number, number] => [a, h]) : round);
  }
  return rounds;
}

// 8 teams: 1 v 8, 4 v 5, 2 v 7, 3 v 6, so the top two seeds can only meet in the final.
function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export function buildFixtures(tournamentId: string, teams: Entrant[], format: Format, makeId: () => string): Fixture[] {
  const sorted = bySeed(teams);
  const n = sorted.length;
  const f = resolveFormat(n, format);
  const out: Fixture[] = [];
  if (n < 2) return out;

  const add = (stage: Stage, grp: string | null, round: number, label: string, home: TeamRef, away: TeamRef): Fixture => {
    const fx: Fixture = {
      id: makeId(), tournament_id: tournamentId, stage, grp, round, seq: out.length + 1, label, home, away,
      duty: null, venue: null, court: null, day: null, starts: null,
      status: 'scheduled', winner_id: null, match_id: null, voided: [], locked: false, note: null,
    };
    out.push(fx);
    return fx;
  };
  const team = (id: string): TeamRef => ({ kind: 'team', id });
  const winner = (fx: Fixture): TeamRef => ({ kind: 'winner', fixture: fx.id });
  const loser = (fx: Fixture): TeamRef => ({ kind: 'loser', fixture: fx.id });

  if (f.kind === 'knockout') {
    let size = 1;
    while (size < n) size *= 2;
    let field: (TeamRef | null)[] = seedOrder(size).map((s) => (s <= n ? team(sorted[s - 1].id) : null));
    let early = 0;
    let semis: Fixture[] = [];
    while (field.length > 1) {
      const left = field.length;
      const stage: Stage = left === 2 ? 'final' : left === 4 ? 'sf' : left === 8 ? 'qf' : 'ko';
      if (stage === 'ko') early += 1;
      if (stage === 'final' && f.thirdPlace && semis.length === 2) add('third', null, 1, 'Third place', loser(semis[0]), loser(semis[1]));
      const next: (TeamRef | null)[] = [];
      const made: Fixture[] = [];
      for (let i = 0; i < left; i += 2) {
        const a = field[i];
        const b = field[i + 1];
        // A bye is not a game: the seeded team goes straight into the next round.
        if (!a || !b) {
          next.push(a ?? b);
          continue;
        }
        const k = made.length + 1;
        const label = stage === 'final' ? 'Final' : stage === 'sf' ? `Semi final ${k}` : stage === 'qf' ? `Quarter final ${k}` : `Round of ${left} game ${k}`;
        const fx = add(stage, null, stage === 'ko' ? early : 1, label, a, b);
        made.push(fx);
        next.push(winner(fx));
      }
      if (stage === 'sf') semis = made;
      field = next;
    }
    return out;
  }

  if (f.kind === 'series') {
    circle(2, f.legs).forEach(([[h, a]], i) => add('series', null, i + 1, `Game ${i + 1}`, team(sorted[h].id), team(sorted[a].id)));
    return out;
  }

  // League or group stage, the groups interleaved round by round.
  const names = Array.from({ length: f.groups }, (_, i) => groupName(i));
  const members: Entrant[][] = names.map(() => []);
  sorted.forEach((t, i) => members[snake(i, f.groups)].push(t));
  const rounds = members.map((m) => circle(m.length, f.legs));
  const most = Math.max(...rounds.map((r) => r.length));
  for (let r = 0; r < most; r++) {
    members.forEach((m, g) => {
      for (const [h, a] of rounds[g][r] ?? []) {
        if (f.kind === 'groups') add('group', names[g], r + 1, `Group ${names[g]}`, team(m[h].id), team(m[a].id));
        else add('league', null, r + 1, `Round ${r + 1}`, team(m[h].id), team(m[a].id));
      }
    });
  }

  // Finals. A league feeds them by table place, groups by place in the group.
  const pos = (p: number): TeamRef => ({ kind: 'tablePos', pos: p });
  const g = (group: string, p: number): TeamRef => ({ kind: 'groupPos', group, pos: p });
  if (f.finals === 'none') return out;
  if (f.finals === 'page') {
    const q1 = add('q1', null, 1, 'Qualifier 1', pos(1), pos(2));
    const elim = add('elim', null, 1, 'Eliminator', pos(3), pos(4));
    const q2 = add('q2', null, 1, 'Qualifier 2', loser(q1), winner(elim));
    add('final', null, 1, 'Final', winner(q1), winner(q2));
    return out;
  }
  let last: [TeamRef, TeamRef] | null = null;
  let semiPairs: [TeamRef, TeamRef][] | null = null;
  if (f.finals === 'quarters') {
    const pairs: [TeamRef, TeamRef][] =
      f.groups === 1
        ? [[pos(1), pos(8)], [pos(4), pos(5)], [pos(2), pos(7)], [pos(3), pos(6)]]
        : f.groups === 2
          ? [[g('A', 1), g('B', 4)], [g('B', 2), g('A', 3)], [g('B', 1), g('A', 4)], [g('A', 2), g('B', 3)]]
          : [[g('A', 1), g('B', 2)], [g('C', 1), g('D', 2)], [g('B', 1), g('A', 2)], [g('D', 1), g('C', 2)]];
    const qf = pairs.map(([h, a], i) => add('qf', null, 1, `Quarter final ${i + 1}`, h, a));
    semiPairs = [[winner(qf[0]), winner(qf[1])], [winner(qf[2]), winner(qf[3])]];
  } else if (f.finals === 'semis') {
    semiPairs =
      f.groups === 1
        ? [[pos(1), pos(4)], [pos(2), pos(3)]]
        : f.groups === 2
          ? [[g('A', 1), g('B', 2)], [g('B', 1), g('A', 2)]]
          : [[g('A', 1), g('D', 1)], [g('B', 1), g('C', 1)]];
  } else if (f.groups === 4) {
    semiPairs = [[g('A', 1), g('B', 1)], [g('C', 1), g('D', 1)]];
  } else {
    last = f.groups === 1 ? [pos(1), pos(2)] : [g('A', 1), g('B', 1)];
  }
  if (semiPairs) {
    const sf = semiPairs.map(([h, a], i) => add('sf', null, 1, `Semi final ${i + 1}`, h, a));
    if (f.thirdPlace) add('third', null, 1, 'Third place', loser(sf[0]), loser(sf[1]));
    last = [winner(sf[0]), winner(sf[1])];
  }
  if (last) add('final', null, 1, 'Final', last[0], last[1]);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------------------------

// A place a game can be played.
export type Slot = { session: string; day: string; venue: string; court: number; starts: string; ends: string; order: number };

export function slotsOf(settings: Pick<Settings, 'sessions' | 'matchMinutes' | 'gapMinutes'>): Slot[] {
  const match = Math.floor(settings.matchMinutes) || 0;
  const gap = Math.max(0, Math.floor(settings.gapMinutes) || 0);
  if (match <= 0) return [];
  const raw: { slot: Slot; at: number; session: number }[] = [];
  settings.sessions.forEach((s, session) => {
    const end = toMinutes(s.end);
    const courts = Math.floor(s.courts) || 0;
    // A game that would run past the end of the session is not offered.
    for (let at = toMinutes(s.start); at + match <= end; at += match + gap) {
      for (let court = 1; court <= courts; court++) {
        raw.push({ slot: { session: s.id, day: s.day, venue: s.venue, court, starts: toClock(at), ends: toClock(at + match), order: 0 }, at, session });
      }
    }
  });
  raw.sort((a, b) => (a.slot.day < b.slot.day ? -1 : a.slot.day > b.slot.day ? 1 : a.at - b.at || a.session - b.session || a.slot.court - b.slot.court));
  // Two sessions that overlap in the same hall would offer the same court twice. The first wins.
  const busyUntil = new Map<string, number>();
  const out: Slot[] = [];
  let order = -1;
  let moment = '';
  for (const { slot, at } of raw) {
    const court = `${slot.day}|${slot.venue}|${slot.court}`;
    if (at < (busyUntil.get(court) ?? -1)) continue;
    busyUntil.set(court, at + match);
    if (`${slot.day}|${at}` !== moment) {
      moment = `${slot.day}|${at}`;
      order += 1;
    }
    slot.order = order;
    out.push(slot);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------------------------

export type Placed = { fixtures: Fixture[]; unplaced: string[]; cost: number; notes: string[] };
// notBefore: on a re-plan in the middle of a day, no game that can still move is put before this
// moment (a break that has already gone by must not be filled with a game).
export type ScheduleOptions = { pinned?: Set<string> | string[]; previous?: Fixture[]; notBefore?: { day: string; starts: string } };

// Soft penalties. The order of magnitude is what matters: a rest for a team beats a tidy court
// rota, and nothing beats the hard rules.
const THREE = 1000; // a team plays three games in a row
const B2B = 100; // a team plays two games in a row
const MOVED = 50; // a game leaves its place on a re-plan
const IDLE = 20; // a team waits more than twice as long as teams wait on average
const EDGE = 10; // the same team opens (or closes) another day
const WAIT_VAR = 5; // variance of every team's longest wait
const COURT = 2; // a team always on the same court
const SPAN = 1; // per slot between a team's first and last game of a day
const LATE = 50000; // millionths per wave: a game played later than it could be
const DAY = 10000; // minutes kept free between two days on the internal clock

type Place = { day: string; venue: string; court: number; starts: string };
const placeOf = (f: Fixture | undefined): Place | null =>
  f && f.day != null && f.starts != null && f.venue != null && f.court != null ? { day: f.day, venue: f.venue, court: f.court, starts: f.starts } : null;
const spot = (day: string, venue: string, court: number, at: number) => `${day}|${venue}|${court}|${at}`;

// The whole planner. `quick` only answers "does it fit" (no hill climb, no duty, no notes).
function plan(input: Fixture[], settings: Settings, opts: ScheduleOptions, quick: boolean): Placed {
  const match = Math.max(0, Math.floor(settings.matchMinutes) || 0);
  const gap = Math.max(0, Math.floor(settings.gapMinutes) || 0);
  const slotLen = Math.max(1, match + gap);
  const F = input.length;
  const prevById = new Map<string, Fixture>();
  for (const f of opts.previous ?? []) prevById.set(f.id, f);
  const pinned = new Set<string>(opts.pinned ?? []);

  // A cancelled game needs no court. It passes through as it is.
  const live = input.map((f) => f.status !== 'cancelled');
  // Pinned and locked games stay exactly where they are (the place in `previous` wins).
  const fixedAt = input.map((f, i): Place | null => {
    if (!live[i]) return null;
    const prev = prevById.get(f.id);
    return pinned.has(f.id) || f.locked || prev?.locked ? placeOf(prev) ?? placeOf(f) : null;
  });
  const fixed = fixedAt.map((p) => p !== null);

  // The grid: every slot of every session, plus the place of any fixed game that is not on it.
  type Cell = { slot: Slot; at: number; holder: number; extra: boolean };
  const cells: Cell[] = slotsOf(settings).map((slot) => ({ slot, at: toMinutes(slot.starts), holder: -1, extra: false }));
  const onGrid = new Map<string, Cell>();
  for (const c of cells) onGrid.set(spot(c.slot.day, c.slot.venue, c.slot.court, c.at), c);
  let offGrid = 0;
  fixedAt.forEach((p, i) => {
    if (!p) return;
    const at = toMinutes(p.starts);
    const hit = onGrid.get(spot(p.day, p.venue, p.court, at));
    if (hit && hit.holder < 0) {
      hit.holder = i;
      return;
    }
    if (!hit) offGrid += 1;
    cells.push({ slot: { session: '', day: p.day, venue: p.venue, court: p.court, starts: p.starts, ends: toClock(at + match), order: -1 }, at, holder: i, extra: true });
  });
  cells.sort((a, b) => (a.slot.day < b.slot.day ? -1 : a.slot.day > b.slot.day ? 1 : a.at - b.at));
  const S = cells.length;

  // Waves: the distinct start moments. Games in one wave run side by side.
  const waveOf = new Int32Array(S);
  const courtOf = new Int32Array(S);
  const wStart: number[] = [];
  const wEnd: number[] = [];
  const wDay: number[] = [];
  const waveFirst: number[] = [];
  const dayFirst: number[] = [];
  const dayLast: number[] = [];
  const courtIndex = new Map<string, number>();
  cells.forEach((c, s) => {
    const prior = s ? cells[s - 1] : null;
    const newDay = !prior || prior.slot.day !== c.slot.day;
    if (newDay || prior.at !== c.at) {
      if (newDay) dayFirst.push(wStart.length);
      const d = dayFirst.length - 1;
      dayLast[d] = wStart.length;
      wDay.push(d);
      wStart.push(d * DAY + c.at);
      wEnd.push(d * DAY + c.at + match);
      waveFirst.push(s);
    }
    waveOf[s] = wStart.length - 1;
    const key = `${c.slot.venue}|${c.slot.court}`;
    if (!courtIndex.has(key)) courtIndex.set(key, courtIndex.size);
    courtOf[s] = courtIndex.get(key) ?? 0;
  });
  waveFirst.push(S);
  const W = wStart.length;
  const C = Math.max(1, courtIndex.size);

  // For each wave: the waves that overlap it (a team cannot be in both) and the ones so close
  // before or after that playing in both is back to back (less than a game's length of rest).
  const clash: number[][] = wStart.map(() => []);
  const before: number[][] = wStart.map(() => []);
  const after: number[][] = wStart.map(() => []);
  for (let a = 0; a < W; a++) {
    for (let b = a + 1; b < W && wDay[b] === wDay[a]; b++) {
      if (wStart[b] < wEnd[a]) {
        clash[a].push(b);
        clash[b].push(a);
      } else if (wStart[b] - wEnd[a] < match) {
        after[a].push(b);
        before[b].push(a);
      } else break;
    }
  }

  // slotFix: the game in each slot, -1 for empty, -2 for a court taken by an off grid fixed game.
  const slotFix = new Int32Array(S).fill(-1);
  for (const e of cells) {
    if (!e.extra) continue;
    cells.forEach((c, s) => {
      if (!c.extra && c.holder < 0 && c.slot.day === e.slot.day && c.slot.venue === e.slot.venue && c.slot.court === e.slot.court && c.at < e.at + match && e.at < c.at + match) slotFix[s] = -2;
    });
  }

  // Known teams. A placeholder ("winner of", "A1") is -1: nobody knows yet who that is.
  const teamIds: string[] = [];
  const teamIndex = new Map<string, number>();
  const teamOf = (ref: TeamRef): number => {
    if (ref.kind !== 'team') return -1;
    let t = teamIndex.get(ref.id);
    if (t === undefined) {
      t = teamIds.length;
      teamIds.push(ref.id);
      teamIndex.set(ref.id, t);
    }
    return t;
  };
  const home = new Int32Array(F).fill(-1);
  const away = new Int32Array(F).fill(-1);
  input.forEach((f, i) => {
    if (!live[i]) return;
    home[i] = teamOf(f.home);
    away[i] = teamOf(f.away);
  });
  const T = teamIds.length;
  const teamFix: number[][] = teamIds.map(() => []);
  for (let i = 0; i < F; i++) {
    if (home[i] >= 0) teamFix[home[i]].push(i);
    if (away[i] >= 0 && away[i] !== home[i]) teamFix[away[i]].push(i);
  }

  // Playing order as given, and each game's rank in it.
  const order: number[] = [];
  for (let i = 0; i < F; i++) if (live[i]) order.push(i);
  order.sort((a, b) => input[a].seq - input[b].seq || a - b);
  const rank = new Int32Array(F);
  order.forEach((f, k) => {
    rank[f] = k;
  });

  // What must be over before a game can start.
  const idIndex = new Map<string, number>();
  input.forEach((f, i) => idIndex.set(f.id, i));
  const stageGames = order.filter((i) => !isKnockout(input[i].stage));
  const leagueGames = order.filter((i) => input[i].stage === 'league');
  const depSets: Set<number>[] = input.map(() => new Set<number>());
  const links: number[] = []; // [source, game] pairs where one team certainly plays both
  const meetings = new Map<string, number>();
  for (const i of order) {
    const f = input[i];
    for (const ref of [f.home, f.away]) {
      if (ref.kind === 'winner' || ref.kind === 'loser') {
        const j = idIndex.get(ref.fixture);
        if (j !== undefined && live[j] && j !== i) {
          depSets[i].add(j);
          links.push(j, i);
        }
      } else if (ref.kind === 'groupPos') {
        for (const j of order) if (input[j].stage === 'group' && input[j].grp === ref.group) depSets[i].add(j);
      } else if (ref.kind === 'tablePos') {
        for (const j of leagueGames) depSets[i].add(j);
      }
    }
    if (isKnockout(f.stage)) for (const j of stageGames) depSets[i].add(j);
    // The final is the last game of the tournament, on its own.
    if (f.stage === 'final') for (const j of order) if (input[j].stage !== 'final') depSets[i].add(j);
    // The same two teams again (a second leg, the next game of a series) comes after the first.
    if (home[i] >= 0 && away[i] >= 0 && !isKnockout(f.stage)) {
      const pair = home[i] < away[i] ? `${home[i]}|${away[i]}` : `${away[i]}|${home[i]}`;
      const earlier = meetings.get(pair);
      if (earlier !== undefined) depSets[i].add(earlier);
      meetings.set(pair, i);
    }
  }
  const deps: number[][] = depSets.map((s) => [...s]);
  const feeders: number[][] = input.map(() => []);
  for (let i = 0; i < links.length; i += 2) feeders[links[i + 1]].push(links[i]);
  const rdeps: number[][] = input.map(() => []);
  deps.forEach((list, i) => list.forEach((j) => rdeps[j].push(i)));

  // Where each free game was before, for a stable re-plan: -1 nowhere, -2 a place that is gone.
  const gridSlot = new Map<string, number>();
  cells.forEach((c, s) => {
    if (!c.extra) gridSlot.set(spot(c.slot.day, c.slot.venue, c.slot.court, c.at), s);
  });
  const prevSlot = new Int32Array(F).fill(-1);
  let hasPrev = false;
  input.forEach((f, i) => {
    if (!live[i] || fixed[i]) return;
    const p = placeOf(prevById.get(f.id));
    if (!p) return;
    prevSlot[i] = gridSlot.get(spot(p.day, p.venue, p.court, toMinutes(p.starts))) ?? -2;
    hasPrev = true;
  });

  // ---- state ----
  const slotOf = new Int32Array(F).fill(-1);
  const teamAt = new Uint8Array(Math.max(1, T * W)); // games of a team in a wave
  const onCourt = new Int32Array(Math.max(1, T * C)); // games of a team on a court
  const waveGames = new Int32Array(Math.max(1, W));
  // Later waves cost a little, and less for games late in the playing order, so the day stays
  // compact and runs in order where nothing else decides. Whole numbers so nothing drifts.
  const lateCost = new Float64Array(F);
  for (const f of order) lateCost[f] = Math.round(LATE * (1 - (0.8 * rank[f]) / Math.max(1, order.length)));
  let late = 0;
  let moved = 0;

  const put = (f: number, s: number) => {
    const w = waveOf[s];
    slotOf[f] = s;
    slotFix[s] = f;
    waveGames[w] += 1;
    const a = home[f];
    const b = away[f];
    if (a >= 0) {
      teamAt[a * W + w] += 1;
      onCourt[a * C + courtOf[s]] += 1;
    }
    if (b >= 0) {
      teamAt[b * W + w] += 1;
      onCourt[b * C + courtOf[s]] += 1;
    }
    late += w * lateCost[f];
    if (prevSlot[f] !== -1 && prevSlot[f] !== s) moved += MOVED;
  };
  const lift = (f: number) => {
    const s = slotOf[f];
    const w = waveOf[s];
    slotOf[f] = -1;
    slotFix[s] = -1;
    waveGames[w] -= 1;
    const a = home[f];
    const b = away[f];
    if (a >= 0) {
      teamAt[a * W + w] -= 1;
      onCourt[a * C + courtOf[s]] -= 1;
    }
    if (b >= 0) {
      teamAt[b * W + w] -= 1;
      onCourt[b * C + courtOf[s]] -= 1;
    }
    late -= w * lateCost[f];
    if (prevSlot[f] !== -1 && prevSlot[f] !== s) moved -= MOVED;
  };

  const teamFree = (t: number, w: number) => {
    if (teamAt[t * W + w]) return false;
    const list = clash[w];
    for (let i = 0; i < list.length; i++) if (teamAt[t * W + list[i]]) return false;
    return true;
  };
  // Pinned games have been played (or are being played). `loose` marks a game that may go after
  // such a game although it should have come before it, see the rescue below.
  const played = input.map((f, i) => fixed[i] && pinned.has(f.id));
  const loose = new Uint8Array(F);
  // The hard rules for one game in one slot (the slot itself is known to be empty).
  const canPlace = (f: number, s: number) => {
    const w = waveOf[s];
    if (home[f] >= 0 && !teamFree(home[f], w)) return false;
    if (away[f] >= 0 && !teamFree(away[f], w)) return false;
    const need = deps[f];
    for (let i = 0; i < need.length; i++) {
      const at = slotOf[need[i]];
      if (at < 0 || wEnd[waveOf[at]] > wStart[w]) return false;
    }
    const feeds = rdeps[f];
    for (let i = 0; i < feeds.length; i++) {
      const at = slotOf[feeds[i]];
      if (at >= 0 && wEnd[w] > wStart[waveOf[at]] && !(loose[f] && played[feeds[i]])) return false;
    }
    return true;
  };

  for (let s = 0; s < S; s++) if (cells[s].holder >= 0) put(cells[s].holder, s);
  // Time that has already gone by is closed to every game that can still move.
  const from = opts.notBefore;
  if (from) {
    const at = toMinutes(from.starts);
    cells.forEach((c, s) => {
      if (slotFix[s] === -1 && (c.slot.day < from.day || (c.slot.day === from.day && c.at < at))) slotFix[s] = -2;
    });
  }
  // Slots the planner may use: everything not taken by a fixed game.
  const open: number[] = [];
  for (let s = 0; s < S; s++) if (slotFix[s] === -1) open.push(s);

  // ---- cost ----
  const tCost = new Float64Array(Math.max(1, T));
  const tWaitSum = new Float64Array(Math.max(1, T));
  const tWaitN = new Int32Array(Math.max(1, T));
  const tLong = new Float64Array(Math.max(1, T)); // longest wait in slots, -1 with fewer than two games in a day
  const tRun = new Int32Array(Math.max(1, T)); // most games in a row
  const buf = new Int32Array(Math.max(1, ...teamFix.map((l) => l.length)));

  // Everything about one team's day: rests, waits, how long it has to stay, which courts.
  const evalTeam = (t: number) => {
    const list = teamFix[t];
    let k = 0;
    for (let i = 0; i < list.length; i++) {
      const s = slotOf[list[i]];
      if (s < 0) continue;
      const w = waveOf[s];
      let j = k++;
      while (j > 0 && buf[j - 1] > w) {
        buf[j] = buf[j - 1];
        j--;
      }
      buf[j] = w;
    }
    let cost = 0;
    let waitSum = 0;
    let waitN = 0;
    let longest = -1;
    let run = 1;
    let top = k ? 1 : 0;
    let first = 0;
    for (let i = 1; i <= k; i++) {
      const a = buf[i - 1];
      if (i === k || wDay[buf[i]] !== wDay[a]) {
        cost += (SPAN * (wStart[a] - wStart[buf[first]])) / slotLen;
        first = i;
        run = 1;
        continue;
      }
      const b = buf[i];
      if (wStart[b] - wEnd[a] < match) {
        cost += B2B;
        run += 1;
        if (run >= 3) cost += THREE;
        if (run > top) top = run;
      } else run = 1;
      const wait = Math.max(0, (wStart[b] - wStart[a]) / slotLen - 1);
      waitSum += wait;
      waitN += 1;
      if (wait > longest) longest = wait;
    }
    if (C > 1 && k) {
      const mean = k / C;
      for (let c = 0; c < C; c++) {
        const d = onCourt[t * C + c] - mean;
        cost += COURT * d * d;
      }
    }
    tCost[t] = cost;
    tWaitSum[t] = waitSum;
    tWaitN[t] = waitN;
    tLong[t] = longest;
    tRun[t] = top;
  };

  const opens = new Int32Array(Math.max(1, T));
  const closes = new Int32Array(Math.max(1, T));
  const total = () => {
    let cost = 0;
    let waitSum = 0;
    let waitN = 0;
    let longSum = 0;
    let longN = 0;
    for (let t = 0; t < T; t++) {
      cost += tCost[t];
      waitSum += tWaitSum[t];
      waitN += tWaitN[t];
      if (tLong[t] >= 0) {
        longSum += tLong[t];
        longN += 1;
      }
    }
    if (longN) {
      const average = waitN ? waitSum / waitN : 0;
      const mean = longSum / longN;
      let spread = 0;
      for (let t = 0; t < T; t++) {
        if (tLong[t] < 0) continue;
        spread += (tLong[t] - mean) * (tLong[t] - mean);
        if (tLong[t] >= 2 && tLong[t] > 2 * average) cost += IDLE;
      }
      cost += (WAIT_VAR * spread) / longN;
    }
    // Who opens and who closes each day: a second time costs, a third costs more.
    if (dayFirst.length > 1) {
      opens.fill(0);
      closes.fill(0);
      for (let d = 0; d < dayFirst.length; d++) {
        let a = dayFirst[d];
        let b = dayLast[d];
        while (a <= b && !waveGames[a]) a++;
        while (b > a && !waveGames[b]) b--;
        if (a > b) continue;
        for (let side = 0; side < 2; side++) {
          if (side && b === a) break;
          const w = side ? b : a;
          const tally = side ? closes : opens;
          for (let s = waveFirst[w]; s < waveFirst[w + 1]; s++) {
            const f = slotFix[s];
            if (f < 0) continue;
            if (home[f] >= 0) cost += EDGE * tally[home[f]]++;
            if (away[f] >= 0) cost += EDGE * tally[away[f]]++;
          }
        }
      }
    }
    // The winner of a semi final straight into the final is back to back for certain.
    for (let i = 0; i < links.length; i += 2) {
      const a = slotOf[links[i]];
      const b = slotOf[links[i + 1]];
      if (a < 0 || b < 0) continue;
      const rest = wStart[waveOf[b]] - wEnd[waveOf[a]];
      if (rest >= 0 && rest < match) cost += B2B;
    }
    return cost + late / 1e6 + moved;
  };
  const evalAll = () => {
    for (let t = 0; t < T; t++) evalTeam(t);
    return total();
  };

  // ---- greedy fill ----
  // What a game would cost a team's rest if it went into this wave.
  const restAt = (t: number, w: number) => {
    let p = 0;
    let prior = false;
    let next = false;
    for (const x of before[w]) {
      if (!teamAt[t * W + x]) continue;
      prior = true;
      if (before[x].some((y) => teamAt[t * W + y])) p += THREE;
      break;
    }
    for (const x of after[w]) {
      if (!teamAt[t * W + x]) continue;
      next = true;
      if (after[x].some((y) => teamAt[t * W + y])) p += THREE;
      break;
    }
    if (prior) p += B2B;
    if (next) p += B2B;
    if (prior && next) p += THREE;
    return p;
  };

  // Slots in time order, each taking the game that suits it best.
  //  spread: a slot is left empty rather than making a team play twice in a row, while there is room
  //  compact: every slot is filled if any game can go there
  //  order: the next game in playing order that can go there. The rounds of a round robin are
  //         complete sets, so this packs the courts as tightly as they can be packed.
  const fill = (mode: 'spread' | 'compact' | 'order') => {
    const pending = order.filter((f) => slotOf[f] < 0);
    const left = new Int32Array(Math.max(1, T));
    const lastWave = new Int32Array(Math.max(1, T)).fill(-9);
    for (const f of pending) {
      if (home[f] >= 0) left[home[f]] += 1;
      if (away[f] >= 0) left[away[f]] += 1;
    }
    let free = 0;
    for (let s = 0; s < S; s++) if (slotFix[s] === -1) free += 1;
    for (let s = 0; s < S && pending.length; s++) {
      if (slotFix[s] !== -1) continue;
      free -= 1;
      const w = waveOf[s];
      let best = -1;
      let bestScore = Infinity;
      let bestRest = 0;
      for (let k = 0; k < pending.length; k++) {
        const f = pending[k];
        if (!canPlace(f, s)) continue;
        if (mode === 'order') {
          best = k;
          break;
        }
        let rest = 0;
        let score = k * 0.01; // playing order breaks ties
        for (const t of [home[f], away[f]]) {
          if (t < 0) continue;
          rest += restAt(t, w);
          // Teams with the most still to play, and the ones who have waited longest, go first.
          score += 2 * onCourt[t * C + courtOf[s]] - left[t] - Math.min(8, w - lastWave[t]);
        }
        // Whoever comes through the game before plays this one too.
        for (const j of feeders[f]) {
          const gapTo = slotOf[j] < 0 ? -1 : wStart[w] - wEnd[waveOf[slotOf[j]]];
          if (gapTo >= 0 && gapTo < match) rest += B2B;
        }
        if (prevSlot[f] >= 0) score += prevSlot[f] === s ? -MOVED : MOVED;
        score += rest * 10;
        if (score < bestScore) {
          best = k;
          bestScore = score;
          bestRest = rest;
        }
      }
      if (best < 0) continue;
      if (mode === 'spread' && bestRest >= B2B && free >= pending.length) continue;
      const f = pending[best];
      pending.splice(best, 1);
      put(f, s);
      for (const t of [home[f], away[f]]) {
        if (t < 0) continue;
        left[t] -= 1;
        lastWave[t] = w;
      }
    }
  };

  // Re-plan: first put every game back where it was, if the rules still allow it.
  const keep = () => {
    const list = order.filter((f) => prevSlot[f] >= 0 && slotOf[f] < 0).sort((a, b) => prevSlot[a] - prevSlot[b]);
    for (const f of list) if (slotFix[prevSlot[f]] === -1 && canPlace(f, prevSlot[f])) put(f, prevSlot[f]);
  };
  const reset = () => {
    for (const f of order) if (!fixed[f] && slotOf[f] >= 0) lift(f);
  };
  const missing = () => order.reduce((k, f) => k + (slotOf[f] < 0 ? 1 : 0), 0);

  // A few starting points. Fewest games left out wins, then the lowest cost.
  type Start = [kept: boolean, mode: 'spread' | 'compact' | 'order'];
  const starts: Start[] = quick ? [[false, 'compact'], [false, 'order'], [false, 'spread']] : [[false, 'spread'], [false, 'compact'], [false, 'order']];
  if (hasPrev) starts.unshift([true, 'compact']);
  let bestStart: Int32Array | null = null;
  let bestMiss = Infinity;
  let bestCost = Infinity;
  for (const [kept, mode] of starts) {
    reset();
    if (kept) keep();
    fill(mode);
    const miss = missing();
    const cost = quick ? 0 : evalAll();
    if (miss < bestMiss || (miss === bestMiss && cost < bestCost)) {
      bestStart = slotOf.slice();
      bestMiss = miss;
      bestCost = cost;
    }
    if (quick && miss === 0) break;
  }
  if (bestStart) {
    reset();
    for (const f of order) if (!fixed[f] && bestStart[f] >= 0) put(f, bestStart[f]);
  }

  // Rescue: a game still to be played although a game that depends on it is already over (a
  // league game left behind when the semi finals went ahead) has no legal place left. Better on
  // the plan after all than missing from it.
  const stuck = order.filter((f) => slotOf[f] < 0 && rdeps[f].some((r) => played[r]));
  if (stuck.length) {
    for (const f of stuck) loose[f] = 1;
    fill('compact');
  }

  if (quick) {
    return { fixtures: [], unplaced: order.filter((f) => slotOf[f] < 0).map((f) => input[f].id), cost: 0, notes: [] };
  }

  // ---- hill climb ----
  // Swap two games or move one into an empty slot. Keep it when no hard rule breaks and the
  // total cost goes down. Seeded, so the same input always ends in the same schedule.
  let cost = evalAll();
  const movable = order.filter((f) => !fixed[f] && slotOf[f] >= 0);
  if (movable.length && open.length > 1) {
    const rand = rng(settings.seed);
    const rounds = Math.min(80000, Math.max(5000, movable.length * 600));
    const who = new Int32Array(4);
    const saved = new Float64Array(20);
    for (let it = 0; it < rounds; it++) {
      const f = movable[Math.floor(rand() * movable.length)];
      const s1 = slotOf[f];
      const s2 = open[Math.floor(rand() * open.length)];
      if (s1 === s2) continue;
      const g = slotFix[s2];
      lift(f);
      if (g >= 0) lift(g);
      let ok = canPlace(f, s2);
      if (ok) {
        put(f, s2);
        if (g >= 0) {
          ok = canPlace(g, s1);
          if (ok) put(g, s1);
          else lift(f);
        }
      }
      if (!ok) {
        put(f, s1);
        if (g >= 0) put(g, s2);
        continue;
      }
      who[0] = home[f];
      who[1] = away[f];
      who[2] = g >= 0 ? home[g] : -1;
      who[3] = g >= 0 ? away[g] : -1;
      for (let i = 0; i < 4; i++) {
        const t = who[i];
        if (t < 0) continue;
        saved[i * 5] = tCost[t];
        saved[i * 5 + 1] = tWaitSum[t];
        saved[i * 5 + 2] = tWaitN[t];
        saved[i * 5 + 3] = tLong[t];
        saved[i * 5 + 4] = tRun[t];
      }
      for (let i = 0; i < 4; i++) if (who[i] >= 0) evalTeam(who[i]);
      const next = total();
      if (next < cost - 1e-9) {
        cost = next;
        continue;
      }
      lift(f);
      if (g >= 0) lift(g);
      put(f, s1);
      if (g >= 0) put(g, s2);
      for (let i = 0; i < 4; i++) {
        const t = who[i];
        if (t < 0) continue;
        tCost[t] = saved[i * 5];
        tWaitSum[t] = saved[i * 5 + 1];
        tWaitN[t] = saved[i * 5 + 2];
        tLong[t] = saved[i * 5 + 3];
        tRun[t] = saved[i * 5 + 4];
      }
    }
    cost = evalAll();
  }

  // ---- duty ----
  // A resting team umpires each game: shared evenly, never a team that is playing at that time,
  // and where there is a choice not one that plays straight after.
  const duty: (TeamRef | null)[] = input.map((f, i) => (live[i] ? null : f.duty));
  if (settings.duty) {
    const done = new Int32Array(Math.max(1, T));
    const dutyAt = new Uint8Array(Math.max(1, T * W));
    const unknownIn = (w: number) => {
      for (let s = waveFirst[w]; s < waveFirst[w + 1]; s++) if (slotFix[s] >= 0 && (home[slotFix[s]] < 0 || away[slotFix[s]] < 0)) return true;
      return false;
    };
    for (let s = 0; s < S; s++) {
      const f = slotFix[s];
      if (f < 0 || home[f] < 0 || away[f] < 0) continue;
      const w = waveOf[s];
      const around = [w, ...clash[w]];
      // If a game at the same time has a place nobody has earned yet, any team could be in it.
      if (around.some(unknownIn)) continue;
      const earlier = prevById.get(input[f].id)?.duty ?? input[f].duty;
      const had = earlier && earlier.kind === 'team' ? teamIndex.get(earlier.id) ?? -1 : -1;
      let best = -1;
      let bestScore = Infinity;
      for (let t = 0; t < T; t++) {
        if (!teamFree(t, w) || around.some((x) => dutyAt[t * W + x])) continue;
        let here = false;
        for (let x = dayFirst[wDay[w]]; x <= dayLast[wDay[w]] && !here; x++) here = teamAt[t * W + x] > 0;
        let score = done[t] * 10 + (here ? 0 : 6);
        if (after[w].some((x) => teamAt[t * W + x])) score += 3;
        if (before[w].some((x) => teamAt[t * W + x])) score -= 1;
        // A game that did not move keeps its umpires where that still works.
        if (t === had) score -= fixed[f] ? 1000 : 4;
        if (score < bestScore) {
          best = t;
          bestScore = score;
        }
      }
      if (best < 0) continue;
      duty[f] = { kind: 'team', id: teamIds[best] };
      done[best] += 1;
      dutyAt[best * W + w] = 1;
    }
  }

  // ---- result ----
  const out = input.map((f, i): Fixture => {
    if (!live[i]) return { ...f };
    const place: Place | null = fixedAt[i] ?? (slotOf[i] >= 0 ? cells[slotOf[i]].slot : null);
    return { ...f, venue: place ? place.venue : null, court: place ? place.court : null, day: place ? place.day : null, starts: place ? place.starts : null, duty: duty[i] };
  });
  // Game numbers follow the clock, then the court. Games without a place keep their order at the end.
  const timed = (f: Fixture) => f.day != null && f.starts != null;
  const sorted = input.map((_, i) => i).sort((a, b) => {
    const fa = out[a];
    const fb = out[b];
    if (timed(fa) !== timed(fb)) return timed(fa) ? -1 : 1;
    if (timed(fa) && timed(fb)) {
      if (fa.day !== fb.day) return (fa.day ?? '') < (fb.day ?? '') ? -1 : 1;
      const at = toMinutes(fa.starts ?? '') - toMinutes(fb.starts ?? '');
      if (at) return at;
      if (fa.venue !== fb.venue) return (fa.venue ?? '') < (fb.venue ?? '') ? -1 : 1;
      if (fa.court !== fb.court) return (fa.court ?? 0) - (fb.court ?? 0);
    }
    return input[a].seq - input[b].seq || a - b;
  });
  sorted.forEach((i, k) => {
    out[i].seq = k + 1;
  });
  const unplaced = order.filter((f) => slotOf[f] < 0).map((f) => input[f].id);

  const notes: string[] = [];
  if (unplaced.length) {
    if (!settings.sessions.length) notes.push('There is no session to play in yet. Add a day, a hall and a time.');
    else notes.push(`${unplaced.length === 1 ? '1 game does' : `${unplaced.length} games do`} not fit. Add time or a court.`);
  }
  let twos = 0;
  let threes = 0;
  for (let t = 0; t < T; t++) {
    if (tRun[t] >= 3) threes += 1;
    else if (tRun[t] === 2) twos += 1;
  }
  if (threes) notes.push(`${plural(threes, 'team')} ${threes === 1 ? 'plays' : 'play'} three games in a row. More time or another court would give ${threes === 1 ? 'it' : 'them'} a rest.`);
  if (T === 3 && C === 1 && twos + threes === 3) notes.push('With 3 teams on one court every team plays two games in a row at some point.');
  else if (T > 2 && twos) notes.push(`${plural(twos, 'team')} ${twos === 1 ? 'plays' : 'play'} two games in a row at some point.`);
  // Empty rounds in the middle of a day are there on purpose.
  let breaks = 0;
  for (let d = 0; d < dayFirst.length; d++) {
    let a = dayFirst[d];
    let b = dayLast[d];
    while (a <= b && !waveGames[a]) a++;
    while (b > a && !waveGames[b]) b--;
    for (let w = a + 1; w < b; w++) if (!waveGames[w]) breaks += 1;
  }
  if (breaks) notes.push(`The plan leaves ${plural(breaks, 'break')} so that teams can rest between games.`);
  const overdue = stuck.filter((f) => slotOf[f] >= 0).length;
  if (overdue) notes.push(`${plural(overdue, 'game')} that should have been played earlier ${overdue === 1 ? 'is' : 'are'} planned after the games that were meant to follow.`);
  if (offGrid) notes.push(`${plural(offGrid, 'fixed game')} ${offGrid === 1 ? 'is' : 'are'} outside the sessions.`);
  if (hasPrev) {
    const shifted = order.filter((f) => prevSlot[f] !== -1 && slotOf[f] >= 0 && slotOf[f] !== prevSlot[f]).length;
    if (shifted) notes.push(`${plural(shifted, 'game')} moved to a new time or court.`);
  }

  return { fixtures: sorted.map((i) => out[i]), unplaced, cost: Math.round(cost * 1000) / 1000, notes };
}

export function schedule(fixtures: Fixture[], settings: Settings, opts: ScheduleOptions = {}): Placed {
  return plan(fixtures, settings, opts, false);
}

// ---------------------------------------------------------------------------------------------
// Does it fit
// ---------------------------------------------------------------------------------------------

export type Suggestion = { kind: 'shorter' | 'oneLeg' | 'groups' | 'fewerFinals' | 'court' | 'time'; text: string; settings?: Partial<Settings> };
export type Fit = { games: number; slots: number; fits: boolean; suggestions: Suggestion[] };

export function checkFit(teams: Entrant[], settings: Settings): Fit {
  const n = teams.length;
  // The real planner decides, so a knockout round only counts once the round before it is over.
  const probe = (s: Settings) => {
    let k = 0;
    const fixtures = buildFixtures('fit', teams, s.format, () => `fit${++k}`);
    return { games: fixtures.length, miss: plan(fixtures, s, {}, true).unplaced.length };
  };
  const now = probe(settings);
  const fit: Fit = { games: now.games, slots: slotsOf(settings).length, fits: now.miss === 0, suggestions: [] };
  if (fit.fits) return fit;

  // Every suggestion is tried before it is offered.
  const offer = (kind: Suggestion['kind'], text: string, patch: Partial<Settings>) => {
    if (probe({ ...settings, ...patch }).miss !== 0) return false;
    fit.suggestions.push({ kind, text, settings: patch });
    return true;
  };
  const f = resolveFormat(n, settings.format);
  const match = Math.floor(settings.matchMinutes) || 0;
  const gap = Math.max(0, Math.floor(settings.gapMinutes) || 0);

  // Shorter games, but never less than half of what was asked for.
  for (let m = Math.ceil(match / 5) * 5 - 5; m >= Math.max(10, match / 2); m -= 5) {
    if (offer('shorter', `Play ${m} minute games instead of ${match}`, { matchMinutes: m })) break;
  }

  if (f.kind !== 'knockout') {
    for (let legs = f.legs - 1; legs >= 1; legs--) {
      if (f.kind === 'series' && legs % 2 === 0) continue;
      const text = f.kind === 'series' ? (legs === 1 ? `Play one game instead of ${f.legs}` : `Play a best of ${legs} instead of ${f.legs} games`) : `Play everyone ${times(legs)} instead of ${times(f.legs)}`;
      if (offer('oneLeg', text, { format: { ...f, legs } })) break;
    }
  }

  if (f.kind === 'roundRobin' || f.kind === 'groups') {
    for (const groups of [2, 4]) {
      if (groups <= f.groups || n < groups * 3) continue;
      const next = resolveFormat(n, { ...f, kind: 'groups', groups, finals: f.finals === 'none' ? 'final' : f.finals });
      if (offer('groups', groups === 2 ? 'Use two groups' : 'Use four groups', { format: next })) break;
    }
  }

  const smaller: [Format, string][] = [];
  if (f.thirdPlace) smaller.push([{ ...f, thirdPlace: false }, 'Skip the third place game']);
  if (f.finals === 'quarters') smaller.push([{ ...f, finals: 'semis' }, 'Start the finals with the semi finals']);
  if (f.finals === 'quarters' || f.finals === 'semis' || f.finals === 'page') smaller.push([{ ...f, finals: 'final', thirdPlace: false }, 'Go straight to a final']);
  for (const [format, text] of smaller) {
    if (offer('fewerFinals', text, { format: resolveFormat(n, format) })) break;
  }

  if (settings.sessions.length) {
    const single = settings.sessions.every((s) => s.courts === 1);
    offer('court', single ? 'Add a second court' : 'Add one more court', { sessions: settings.sessions.map((s) => ({ ...s, courts: s.courts + 1 })) });

    // More time at the end of the last session, one more round of games at a time.
    let lastIndex = 0;
    settings.sessions.forEach((s, i) => {
      const l = settings.sessions[lastIndex];
      if (s.day > l.day || (s.day === l.day && toMinutes(s.end) > toMinutes(l.end))) lastIndex = i;
    });
    const session = settings.sessions[lastIndex];
    const start = toMinutes(session.start);
    const end = toMinutes(session.end);
    const step = match + gap;
    if (match > 0 && session.courts >= 1) {
      const have = end - start >= match ? Math.floor((end - start - match) / step) + 1 : 0;
      for (let k = Math.max(1, Math.ceil(now.miss / session.courts) - 1), tries = 0; tries < 40; k++, tries++) {
        const extra = Math.ceil((start + (have + k - 1) * step + match - end) / 5) * 5;
        if (end + extra > 23 * 60 + 55) break;
        const sessions = settings.sessions.map((s, i) => (i === lastIndex ? { ...s, end: toClock(end + extra) } : s));
        if (offer('time', `Add ${extra} more minutes`, { sessions })) break;
      }
    }
  }
  return fit;
}
