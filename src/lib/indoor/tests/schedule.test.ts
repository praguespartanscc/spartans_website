import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { Entrant, Placed } from '../schedule.ts';
import { assignGroups, buildFixtures, checkFit, formatChoices, gameCount, resolveFormat, rng, schedule, slotsOf, suggestFormat } from '../schedule.ts';
import type { Finals, Fixture, Format, Session, Settings, TeamRef } from '../tournament.ts';
import { isKnockout, toMinutes } from '../tournament.ts';

// ---- helpers ----

const entrants = (n: number): Entrant[] => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, seed: i + 1 }));
const fmt = (kind: Format['kind'], legs = 1, groups = 1, finals: Finals = 'none', thirdPlace = false): Format => ({ kind, legs, groups, finals, thirdPlace });
const session = (id: string, day: string, courts: number, start: string, end: string, venue = 'Hall'): Session => ({ id, day, venue, courts, start, end });
const settingsOf = (format: Format, sessions: Session[], extra: Partial<Settings> = {}): Settings => ({
  format, sessions, matchMinutes: 25, gapMinutes: 5, points: { win: 4, tie: 2, loss: 0, noResult: 2 }, duty: false, seed: 11, ...extra,
});
const build = (n: number, format: Format): Fixture[] => {
  let k = 0;
  return buildFixtures('cup', entrants(n), format, () => `f${++k}`);
};
const team = (id: string): TeamRef => ({ kind: 'team', id });
const idsOf = (f: Fixture): string[] => [f.home, f.away].flatMap((r) => (r.kind === 'team' ? [r.id] : []));
const byLabel = (fixtures: Fixture[], label: string): Fixture => {
  const f = fixtures.find((x) => x.label === label);
  assert.ok(f, `no fixture called ${label}`);
  return f;
};
const DAYS = ['2026-12-05', '2026-12-06', '2026-12-12'];
const clock = (f: Fixture) => DAYS.indexOf(f.day ?? '') * 10000 + toMinutes(f.starts ?? '');
const sameMoment = (a: Fixture, b: Fixture, minutes: number) => a.day === b.day && clock(a) < clock(b) + minutes && clock(b) < clock(a) + minutes;

// The hard rules, checked from the outside on a finished schedule.
function checkRules(placed: Placed, settings: Settings) {
  const games = placed.fixtures.filter((f) => f.starts != null);
  const len = settings.matchMinutes;
  for (const f of games) {
    assert.ok(f.day != null && f.venue != null && f.court != null, 'a placed game has a day, a hall and a court');
  }
  for (let i = 0; i < games.length; i++) {
    for (let j = i + 1; j < games.length; j++) {
      const a = games[i];
      const b = games[j];
      if (!sameMoment(a, b, len)) continue;
      assert.ok(a.venue !== b.venue || a.court !== b.court, `one court, two games at ${a.day} ${a.starts}`);
      for (const id of idsOf(a)) assert.ok(!idsOf(b).includes(id), `${id} is in two games at ${a.day} ${a.starts}`);
    }
  }
  const byId = new Map(placed.fixtures.map((f) => [f.id, f]));
  const over = (f: Fixture | undefined) => (f && f.starts != null ? clock(f) + len : Infinity);
  for (const f of games) {
    for (const ref of [f.home, f.away]) {
      let sources: Fixture[] = [];
      if (ref.kind === 'winner' || ref.kind === 'loser') sources = [byId.get(ref.fixture) as Fixture];
      if (ref.kind === 'tablePos') sources = placed.fixtures.filter((x) => x.stage === 'league');
      if (ref.kind === 'groupPos') sources = placed.fixtures.filter((x) => x.stage === 'group' && x.grp === ref.group);
      for (const s of sources) assert.ok(over(s) <= clock(f), `${f.label} starts before ${s?.label} is over`);
    }
  }
  const stage = games.filter((f) => !isKnockout(f.stage));
  const knockout = games.filter((f) => isKnockout(f.stage));
  if (stage.length && knockout.length) {
    assert.ok(Math.max(...stage.map((f) => clock(f) + len)) <= Math.min(...knockout.map(clock)), 'a knockout game starts before the league is over');
  }
  // Game numbers run 1..N in playing order, games without a place last.
  assert.deepEqual(placed.fixtures.map((f) => f.seq), placed.fixtures.map((_, i) => i + 1));
  for (let i = 1; i < placed.fixtures.length; i++) {
    const a = placed.fixtures[i - 1];
    const b = placed.fixtures[i];
    if (a.starts == null) assert.equal(b.starts, null);
    else if (b.starts != null) assert.ok(clock(a) <= clock(b));
  }
}

// The most games any team plays in a row, and how many back to back pairs there are in all.
function rests(fixtures: Fixture[], settings: Settings, only: (f: Fixture) => boolean = () => true) {
  const mine = new Map<string, number[]>();
  for (const f of fixtures) {
    if (f.starts == null || !only(f)) continue;
    for (const id of idsOf(f)) mine.set(id, [...(mine.get(id) ?? []), clock(f)]);
  }
  let longest = 0;
  let pairs = 0;
  for (const list of mine.values()) {
    list.sort((a, b) => a - b);
    let run = 1;
    longest = Math.max(longest, 1);
    for (let i = 1; i < list.length; i++) {
      if (list[i] - (list[i - 1] + settings.matchMinutes) < settings.matchMinutes) {
        run += 1;
        pairs += 1;
      } else run = 1;
      longest = Math.max(longest, run);
    }
  }
  return { longest, pairs };
}

const placeOf = (f: Fixture) => `${f.day} ${f.starts} ${f.venue} ${f.court}`;
const cleanCopy = (text: string) => !/[–—;]/.test(text);

// ---- rng and formats ----

