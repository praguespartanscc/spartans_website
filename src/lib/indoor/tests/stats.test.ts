import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Log, rules, setup } from './helpers.ts';
import { aggregate, chargedBalls, digestFromSummary, digestOf, leaders, likelyDuplicates, mergeSpellings, mvpPoints, roster, sharedGames, splitSpelling, thresholds } from '../stats.ts';
import type { MatchDigest, StatsTeam } from '../stats.ts';
import { summaryOf } from '../format.ts';
import { trimIndex } from '../store.ts';

// Two overs a side, so a whole match is a handful of balls.
const short = (patch = {}) => rules({ match: { oversPerInnings: 2, maxOversPerBowler: null, consecutiveOversAllowed: true }, batting: { retireAt: null }, ...patch });

test('the digest carries the score, the balls and how each innings ended', () => {
  const s = setup(short(), 4);
  const log = new Log();
  log.bowl('b1').run(2).run(1).dots(4).bowl('b2').dots(6); // A: 3 from 12 balls
  log.bowl('a1').run(2).run(2); // B passes 3 after 2 balls
  const d = digestOf(log.play(s));
  assert.equal(d.complete, true);
  assert.equal(d.winner, 1);
  assert.equal(d.bpo, 6);
  assert.deepEqual(d.inn, [
    { t: 0, r: 3, w: 0, b: 12, q: 12, e: 'overs' },
    { t: 1, r: 4, w: 0, b: 2, q: 12, e: 'target' },
  ]);
  // A chase reached early is charged the balls it took, not the full quota.
  assert.equal(chargedBalls(d.inn[1]), 2);
  assert.equal(chargedBalls(d.inn[0]), 12);
});

test('a side bowled out, or an innings ended by hand, is charged its full quota', () => {
  assert.equal(chargedBalls({ t: 0, r: -10, w: 3, b: 5, q: 12, e: 'allOut' }), 12);
  assert.equal(chargedBalls({ t: 0, r: 8, w: 0, b: 7, q: 12, e: 'declared' }), 12);
  const s = setup(short({ wickets: { onAllOut: 'endInnings' } }), 3);
  const log = new Log();
  log.bowl('b1').out().out(); // two of three out: the side is all out
  const d = digestOf(log.play(s));
  assert.equal(d.inn[0].e, 'allOut');
  assert.equal(d.inn[0].b, 2);
  assert.equal(d.inn[0].r, -10, 'a total below zero survives');
  assert.equal(chargedBalls(d.inn[0]), 12);
});

test('an overs change mid match sets the quota of that innings only', () => {
  const s = setup(short(), 4);
  const log = new Log();
  log.bowl('b1').dots(6).event({ type: 'oversChange', data: { overs: 1 } } as never);
  const d = digestOf(log.play(s));
  assert.equal(d.inn[0].q, 6);
  assert.equal(d.inn[0].e, 'overs');
});

test('batting, bowling and fielding lines', () => {
  const s = setup(short(), 6);
  const log = new Log();
  log.bowl('b1').run(2).ball({ wicket: { kind: 'caught', who: 'striker', fielderId: 'b3' } });
  log.ball({ wicket: { kind: 'runOut', who: 'nonStriker', fielderId: 'b3' } }).ball({ wicket: { kind: 'stumped', who: 'striker', fielderId: 'b2' } });
  log.ball({ wicket: { kind: 'bowled', who: 'striker', fielderId: 'b4' } }); // nobody fields a bowled
  const d = digestOf(log.play(s));
  const a1 = d.bat.find((l) => l.id === 'a1')!;
  assert.deepEqual({ i: a1.i, s: a1.s, r: a1.r, o: a1.o }, { i: 1, s: 2, r: -3, o: 1 });
  assert.equal(d.bat.filter((l) => l.t === 0).length, 6, 'every player of the batting side has a line');
  assert.equal(d.bat.find((l) => l.id === 'a4')!.i, 1);
  assert.equal(d.bat.find((l) => l.id === 'a6')!.i, 1);
  const b1 = d.bowl.find((l) => l.id === 'b1')!;
  assert.deepEqual({ b: b1.b, r: b1.r, w: b1.w }, { b: 5, r: 2, w: 3 }, 'a run out is not the bowler\'s wicket');
  assert.deepEqual(d.field.find((l) => l.id === 'b3'), { id: 'b3', n: 'B3', t: 1, c: 1, ro: 1, st: 0 });
  assert.deepEqual(d.field.find((l) => l.id === 'b2'), { id: 'b2', n: 'B2', t: 1, c: 0, ro: 0, st: 1 });
  assert.equal(d.field.find((l) => l.id === 'b4'), undefined);
});