test('rng gives the same numbers for the same seed', () => {
  const a = rng(42);
  const b = rng(42);
  const c = rng(43);
  const first = [a(), a(), a(), a()];
  assert.deepEqual(first, [b(), b(), b(), b()]);
  assert.notDeepEqual(first, [c(), c(), c(), c()]);
  for (const x of first) assert.ok(x >= 0 && x < 1);
});

test('the suggested format grows with the number of teams', () => {
  assert.deepEqual(suggestFormat(2), fmt('series', 3, 1, 'none'));
  assert.deepEqual(suggestFormat(3), fmt('roundRobin', 2, 1, 'final'));
  assert.deepEqual(suggestFormat(5), fmt('roundRobin', 1, 1, 'final'));
  assert.deepEqual(suggestFormat(8), fmt('groups', 1, 2, 'semis'));
  assert.deepEqual(suggestFormat(14), fmt('groups', 1, 4, 'quarters'));
});

test('format choices start with the suggestion and only offer what is possible', () => {
  for (let n = 2; n <= 16; n++) {
    const choices = formatChoices(n);
    assert.deepEqual(choices[0].format, suggestFormat(n), `${n} teams`);
    for (const c of choices) {
      assert.deepEqual(resolveFormat(n, c.format), c.format, `${n} teams: ${c.title}`);
      assert.equal(c.games, build(n, c.format).length);
      assert.ok(cleanCopy(c.title) && cleanCopy(c.detail), c.title);
      if (c.format.kind === 'series') assert.equal(n, 2);
      if (c.format.kind === 'groups') assert.ok(Math.floor(n / c.format.groups) >= 3);
      if (c.format.kind === 'knockout') assert.ok(n >= 3);
    }
    assert.equal(new Set(choices.map((c) => c.title)).size, choices.length, `${n} teams: every title is different`);
  }
  assert.deepEqual(formatChoices(1), []);
  assert.ok(!formatChoices(5).some((c) => c.format.finals === 'quarters' || c.format.kind === 'groups'));
  assert.ok(formatChoices(3).every((c) => c.format.finals !== 'semis' && c.format.finals !== 'page'));
});

// ---- round robin ----

test('a round robin has every pair exactly once per leg, fairly listed', () => {
  for (let n = 2; n <= 16; n++) {
    for (const legs of [1, 2]) {
      const fixtures = build(n, fmt('roundRobin', legs));
      const met = new Map<string, number>();
      const homes = new Map<string, number>();
      const games = new Map<string, number>();
      for (const f of fixtures) {
        assert.equal(f.stage, 'league');
        assert.equal(f.label, `Round ${f.round}`);
        const [h, a] = idsOf(f);
        assert.notEqual(h, a);
        const pair = [h, a].sort().join(' v ');
        met.set(pair, (met.get(pair) ?? 0) + 1);
        homes.set(h, (homes.get(h) ?? 0) + 1);
        games.set(h, (games.get(h) ?? 0) + 1);
        games.set(a, (games.get(a) ?? 0) + 1);
      }
      assert.equal(met.size, (n * (n - 1)) / 2, `${n} teams, ${legs} legs`);
      for (const count of met.values()) assert.equal(count, legs);
      for (const t of entrants(n)) {
        assert.equal(games.get(t.id), (n - 1) * legs, 'everyone plays the same number of games');
        const home = homes.get(t.id) ?? 0;
        const awayGames = (n - 1) * legs - home;
        assert.ok(Math.abs(home - awayGames) <= 1, `${t.id} is listed first ${home} times of ${(n - 1) * legs}`);
      }
      // Nobody plays twice in a round, and the rounds carry on across the legs.
      const rounds = new Map<number, string[]>();
      for (const f of fixtures) rounds.set(f.round, [...(rounds.get(f.round) ?? []), ...idsOf(f)]);
      assert.equal(rounds.size, (n % 2 ? n : n - 1) * legs);
      for (const ids of rounds.values()) assert.equal(new Set(ids).size, ids.length);
      assert.deepEqual(fixtures.map((f) => f.seq), fixtures.map((_, i) => i + 1));
    }
  }
});

test('new fixtures are not placed yet', () => {
  const f = build(4, fmt('roundRobin'))[0];
  assert.deepEqual(
    { venue: f.venue, court: f.court, day: f.day, starts: f.starts, status: f.status, winner_id: f.winner_id, match_id: f.match_id, voided: f.voided, locked: f.locked, note: f.note, duty: f.duty },
    { venue: null, court: null, day: null, starts: null, status: 'scheduled', winner_id: null, match_id: null, voided: [], locked: false, note: null, duty: null },
  );
  assert.equal(f.tournament_id, 'cup');
  assert.equal(f.id, 'f1');
});

test('a series swaps who is listed first each game', () => {
  const fixtures = build(2, fmt('series', 3));
  assert.deepEqual(fixtures.map((f) => f.label), ['Game 1', 'Game 2', 'Game 3']);
  assert.deepEqual(fixtures.map((f) => [f.stage, ...idsOf(f)]), [['series', 't1', 't2'], ['series', 't2', 't1'], ['series', 't1', 't2']]);
});

// ---- groups ----

test('groups are snake seeded', () => {
  const two = assignGroups(entrants(8), 2);
  const inGroup = (map: Record<string, string>, g: string) => Object.keys(map).filter((id) => map[id] === g).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  assert.deepEqual(inGroup(two, 'A'), ['t1', 't4', 't5', 't8']);
  assert.deepEqual(inGroup(two, 'B'), ['t2', 't3', 't6', 't7']);
  const four = assignGroups(entrants(16), 4);
  assert.deepEqual(inGroup(four, 'A'), ['t1', 't8', 't9', 't16']);
  assert.deepEqual(inGroup(four, 'B'), ['t2', 't7', 't10', 't15']);
  assert.deepEqual(inGroup(four, 'C'), ['t3', 't6', 't11', 't14']);
  assert.deepEqual(inGroup(four, 'D'), ['t4', 't5', 't12', 't13']);
  // Seeds decide, not the order the teams arrive in.
  assert.deepEqual(assignGroups([...entrants(8)].reverse(), 2), two);
});

test('group games stay inside the group and the groups take turns', () => {
  const fixtures = build(8, fmt('groups', 1, 2, 'semis'));
  const groups = assignGroups(entrants(8), 2);
  const stage = fixtures.filter((f) => f.stage === 'group');
  assert.equal(stage.length, 12);
  for (const f of stage) {
    assert.equal(f.label, `Group ${f.grp}`);
    for (const id of idsOf(f)) assert.equal(groups[id], f.grp);
  }
  assert.deepEqual(stage.map((f) => `${f.grp}${f.round}`), ['A1', 'A1', 'B1', 'B1', 'A2', 'A2', 'B2', 'B2', 'A3', 'A3', 'B3', 'B3']);
});

// ---- finals ----

test('finals after two groups cross over, and the final takes the two winners', () => {
  const fixtures = build(8, fmt('groups', 1, 2, 'semis', true));
  const sf1 = byLabel(fixtures, 'Semi final 1');
  const sf2 = byLabel(fixtures, 'Semi final 2');
  const third = byLabel(fixtures, 'Third place');
  const final = byLabel(fixtures, 'Final');
  assert.deepEqual([sf1.home, sf1.away], [{ kind: 'groupPos', group: 'A', pos: 1 }, { kind: 'groupPos', group: 'B', pos: 2 }]);
  assert.deepEqual([sf2.home, sf2.away], [{ kind: 'groupPos', group: 'B', pos: 1 }, { kind: 'groupPos', group: 'A', pos: 2 }]);
  assert.deepEqual([final.home, final.away], [{ kind: 'winner', fixture: sf1.id }, { kind: 'winner', fixture: sf2.id }]);
  assert.deepEqual([third.home, third.away], [{ kind: 'loser', fixture: sf1.id }, { kind: 'loser', fixture: sf2.id }]);
  assert.deepEqual([sf1.stage, sf2.stage, third.stage, final.stage], ['sf', 'sf', 'third', 'final']);
  assert.ok(third.seq < final.seq && sf2.seq < third.seq);
  assert.equal(final.seq, fixtures.length);
});

test('league finals go by table place', () => {
  const pos = (p: number): TeamRef => ({ kind: 'tablePos', pos: p });
  const semis = build(6, fmt('roundRobin', 1, 1, 'semis'));
  assert.deepEqual([byLabel(semis, 'Semi final 1').home, byLabel(semis, 'Semi final 1').away], [pos(1), pos(4)]);
  assert.deepEqual([byLabel(semis, 'Semi final 2').home, byLabel(semis, 'Semi final 2').away], [pos(2), pos(3)]);
  const final = byLabel(build(5, fmt('roundRobin', 1, 1, 'final')), 'Final');
  assert.deepEqual([final.home, final.away], [pos(1), pos(2)]);
  const quarters = build(8, fmt('roundRobin', 1, 1, 'quarters')).filter((f) => f.stage === 'qf');
  assert.deepEqual(quarters.map((f) => [f.home, f.away]), [[pos(1), pos(8)], [pos(4), pos(5)], [pos(2), pos(7)], [pos(3), pos(6)]]);
  assert.deepEqual(quarters.map((f) => f.label), ['Quarter final 1', 'Quarter final 2', 'Quarter final 3', 'Quarter final 4']);
});

test('quarter finals after groups, and four group winners', () => {
  const g = (group: string, pos: number): TeamRef => ({ kind: 'groupPos', group, pos });
  const two = build(8, fmt('groups', 1, 2, 'quarters'));
  assert.deepEqual(two.filter((f) => f.stage === 'qf').map((f) => [f.home, f.away]), [[g('A', 1), g('B', 4)], [g('B', 2), g('A', 3)], [g('B', 1), g('A', 4)], [g('A', 2), g('B', 3)]]);
  const four = build(16, fmt('groups', 1, 4, 'quarters'));
  const qf = four.filter((f) => f.stage === 'qf');
  assert.deepEqual(qf.map((f) => [f.home, f.away]), [[g('A', 1), g('B', 2)], [g('C', 1), g('D', 2)], [g('B', 1), g('A', 2)], [g('D', 1), g('C', 2)]]);
  const sf = four.filter((f) => f.stage === 'sf');
  assert.deepEqual(sf.map((f) => [f.home, f.away]), [
    [{ kind: 'winner', fixture: qf[0].id }, { kind: 'winner', fixture: qf[1].id }],
    [{ kind: 'winner', fixture: qf[2].id }, { kind: 'winner', fixture: qf[3].id }],
  ]);
  const winnersSemis = build(12, fmt('groups', 1, 4, 'semis')).filter((f) => f.stage === 'sf');
  assert.deepEqual(winnersSemis.map((f) => [f.home, f.away]), [[g('A', 1), g('D', 1)], [g('B', 1), g('C', 1)]]);
  // A plain final with four groups still needs semi finals between the winners.
  const winnersFinal = build(12, fmt('groups', 1, 4, 'final')).filter((f) => f.stage === 'sf');
  assert.deepEqual(winnersFinal.map((f) => [f.home, f.away]), [[g('A', 1), g('B', 1)], [g('C', 1), g('D', 1)]]);
  const onlyFinal = byLabel(build(8, fmt('groups', 1, 2, 'final')), 'Final');
  assert.deepEqual([onlyFinal.home, onlyFinal.away], [g('A', 1), g('B', 1)]);
});