test('the digest takes tournament team ids from the setup', () => {
  const s = setup(short(), 4);
  s.teams[0].id = 'team-a';
  s.teams[1].id = 'team-b';
  const d = digestOf(new Log().bowl('b1').dots(2).play(s));
  assert.deepEqual(d.teams, ['team-a', 'team-b']);
  assert.equal(d.complete, false);
  assert.equal(d.winner, null);
  assert.deepEqual(summaryOf(new Log().bowl('b1').dots(2).play(s)).digest?.teams, ['team-a', 'team-b']);
});

test('an old summary still gives a winner and balls', () => {
  const d = digestFromSummary({ innings: [{ team: 'Kasi', total: 39, wickets: 2, overs: '8.0' }, { team: 'Vicky', total: 31, wickets: 5, overs: '7.4' }], result: 'Kasi won by 8 runs' }, 'Vicky', true);
  assert.equal(d.winner, 1, 'Kasi is the second team of the match');
  assert.deepEqual(d.inn.map((i) => [i.t, i.b]), [[1, 48], [0, 46]]);
  assert.equal(d.bat.length, 0);
});

const line = (over: Partial<MatchDigest>): MatchDigest => ({ v: 1, teams: [null, null], bpo: 6, complete: true, winner: 0, inn: [], bat: [], bowl: [], field: [], ...over });
const TEAMS: StatsTeam[] = [
  { id: 'A', name: 'Falcons', squad: [{ id: 'p1', name: 'Arun Konda' }, { id: 'p2', name: 'Kasi' }] },
  { id: 'B', name: 'Lions', squad: [{ id: 'q1', name: 'Vicky' }] },
];

test('a tournament adds a player up across matches', () => {
  const one = line({
    bat: [{ id: 'p1', n: 'Arun Konda', t: 0, i: 1, r: 12, s: 17, b: 10, o: 1, x: 2 }, { id: 'p2', n: 'Kasi', t: 0, i: 0, r: 0, s: 0, b: 0, o: 0, x: 0 }],
    bowl: [{ id: 'q1', n: 'Vicky', t: 1, b: 12, r: 17, w: 1, wd: 1, nb: 0 }],
    field: [{ id: 'q1', n: 'Vicky', t: 1, c: 1, ro: 0, st: 0 }],
  });
  // Second match: Falcons are listed second, and Arun was typed in late with a new id.
  const two = line({
    bat: [{ id: 'late-9', n: 'arun  konda', t: 1, i: 1, r: 20, s: 20, b: 8, o: 0, x: 3 }],
    bowl: [{ id: 'q1', n: 'Vicky', t: 0, b: 6, r: 20, w: 0, wd: 0, nb: 2 }, { id: 'p2', n: 'Kasi', t: 1, b: 6, r: 4, w: 2, wd: 0, nb: 0 }],
  });
  const all = aggregate([{ digest: one, teams: ['A', 'B'] }, { digest: two, teams: ['B', 'A'] }], TEAMS);
  const arun = all.find((p) => p.key === 'A:p1')!;
  assert.equal(arun.name, 'Arun Konda');
  assert.deepEqual(arun.bat, { innings: 2, runs: 32, scored: 37, balls: 18, outs: 1, best: 20, boundaries: 5 });
  assert.equal(arun.matches, 2);
  const kasi = all.find((p) => p.key === 'A:p2')!;
  assert.equal(kasi.matches, 2, 'in the side counts as a match, also without batting');
  assert.equal(kasi.bat.innings, 0);
  assert.deepEqual(kasi.bowl.best, { w: 2, r: 4 });
  const vicky = all.find((p) => p.key === 'B:q1')!;
  assert.deepEqual(vicky.bowl, { innings: 2, balls: 18, runs: 37, wickets: 1, wides: 1, noBalls: 2, best: { w: 1, r: 17 } });
  assert.equal(vicky.field.catches, 1);
  assert.equal(vicky.mvp, mvpPoints(vicky));
  assert.equal(vicky.mvp, 0 + 10 + 5);
  assert.equal(all.length, 3, 'the late spelling did not make a fourth player');
});

test('a name nobody has in a squad is kept apart per team', () => {
  const d = line({ bat: [{ id: 'x1', n: 'Guest', t: 0, i: 1, r: 5, s: 5, b: 4, o: 0, x: 0 }, { id: 'x2', n: 'Guest', t: 1, i: 1, r: 7, s: 7, b: 4, o: 0, x: 0 }] });
  const all = aggregate([{ digest: d, teams: ['A', 'B'] }], TEAMS);
  assert.deepEqual(all.map((p) => [p.key, p.bat.runs]).sort(), [['A:~guest', 5], ['B:~guest', 7]]);
});

test('rate tables leave out players under the threshold', () => {
  assert.deepEqual(thresholds(1, 6), { balls: 6, bowled: 6 });
  assert.deepEqual(thresholds(4, 6), { balls: 12, bowled: 12 });
  const d = line({
    bat: [{ id: 'p1', n: 'Arun Konda', t: 0, i: 1, r: 6, s: 6, b: 2, o: 0, x: 1 }, { id: 'p2', n: 'Kasi', t: 0, i: 1, r: 9, s: 9, b: 8, o: 0, x: 0 }],
    bowl: [{ id: 'q1', n: 'Vicky', t: 1, b: 6, r: 15, w: 0, wd: 0, nb: 0 }],
  });
  const all = aggregate([{ digest: d, teams: ['A', 'B'] }], TEAMS);
  assert.deepEqual(leaders(all, 'strikeRate', { bpo: 6, games: 1 }).map((p) => p.name), ['Kasi'], 'two balls at 300 does not top the table');
  assert.deepEqual(leaders(all, 'runs', { bpo: 6, games: 1 }).map((p) => p.name), ['Kasi', 'Arun Konda']);
  assert.deepEqual(leaders(all, 'economy', { bpo: 6, games: 1 }).map((p) => p.name), ['Vicky']);
  assert.deepEqual(leaders(all, 'fielding', { bpo: 6, games: 1 }), []);
});

test('the phone never drops a match that has not uploaded', () => {
  const ids = Array.from({ length: 60 }, (_, i) => `m${i}`);
  const { keep, drop } = trimIndex(ids, (id) => id === 'm55' || id === 'm58');
  assert.equal(keep.length, 52);
  assert.ok(keep.includes('m55') && keep.includes('m58'));
  assert.equal(drop.length, 8);
  assert.ok(!drop.includes('m55'));
});

// ---- One player, two spellings ----
const bat = (id: string, n: string, r: number, t: 0 | 1 = 0) => ({ id, n, t, i: 1 as const, r, s: r, b: 6, o: 0, x: 0 });
const SQUAD: StatsTeam[] = [{ id: 'A', name: 'Falcons', squad: [{ id: 'p1', name: 'Thilak' }, { id: 'p2', name: 'Vamshi' }, { id: 'p3', name: 'Tilak' }] }, { id: 'B', name: 'Lions', squad: [] }];
// Game 1: Thilak (squad). Game 2: "Tilak" from the squad's second entry. Game 3: "Thilaak" typed in late.
const GAMES = [
  { digest: line({ bat: [bat('p1', 'Thilak', 10), bat('p2', 'Vamshi', 5)] }), teams: ['A', 'B'] as [string, string] },
  { digest: line({ bat: [bat('p3', 'Tilak', 7), bat('p2', 'Vamshi', 4)] }), teams: ['A', 'B'] as [string, string] },
  { digest: line({ bat: [bat('late1', 'Thilaak', 3)], bowl: [{ id: 'late1', n: 'Thilaak', t: 0, b: 6, r: 4, w: 2, wd: 0, nb: 0 }] }), teams: ['A', 'B'] as [string, string] },
];
let ids = 0;
const nextId = () => `new${(ids += 1)}`;