test('the page playoff gives the top two a second chance', () => {
  const fixtures = build(6, fmt('roundRobin', 1, 1, 'page'));
  const q1 = byLabel(fixtures, 'Qualifier 1');
  const elim = byLabel(fixtures, 'Eliminator');
  const q2 = byLabel(fixtures, 'Qualifier 2');
  const final = byLabel(fixtures, 'Final');
  assert.deepEqual([q1.stage, elim.stage, q2.stage, final.stage], ['q1', 'elim', 'q2', 'final']);
  assert.deepEqual([q1.home, q1.away], [{ kind: 'tablePos', pos: 1 }, { kind: 'tablePos', pos: 2 }]);
  assert.deepEqual([elim.home, elim.away], [{ kind: 'tablePos', pos: 3 }, { kind: 'tablePos', pos: 4 }]);
  assert.deepEqual([q2.home, q2.away], [{ kind: 'loser', fixture: q1.id }, { kind: 'winner', fixture: elim.id }]);
  assert.deepEqual([final.home, final.away], [{ kind: 'winner', fixture: q1.id }, { kind: 'winner', fixture: q2.id }]);
  assert.deepEqual([q1.seq, elim.seq, q2.seq, final.seq], [16, 17, 18, 19]);
});

test('finals that are too big for the field fall back to the largest that fits', () => {
  assert.equal(resolveFormat(5, fmt('roundRobin', 1, 1, 'quarters')).finals, 'semis');
  assert.equal(resolveFormat(3, fmt('roundRobin', 1, 1, 'semis')).finals, 'final');
  assert.equal(resolveFormat(3, fmt('roundRobin', 1, 1, 'page')).finals, 'final');
  assert.equal(resolveFormat(7, fmt('groups', 1, 2, 'quarters')).finals, 'semis');
  assert.equal(resolveFormat(8, fmt('groups', 1, 2, 'page')).finals, 'semis');
  assert.equal(resolveFormat(3, fmt('roundRobin', 1, 1, 'final', true)).thirdPlace, false);
  assert.equal(build(5, fmt('roundRobin', 1, 1, 'quarters')).filter((f) => isKnockout(f.stage)).length, 3);
  // Groups that cannot be filled become one league.
  assert.equal(resolveFormat(3, fmt('groups', 1, 2, 'final')).kind, 'roundRobin');
});

// ---- knockout ----

test('a knockout of 6 gives the top two seeds a bye', () => {
  const fixtures = build(6, fmt('knockout'));
  assert.equal(fixtures.length, 5);
  const [qf1, qf2, sf1, sf2, final] = fixtures;
  assert.deepEqual(fixtures.map((f) => f.stage), ['qf', 'qf', 'sf', 'sf', 'final']);
  assert.deepEqual(fixtures.map((f) => f.label), ['Quarter final 1', 'Quarter final 2', 'Semi final 1', 'Semi final 2', 'Final']);
  assert.deepEqual([qf1.home, qf1.away], [team('t4'), team('t5')]);
  assert.deepEqual([qf2.home, qf2.away], [team('t3'), team('t6')]);
  assert.deepEqual([sf1.home, sf1.away], [team('t1'), { kind: 'winner', fixture: qf1.id }]);
  assert.deepEqual([sf2.home, sf2.away], [team('t2'), { kind: 'winner', fixture: qf2.id }]);
  assert.deepEqual([final.home, final.away], [{ kind: 'winner', fixture: sf1.id }, { kind: 'winner', fixture: sf2.id }]);
});

test('a knockout of 8 and of 16', () => {
  const eight = build(8, fmt('knockout', 1, 1, 'none', true));
  assert.equal(eight.length, 8);
  assert.deepEqual(eight.slice(0, 4).map(idsOf), [['t1', 't8'], ['t4', 't5'], ['t2', 't7'], ['t3', 't6']]);
  assert.deepEqual(eight.map((f) => f.stage), ['qf', 'qf', 'qf', 'qf', 'sf', 'sf', 'third', 'final']);
  assert.equal(build(8, fmt('knockout')).length, 7);
  const sixteen = build(16, fmt('knockout'));
  assert.equal(sixteen.length, 15);
  assert.deepEqual(sixteen.slice(0, 8).map((f) => f.stage), Array.from({ length: 8 }, () => 'ko'));
  assert.equal(sixteen[0].label, 'Round of 16 game 1');
  assert.deepEqual(idsOf(sixteen[0]), ['t1', 't16']);
  // Three teams: one semi final, the top seed waits in the final.
  const three = build(3, fmt('knockout', 1, 1, 'none', true));
  assert.deepEqual(three.map((f) => f.stage), ['sf', 'final']);
  assert.deepEqual([three[1].home, three[1].away], [team('t1'), { kind: 'winner', fixture: three[0].id }]);
});

test('gameCount matches the fixtures that are built', () => {
  const finals: Finals[] = ['none', 'final', 'semis', 'quarters', 'page'];
  for (let n = 0; n <= 17; n++) {
    const formats: Format[] = [fmt('series', 1), fmt('series', 3), fmt('series', 5), fmt('knockout'), fmt('knockout', 1, 1, 'none', true)];
    for (const f of finals) {
      for (const third of [false, true]) {
        formats.push(fmt('roundRobin', 1, 1, f, third), fmt('roundRobin', 2, 1, f, third), fmt('groups', 1, 2, f, third), fmt('groups', 2, 2, f, third), fmt('groups', 1, 4, f, third), fmt('groups', 1, 3, f, third));
      }
    }
    for (const format of formats) assert.equal(gameCount(n, format), build(n, format).length, `${n} teams, ${JSON.stringify(format)}`);
  }
  assert.equal(gameCount(2, fmt('series', 3)), 3);
  assert.equal(gameCount(6, fmt('roundRobin', 1, 1, 'final')), 16);
  assert.equal(gameCount(8, fmt('groups', 1, 2, 'semis')), 15);
  assert.equal(gameCount(16, fmt('groups', 1, 4, 'quarters')), 31);
  assert.equal(gameCount(6, fmt('knockout')), 5);
});