test('two spellings are two records until they are merged', () => {
  const all = aggregate(GAMES, SQUAD);
  assert.deepEqual(all.map((p) => [p.key, p.bat.runs, p.seen]).sort(), [['A:p1', 10, [0]], ['A:p2', 9, [0, 1]], ['A:p3', 7, [1]], ['A:~thilaak', 3, [2]]]);
  const pairs = likelyDuplicates(all).map(([keep, other]) => `${keep.name}<${other.name}`).sort();
  // The squad member is the one to keep when the other was only typed in.
  assert.ok(pairs.includes('Thilak<Thilaak'), pairs.join());
  // Two squad entries were both entered on purpose, so they are not offered (they can still be merged by hand).
  assert.ok(!pairs.some((x) => x === 'Thilak<Tilak' || x === 'Tilak<Thilak'), pairs.join());
  assert.ok(!pairs.some((x) => x.includes('Vamshi')));
});

test('merging a typed spelling and a second squad entry into one player', () => {
  const before = aggregate(GAMES, SQUAD);
  const find = (key: string) => before.find((p) => p.key === key)!;
  let squad = mergeSpellings(SQUAD[0].squad, find('A:p1'), find('A:~thilaak'), nextId);
  assert.deepEqual(squad.find((p) => p.id === 'p1'), { id: 'p1', name: 'Thilak', aka: [{ name: 'Thilaak' }] });
  squad = mergeSpellings(squad, find('A:p1'), find('A:p3'), nextId);
  assert.deepEqual(squad.map((p) => p.id), ['p1', 'p2'], 'the second squad entry is gone');
  assert.deepEqual(squad[0].aka, [{ name: 'Thilaak' }, { name: 'Tilak', id: 'p3' }]);

  const after = aggregate(GAMES, [{ ...SQUAD[0], squad }, SQUAD[1]]);
  assert.equal(after.length, 2);
  const one = after.find((p) => p.key === 'A:p1')!;
  assert.equal(one.name, 'Thilak', 'the kept spelling is shown');
  assert.deepEqual([one.matches, one.bat.innings, one.bat.runs, one.bat.best, one.bowl.wickets], [3, 3, 20, 10, 2]);
  assert.deepEqual(one.seen, [0, 1, 2]);
  assert.equal(one.mvp, 20 + 2 * 10);
  assert.equal(likelyDuplicates(after).length, 0);
  // Merging again changes nothing.
  assert.deepEqual(mergeSpellings(squad, one, one, nextId), squad);
});

test('a name that was only typed in can be the one that is kept', () => {
  const typed = [
    { digest: line({ bat: [bat('x1', 'Kasi Viswanathan', 8)] }), teams: ['B', 'A'] as [string, string] },
    { digest: line({ bat: [bat('x2', 'Kasi', 4)] }), teams: ['B', 'A'] as [string, string] },
  ];
  const before = aggregate(typed, SQUAD);
  const [keep, other] = likelyDuplicates(before)[0];
  assert.deepEqual([keep.name, other.name], ['Kasi Viswanathan', 'Kasi'], 'level on games: the fuller name is kept');
  const squad = mergeSpellings([], keep, other, () => 'made1');
  assert.deepEqual(squad, [{ id: 'made1', name: 'Kasi Viswanathan', aka: [{ name: 'Kasi' }] }], 'they join the squad so the merge has somewhere to live');
  const after = aggregate(typed, [SQUAD[0], { ...SQUAD[1], squad }]);
  assert.deepEqual(after.map((p) => [p.key, p.name, p.bat.runs]), [['B:made1', 'Kasi Viswanathan', 12]]);
});