test('labels follow the copy rule', () => {
  for (const format of [fmt('knockout', 1, 1, 'none', true), fmt('groups', 1, 4, 'quarters', true), fmt('roundRobin', 2, 1, 'page'), fmt('series', 5)]) {
    for (const f of build(16, format)) assert.ok(cleanCopy(f.label) && f.label.length > 0, f.label);
  }
});

// ---- slots ----

test('slots come from the sessions, and a game that would overrun is not offered', () => {
  const s = settingsOf(fmt('roundRobin'), [session('s1', '2026-12-05', 2, '17:00', '19:00')]);
  const slots = slotsOf(s);
  assert.deepEqual([...new Set(slots.map((x) => x.starts))], ['17:00', '17:30', '18:00', '18:30']);
  assert.equal(slots.length, 8);
  assert.deepEqual(slots.slice(0, 3), [
    { session: 's1', day: '2026-12-05', venue: 'Hall', court: 1, starts: '17:00', ends: '17:25', order: 0 },
    { session: 's1', day: '2026-12-05', venue: 'Hall', court: 2, starts: '17:00', ends: '17:25', order: 0 },
    { session: 's1', day: '2026-12-05', venue: 'Hall', court: 1, starts: '17:30', ends: '17:55', order: 1 },
  ]);
  // 18:40 would end at 19:05.
  assert.deepEqual([...new Set(slotsOf({ ...s, gapMinutes: 0, sessions: [session('s1', '2026-12-05', 1, '17:00', '19:00')] }).map((x) => x.starts))], ['17:00', '17:25', '17:50', '18:15']);
  assert.deepEqual(slotsOf({ ...s, sessions: [] }), []);
});

test('slots of several sessions run in time order and share an order when they start together', () => {
  const s = settingsOf(fmt('roundRobin'), [
    session('late', '2026-12-06', 1, '10:00', '11:00'),
    session('a', '2026-12-05', 1, '17:00', '18:00', 'Hall'),
    session('b', '2026-12-05', 1, '17:00', '18:30', 'Gym'),
  ]);
  const slots = slotsOf(s);
  assert.deepEqual(slots.map((x) => `${x.day.slice(8)} ${x.starts} ${x.venue} ${x.order}`), [
    '05 17:00 Hall 0', '05 17:00 Gym 0', '05 17:30 Hall 1', '05 17:30 Gym 1', '05 18:00 Gym 2', '06 10:00 Hall 3', '06 10:30 Hall 4',
  ]);
});

// ---- scheduling ----

test('the hard rules hold for every size, format and number of courts', () => {
  for (let n = 2; n <= 12; n++) {
    const formats = [suggestFormat(n)];
    if (n >= 3) formats.push(fmt('knockout', 1, 1, 'none', true));
    if (n >= 4) formats.push(fmt('roundRobin', 1, 1, 'page'), fmt('roundRobin', 1, 1, 'semis', true));
    if (n >= 8) formats.push(fmt('groups', 1, 2, 'quarters', true));
    for (const format of formats) {
      for (let courts = 1; courts <= 3; courts++) {
        const s = settingsOf(format, [session('s1', DAYS[0], courts, '08:00', '23:00'), session('s2', DAYS[1], courts, '08:00', '23:00'), session('s3', DAYS[2], courts, '08:00', '23:00')], { seed: n * 10 + courts, duty: true });
        const fixtures = build(n, format);
        const placed = schedule(fixtures, s);
        const what = `${n} teams, ${courts} courts, ${JSON.stringify(format)}`;
        assert.deepEqual(placed.unplaced, [], what);
        assert.equal(placed.fixtures.length, fixtures.length, what);
        checkRules(placed, s);
        // Every game sits in a real slot.
        const slots = new Set(slotsOf(s).map((x) => `${x.day} ${x.starts} ${x.venue} ${x.court}`));
        for (const f of placed.fixtures) assert.ok(slots.has(placeOf(f)), what);
        // The final is the last game, on its own.
        const final = placed.fixtures.find((f) => f.stage === 'final');
        if (final) assert.equal(final.seq, fixtures.length, what);
        // Nobody umpires while playing, or in two places at once.
        for (const f of placed.fixtures) {
          if (!f.duty) continue;
          assert.equal(f.duty.kind, 'team');
          const id = f.duty.kind === 'team' ? f.duty.id : '';
          for (const other of placed.fixtures) {
            if (!sameMoment(f, other, s.matchMinutes)) continue;
            assert.ok(!idsOf(other).includes(id), what);
            if (other !== f && other.duty?.kind === 'team') assert.notEqual(other.duty.id, id, what);
          }
        }
        assert.ok(placed.notes.every(cleanCopy));
      }
    }
  }
});

test('the hard rules hold when two halls on one day start at different times', () => {
  const format = fmt('roundRobin', 1, 1, 'semis');
  const s = settingsOf(format, [session('a', DAYS[0], 1, '10:00', '16:00', 'Hall'), session('b', DAYS[0], 1, '10:15', '16:00', 'Gym')], { seed: 3 });
  const placed = schedule(build(6, format), s);
  assert.deepEqual(placed.unplaced, []);
  checkRules(placed, s);
});

test('nobody plays three in a row when there is room', () => {
  const format = suggestFormat(6);
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '12:00', '22:00')]);
  const placed = schedule(build(6, format), s);
  assert.deepEqual(placed.unplaced, []);
  checkRules(placed, s);
  assert.ok(rests(placed.fixtures, s).longest < 3);
  assert.ok(!placed.notes.some((n) => n.includes('three games in a row')));
});