test('a merge can be undone', () => {
  const before = aggregate(GAMES, SQUAD);
  const find = (key: string) => before.find((p) => p.key === key)!;
  const merged = mergeSpellings(SQUAD[0].squad, find('A:p1'), find('A:~thilaak'), nextId);
  const split = splitSpelling(merged, 'p1', { name: 'Thilaak' });
  assert.deepEqual(split.find((p) => p.id === 'p1'), { id: 'p1', name: 'Thilak' });
  assert.equal(aggregate(GAMES, [{ ...SQUAD[0], squad: split }, SQUAD[1]]).length, 4);
  // A merged squad entry comes back as a squad entry, with its own figures.
  const both = mergeSpellings(merged, find('A:p1'), find('A:p3'), nextId);
  assert.deepEqual(both.map((p) => p.id), ['p1', 'p2']);
  const back = splitSpelling(both, 'p1', { name: 'Tilak', id: 'p3' });
  assert.deepEqual(back.map((p) => p.id), ['p1', 'p2', 'p3']);
  assert.deepEqual(back[0].aka, [{ name: 'Thilaak' }]);
  const again = aggregate(GAMES, [{ ...SQUAD[0], squad: back }, SQUAD[1]]);
  assert.deepEqual(again.map((p) => [p.key, p.bat.runs]).sort(), [['A:p1', 13], ['A:p2', 9], ['A:p3', 7]]);
});

test('two records that share a game are not offered as one person', () => {
  const same = [{ digest: line({ bat: [bat('p1', 'Thilak', 10), bat('late', 'Tilak', 2)] }), teams: ['A', 'B'] as [string, string] }];
  const squad: StatsTeam[] = [{ id: 'A', name: 'Falcons', squad: [{ id: 'p1', name: 'Thilak' }] }, SQUAD[1]];
  const all = aggregate(same, squad);
  assert.equal(sharedGames(all[0], all[1]), 1);
  assert.equal(likelyDuplicates(all).length, 0);
  // The organiser can still insist. Both lines then count for the one player.
  const one = aggregate(same, [{ ...squad[0], squad: mergeSpellings(squad[0].squad, all.find((p) => p.key === 'A:p1')!, all.find((p) => p.key === 'A:~tilak')!, nextId) }, squad[1]]);
  assert.deepEqual(one.map((p) => [p.key, p.matches, p.bat.innings, p.bat.runs]), [['A:p1', 1, 2, 12]]);
});

test('the same name in two teams is never offered as one person', () => {
  const two = [{ digest: line({ bat: [bat('a', 'Arun', 5, 0), bat('b', 'Aruun', 6, 1)] }), teams: ['A', 'B'] as [string, string] }];
  assert.equal(likelyDuplicates(aggregate(two, SQUAD)).length, 0);
});

test('a squad member who has not played can be the name that is kept', () => {
  const typed = [{ digest: line({ bat: [bat('late', 'Vamsi', 9)] }), teams: ['A', 'B'] as [string, string] }];
  const all = roster(aggregate(typed, SQUAD), SQUAD);
  assert.deepEqual(all.map((p) => p.key).sort(), ['A:p1', 'A:p2', 'A:p3', 'A:~vamsi']);
  const pairs = likelyDuplicates(all).map(([keep, other]) => `${keep.name}<${other.name}`);
  assert.ok(pairs.includes('Vamshi<Vamsi'), pairs.join());
  const [keep, other] = likelyDuplicates(all).find(([k]) => k.name === 'Vamshi')!;
  const squad = mergeSpellings(SQUAD[0].squad, keep, other, nextId);
  assert.deepEqual(aggregate(typed, [{ ...SQUAD[0], squad }, SQUAD[1]]).map((p) => [p.key, p.name, p.bat.runs]), [['A:p2', 'Vamshi', 9]]);
});