test('four teams on one court never play back to back in the league when there is time', () => {
  const format = suggestFormat(4);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '17:00', '22:00')]);
  const placed = schedule(build(4, format), s);
  assert.deepEqual(placed.unplaced, []);
  checkRules(placed, s);
  assert.equal(rests(placed.fixtures, s, (f) => f.stage === 'league').pairs, 0);
});

test('a tight evening still places everything, and says who has no rest', () => {
  // 6 games and a final in exactly 7 slots.
  const format = suggestFormat(4);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '17:00', '20:30')]);
  const placed = schedule(build(4, format), s);
  assert.deepEqual(placed.unplaced, []);
  checkRules(placed, s);
  assert.ok(rests(placed.fixtures, s).longest < 3);
  assert.ok(placed.notes.some((n) => n.includes('two games in a row')));
  // Three teams on one court cannot avoid it.
  const three = suggestFormat(3);
  const tight = settingsOf(three, [session('s1', DAYS[0], 1, '17:00', '20:30')]);
  const small = schedule(build(3, three), tight);
  assert.deepEqual(small.unplaced, []);
  assert.ok(small.notes.includes('With 3 teams on one court every team plays two games in a row at some point.'));
});

test('five teams on one court all get a rest between games', () => {
  const format = suggestFormat(5);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '12:00', '17:30')]);
  const placed = schedule(build(5, format), s);
  assert.deepEqual(placed.unplaced, []);
  assert.equal(rests(placed.fixtures, s).pairs, 0);
});

test('the same input gives the same schedule', () => {
  const format = suggestFormat(9);
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '09:00', '20:00')], { duty: true });
  const a = schedule(build(9, format), s);
  const b = schedule(build(9, format), s);
  assert.deepEqual(a, b);
  const c = schedule(build(9, format), { ...s, seed: 12345 });
  assert.deepEqual(c.unplaced, []);
  checkRules(c, s);
  // The input is left alone.
  const fixtures = build(9, format);
  const before = JSON.stringify(fixtures);
  schedule(fixtures, s);
  assert.equal(JSON.stringify(fixtures), before);
});

test('when the games do not fit nothing throws and every suggestion really works', () => {
  const format = suggestFormat(6);
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '17:00', '20:00')]);
  const fixtures = build(6, format);
  const placed = schedule(fixtures, s);
  assert.ok(placed.unplaced.length > 0);
  assert.equal(placed.fixtures.length, fixtures.length);
  checkRules(placed, s);
  for (const f of placed.fixtures) {
    if (placed.unplaced.includes(f.id)) assert.deepEqual([f.venue, f.court, f.day, f.starts], [null, null, null, null]);
    else assert.ok(f.starts != null);
  }
  // The final cannot be played before the league, so it is one of the games left out.
  assert.ok(placed.unplaced.includes(byLabel(fixtures, 'Final').id));
  assert.ok(placed.notes.some((n) => /^\d+ games? do(es)? not fit\. Add time or a court\.$/.test(n)));

  const fit = checkFit(entrants(6), s);
  assert.equal(fit.fits, false);
  assert.equal(fit.games, 16);
  assert.equal(fit.slots, 12);
  assert.ok(fit.suggestions.length >= 3);
  const kinds = ['shorter', 'oneLeg', 'groups', 'fewerFinals', 'court', 'time'];
  assert.deepEqual(fit.suggestions.map((x) => kinds.indexOf(x.kind)), fit.suggestions.map((x) => kinds.indexOf(x.kind)).sort((a, b) => a - b));
  for (const sug of fit.suggestions) {
    assert.ok(cleanCopy(sug.text), sug.text);
    assert.ok(sug.settings, sug.text);
    const next = { ...s, ...sug.settings };
    assert.equal(checkFit(entrants(6), next).fits, true, sug.text);
    assert.deepEqual(schedule(build(6, next.format), next).unplaced, [], sug.text);
  }
  const text = (kind: string) => fit.suggestions.find((x) => x.kind === kind)?.text;
  assert.equal(text('shorter'), 'Play 15 minute games instead of 25');
  assert.equal(text('groups'), 'Use two groups');
  assert.equal(text('court'), 'Add one more court');
  assert.match(text('time') ?? '', /^Add \d+ more minutes$/);
});

test('suggestions name the leg, the finals and the second court', () => {
  // 12 league games and a final in 8 slots.
  const double = settingsOf(fmt('roundRobin', 2, 1, 'final'), [session('s1', DAYS[0], 1, '17:00', '21:00')]);
  const fit = checkFit(entrants(4), double);
  assert.equal(fit.fits, false);
  const texts = fit.suggestions.map((x) => x.text);
  assert.ok(texts.includes('Play everyone once instead of twice'), texts.join(' / '));
  assert.ok(texts.includes('Add a second court'), texts.join(' / '));
  for (const sug of fit.suggestions) assert.equal(checkFit(entrants(4), { ...double, ...sug.settings }).fits, true, sug.text);

  const finals = settingsOf(fmt('roundRobin', 1, 1, 'semis'), [session('s1', DAYS[0], 1, '17:00', '20:30')]);
  const short = checkFit(entrants(4), finals);
  assert.equal(short.fits, false);
  const straight = short.suggestions.find((x) => x.kind === 'fewerFinals');
  assert.equal(straight?.text, 'Go straight to a final');
  assert.equal(straight?.settings?.format?.finals, 'final');
});

test('checkFit agrees with the schedule, and a knockout round needs its own turn', () => {
  // 4 teams, 3 courts: the league takes 3 rounds, then the semi finals, then the final. Five
  // turns, however many courts stand empty.
  const format = fmt('roundRobin', 1, 1, 'semis');
  for (const [end, fits] of [['19:00', false], ['19:30', true]] as const) {
    const s = settingsOf(format, [session('s1', DAYS[0], 3, '17:00', end)]);
    const fit = checkFit(entrants(4), s);
    assert.equal(fit.games, 9);
    assert.equal(fit.fits, fits, end);
    assert.equal(fit.slots >= fit.games, true, 'there are enough courts on paper either way');
    assert.equal(schedule(build(4, format), s).unplaced.length === 0, fits, end);
  }
  for (let n = 2; n <= 10; n++) {
    for (const end of ['18:00', '19:30', '21:00', '23:00']) {
      const s = settingsOf(suggestFormat(n), [session('s1', DAYS[0], 2, '17:00', end)]);
      const fit = checkFit(entrants(n), s);
      assert.equal(fit.fits, schedule(build(n, s.format), s).unplaced.length === 0, `${n} teams until ${end}`);
      if (fit.fits) assert.deepEqual(fit.suggestions, []);
    }
  }
});

test('a re-plan leaves pinned and locked games exactly where they are', () => {
  const format = suggestFormat(6);
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '14:00', '20:00')], { duty: true });
  const first = schedule(build(6, format), s);
  assert.deepEqual(first.unplaced, []);
  const pinned = first.fixtures.slice(0, Math.floor(first.fixtures.length / 3)).map((f) => f.id);
  const was = new Map(first.fixtures.map((f) => [f.id, placeOf(f)]));

  // The hall closes half an hour earlier.
  const shorter = { ...s, sessions: [session('s1', DAYS[0], 2, '14:00', '19:30')] };
  const again = schedule(first.fixtures, shorter, { pinned, previous: first.fixtures });
  assert.deepEqual(again.unplaced, []);
  checkRules(again, shorter);
  for (const f of again.fixtures) if (pinned.includes(f.id)) assert.equal(placeOf(f), was.get(f.id));
  const lastStart = Math.max(...again.fixtures.map((f) => toMinutes(f.starts ?? '')));
  assert.ok(lastStart + 25 <= toMinutes('19:30'));

  // Nothing changed at all: nothing moves.
  const same = schedule(first.fixtures, s, { previous: first.fixtures });
  assert.deepEqual(same.fixtures.map((f) => [f.id, placeOf(f)]), first.fixtures.map((f) => [f.id, placeOf(f)]));

  // A set works as well as a list, and a locked game stays without being pinned.
  const locked = first.fixtures.map((f) => (f.seq === 9 ? { ...f, locked: true } : f));
  const later = { ...s, sessions: [session('s1', DAYS[0], 2, '14:30', '20:30')] };
  const moved = schedule(locked, later, { pinned: new Set(pinned.slice(0, 2)), previous: locked });
  for (const f of moved.fixtures) {
    if (f.locked || pinned.slice(0, 2).includes(f.id)) assert.equal(placeOf(f), was.get(f.id));
  }
  // The two pinned games started at 14:00, before the new opening time, and still count.
  assert.ok(moved.fixtures.filter((f) => f.starts === '14:00').length >= 1);
  checkRules(moved, later);
});

test('a re-plan keeps the rest of the day steady when a team is added', () => {
  const format = fmt('roundRobin', 1, 1, 'final');
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '10:00', '20:00')]);
  // Ids that stay the same when the field grows: the pair for a league game, the label otherwise.
  const stable = (n: number) => buildFixtures('cup', entrants(n), format, () => 'x').map((f) => ({ ...f, id: f.stage === 'league' ? idsOf(f).sort().join('-') : f.label }));
  const first = schedule(stable(5), s);
  assert.deepEqual(first.unplaced, []);
  const played = first.fixtures.slice(0, 4).map((f) => f.id);
  const was = new Map(first.fixtures.map((f) => [f.id, placeOf(f)]));
  const again = schedule(stable(6), s, { pinned: played, previous: first.fixtures });
  assert.deepEqual(again.unplaced, []);
  assert.equal(again.fixtures.length, 16);
  checkRules(again, s);
  for (const f of again.fixtures) if (played.includes(f.id)) assert.equal(placeOf(f), was.get(f.id));
  // Most of the games that were already planned keep their time.
  const league = again.fixtures.filter((f) => f.stage === 'league' && was.has(f.id));
  const kept = league.filter((f) => placeOf(f) === was.get(f.id)).length;
  assert.ok(kept >= league.length / 2, `${kept} of ${league.length} kept their place`);
});

test('a re-plan during the day does not fill time that has gone by', () => {
  const format = suggestFormat(4);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '17:00', '22:00')]);
  const first = schedule(build(4, format), s);
  // The plan has a break after the second game. Two games are played, then a game is added.
  assert.deepEqual(first.fixtures.slice(0, 3).map((f) => f.starts), ['17:00', '17:30', '18:30']);
  const played = first.fixtures.slice(0, 2).map((f) => f.id);
  const extra: Fixture = { ...first.fixtures[0], id: 'extra', label: 'Extra game', seq: 99, venue: null, court: null, day: null, starts: null };
  const again = schedule([...first.fixtures, extra], s, { pinned: played, previous: first.fixtures, notBefore: { day: DAYS[0], starts: '18:10' } });
  assert.deepEqual(again.unplaced, []);
  checkRules(again, s);
  for (const f of again.fixtures) {
    if (!played.includes(f.id)) assert.ok(toMinutes(f.starts ?? '') >= toMinutes('18:30'), `${f.label} at ${f.starts}`);
  }
  assert.deepEqual(again.fixtures.slice(0, 2).map((f) => f.id), played);
});

test('a league game left behind when the semi finals went ahead still gets a place', () => {
  const format = fmt('roundRobin', 1, 1, 'semis');
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '14:00', '22:00')]);
  const first = schedule(build(4, format), s);
  assert.deepEqual(first.unplaced, []);
  const league = first.fixtures.filter((f) => f.stage === 'league');
  const left = league[league.length - 1];
  const semis = first.fixtures.filter((f) => f.stage === 'sf');
  const played = first.fixtures.filter((f) => f.id !== left.id && f.stage !== 'final').map((f) => f.id);
  const now = { day: DAYS[0], starts: semis[1].starts ?? '' };
  const again = schedule(first.fixtures, s, { pinned: played, previous: first.fixtures, notBefore: now });
  assert.deepEqual(again.unplaced, []);
  const moved = again.fixtures.find((f) => f.id === left.id) as Fixture;
  const final = byLabel(again.fixtures, 'Final');
  assert.ok(clock(moved) >= clock(semis[1]) + s.matchMinutes, `left over game at ${moved.starts}`);
  assert.ok(clock(final) >= clock(moved) + s.matchMinutes);
  assert.ok(again.notes.some((n) => n.startsWith('1 game that should have been played earlier')));
  assert.ok(again.notes.every(cleanCopy));
});

test('a cancelled game takes no court', () => {
  const format = suggestFormat(4);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '17:00', '20:00')]);
  const fixtures = build(4, format).map((f): Fixture => (f.seq === 1 ? { ...f, status: 'cancelled' } : f));
  // Six slots: the five games left and the final fit only because the cancelled one is skipped.
  const placed = schedule(fixtures, s);
  assert.deepEqual(placed.unplaced, []);
  const gone = placed.fixtures.find((f) => f.status === 'cancelled');
  assert.equal(gone?.starts, null);
  assert.equal(gone?.seq, fixtures.length);
});

test('duty goes to a resting team and is shared evenly', () => {
  const format = suggestFormat(5);
  const s = settingsOf(format, [session('s1', DAYS[0], 1, '12:00', '18:00')], { duty: true });
  const placed = schedule(build(5, format), s);
  assert.deepEqual(placed.unplaced, []);
  const count = new Map<string, number>(entrants(5).map((t) => [t.id, 0]));
  for (const f of placed.fixtures.filter((x) => x.stage === 'league')) {
    assert.ok(f.duty && f.duty.kind === 'team', `game ${f.seq} has nobody on duty`);
    const id = f.duty.kind === 'team' ? f.duty.id : '';
    assert.ok(!idsOf(f).includes(id));
    count.set(id, (count.get(id) ?? 0) + 1);
  }
  assert.ok(Math.max(...count.values()) - Math.min(...count.values()) <= 2);
  // Nobody knows who is free during the final.
  assert.equal(byLabel(placed.fixtures, 'Final').duty, null);
  // Off by default.
  assert.ok(schedule(build(5, format), { ...s, duty: false }).fixtures.every((f) => f.duty === null));
  // Two teams have nobody to spare.
  const pair = settingsOf(suggestFormat(2), [session('s1', DAYS[0], 1, '12:00', '18:00')], { duty: true });
  assert.ok(schedule(build(2, pair.format), pair).fixtures.every((f) => f.duty === null));
});

test('a series is played in order', () => {
  const s = settingsOf(suggestFormat(2), [session('s1', DAYS[0], 2, '17:00', '19:00')]);
  const placed = schedule(build(2, s.format), s);
  assert.deepEqual(placed.fixtures.map((f) => f.label), ['Game 1', 'Game 2', 'Game 3']);
  checkRules(placed, s);
  assert.equal(new Set(placed.fixtures.map((f) => f.starts)).size, 3);
});

test('a second leg comes after the first meeting', () => {
  const format = fmt('roundRobin', 2, 1, 'final');
  const s = settingsOf(format, [session('s1', DAYS[0], 2, '09:00', '21:00')]);
  const placed = schedule(build(5, format), s);
  assert.deepEqual(placed.unplaced, []);
  const seen = new Map<string, Fixture>();
  for (const f of placed.fixtures.filter((x) => x.stage === 'league')) {
    const pair = idsOf(f).sort().join(' v ');
    const first = seen.get(pair);
    if (first) assert.ok(first.round < f.round, `${pair}: the return game is played first`);
    seen.set(pair, f);
  }
});

test('no sessions, no teams: nothing breaks', () => {
  const s = settingsOf(suggestFormat(4), []);
  const placed = schedule(build(4, s.format), s);
  assert.equal(placed.unplaced.length, 7);
  assert.equal(placed.notes.length, 1);
  assert.deepEqual(schedule([], s), { fixtures: [], unplaced: [], cost: 0, notes: [] });
  assert.equal(checkFit(entrants(4), s).fits, false);
  assert.equal(checkFit([], s).fits, true);
  assert.deepEqual(build(1, suggestFormat(1)), []);
});

test('16 teams all playing each other are planned quickly', () => {
  const format = fmt('roundRobin', 1, 1, 'none');
  const s = settingsOf(format, [session('s1', DAYS[0], 3, '09:00', '20:00'), session('s2', DAYS[1], 3, '09:00', '20:00')], { duty: true });
  const fixtures = build(16, format);
  assert.equal(fixtures.length, 120);
  const t0 = performance.now();
  const placed = schedule(fixtures, s);
  const ms = performance.now() - t0;
  assert.ok(ms < 1500, `took ${Math.round(ms)}ms`);
  assert.deepEqual(placed.unplaced, []);
  checkRules(placed, s);
  assert.ok(rests(placed.fixtures, s).longest < 3);
  const t1 = performance.now();
  assert.equal(checkFit(entrants(16), { ...s, sessions: [s.sessions[0]] }).fits, false);
  assert.ok(performance.now() - t1 < 1500);
});
