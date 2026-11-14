import { test } from 'node:test';
import assert from 'node:assert/strict';
import { board, nrrText } from '../standings.ts';
import type { MatchDigest } from '../stats.ts';
import type { Fixture, Points, TeamRef, TournamentMatch, TournamentTeam } from '../tournament.ts';
import { countedMatch, fixtureState, refLabel } from '../tournament.ts';

const POINTS: Points = { win: 4, tie: 2, loss: 0, noResult: 2 };
const team = (id: string, seed: number, grp: string | null = null): TournamentTeam => ({ id, tournament_id: 't', name: `Team ${id}`, short: null, seed, grp, squad: [], withdrawn: false, sort: seed });
const ref = (id: string): TeamRef => ({ kind: 'team', id });
let n = 0;
const fx = (id: string, home: TeamRef, away: TeamRef, over: Partial<Fixture> = {}): Fixture => ({
  id, tournament_id: 't', stage: 'league', grp: null, round: 1, seq: (n += 1), label: '', home, away, duty: null,
  venue: null, court: null, day: null, starts: null, status: 'scheduled', winner_id: null, match_id: null, voided: [], locked: false, note: null, ...over,
});
// A finished match: first team's runs and balls, second team's runs and balls (12 balls allowed).
type Inn = [number, number, ('overs' | 'target' | 'allOut' | 'declared')?];
function match(id: string, fixture: string, teams: [string, string], a: Inn, b: Inn, over: Partial<TournamentMatch> = {}): TournamentMatch {
  const digest: MatchDigest = {
    v: 1, teams, bpo: 6, complete: true, winner: a[0] === b[0] ? null : a[0] > b[0] ? 0 : 1,
    inn: [{ t: 0, r: a[0], w: 0, b: a[1], q: 12, e: a[2] ?? 'overs' }, { t: 1, r: b[0], w: 0, b: b[1], q: 12, e: b[2] ?? 'overs' }],
    bat: [], bowl: [], field: [],
  };
  return { id, tournament_id: 't', fixture_id: fixture, status: 'complete', share_slug: `slug${id}`, team_a: `Team ${teams[0]}`, team_b: `Team ${teams[1]}`, summary: { innings: [], result: null, digest }, played_on: '2026-12-05', created_at: `2026-12-05T10:0${id.length}:00Z`, ...over };
}
const run = (teams: TournamentTeam[], fixtures: Fixture[], matches: TournamentMatch[], sharedTitle = false) => board({ teams, fixtures, matches, points: POINTS, bpo: 6, sharedTitle });

test('points, and net run rate for each way an innings ends', () => {
  const teams = [team('A', 1), team('B', 2), team('C', 3)];
  const fixtures = [fx('f1', ref('A'), ref('B')), fx('f2', ref('B'), ref('C')), fx('f3', ref('C'), ref('A'))];
  const matches = [
    match('m1', 'f1', ['A', 'B'], [30, 12], [31, 8, 'target']), // B chase it in 8 balls
    match('m2', 'f2', ['B', 'C'], [20, 12], [-10, 5, 'allOut']), // C bowled out: charged all 12
    match('m3', 'f3', ['C', 'A'], [18, 9, 'declared'], [18, 12]), // tie, C's innings ended by hand
  ];
  const t = run(teams, fixtures, matches).table();
  assert.deepEqual(t.map((r) => [r.teamId, r.played, r.won, r.lost, r.tied, r.points]), [['B', 2, 2, 0, 0, 8], ['A', 2, 0, 1, 1, 2], ['C', 2, 0, 1, 1, 2]]);
  const B = t[0];
  assert.deepEqual([B.runsFor, B.ballsFor, B.runsAgainst, B.ballsAgainst], [51, 20, 20, 24]);
  assert.equal(B.nrr.toFixed(3), (51 / (20 / 6) - 20 / 4).toFixed(3));
  const C = t.find((r) => r.teamId === 'C')!;
  assert.deepEqual([C.runsFor, C.ballsFor, C.runsAgainst, C.ballsAgainst], [8, 24, 38, 24], 'bowled out and declared innings are charged the full 12 balls');
  assert.equal(C.diff, -30);
  assert.equal(nrrText(1.25), '+1.250');
  assert.equal(nrrText(-0.5), '−0.500');
});

test('walkovers and no results give points but leave net run rate alone', () => {
  const teams = [team('A', 1), team('B', 2), team('C', 3)];
  const fixtures = [fx('f1', ref('A'), ref('B'), { status: 'walkover', winner_id: 'B' }), fx('f2', ref('B'), ref('C'), { status: 'no_result' }), fx('f3', ref('C'), ref('A'), { status: 'cancelled' })];
  const b = run(teams, fixtures, []);
  const t = b.table();
  assert.deepEqual(t.map((r) => [r.teamId, r.played, r.won, r.lost, r.noResult, r.points, r.nrr]), [['B', 2, 1, 0, 1, 6, 0], ['C', 1, 0, 0, 1, 2, 0], ['A', 1, 0, 1, 0, 0, 0]]);
  assert.equal(b.stageDone(), true, 'a cancelled game does not hold the stage open');
});

test('level on points: wins, then head to head, then net run rate, then run difference, then seeding', () => {
  // Wins: A has two wins (8), B a win and two ties (8).
  let teams = [team('A', 2), team('B', 1), team('C', 3), team('D', 4)];
  let t = run(teams, [fx('1', ref('A'), ref('C')), fx('2', ref('A'), ref('D')), fx('3', ref('B'), ref('C')), fx('4', ref('B'), ref('D')), fx('5', ref('B'), ref('A'), { status: 'cancelled' }), fx('6', ref('B'), ref('C'))], [
    match('a', '1', ['A', 'C'], [20, 12], [10, 12]), match('b', '2', ['A', 'D'], [20, 12], [10, 12]),
    match('c', '3', ['B', 'C'], [50, 12], [10, 12]), match('d', '4', ['B', 'D'], [15, 12], [15, 12]), match('e', '6', ['B', 'C'], [15, 12], [15, 12]),
  ]).table();
  assert.deepEqual(t.slice(0, 2).map((r) => r.teamId), ['A', 'B']);
  assert.equal(t[0].why, 'Ahead of Team B on wins');

  // Head to head: A and B both have one win, A beat B. B has the far better run rate.
  teams = [team('A', 2), team('B', 1), team('C', 3)];
  t = run(teams, [fx('1', ref('A'), ref('B')), fx('2', ref('B'), ref('C')), fx('3', ref('C'), ref('A'))], [
    match('a', '1', ['A', 'B'], [11, 12], [10, 12]), match('b', '2', ['B', 'C'], [90, 12], [10, 12]), match('c', '3', ['C', 'A'], [12, 12], [11, 12]),
  ]).table();
  // All three have one win and each beat one other: head to head cannot split them, run rate does.
  assert.deepEqual(t.map((r) => r.teamId), ['B', 'A', 'C']);
  assert.equal(t[0].why, 'Ahead of Team A on net run rate');

  // Two teams level, they met once: the winner of that game is above, whatever the run rate.
  teams = [team('A', 2), team('B', 1), team('C', 3), team('D', 4)];
  t = run(teams, [fx('1', ref('A'), ref('B')), fx('2', ref('B'), ref('C')), fx('3', ref('A'), ref('D')), fx('4', ref('C'), ref('D'))], [
    match('a', '1', ['A', 'B'], [11, 12], [10, 12]), match('b', '2', ['B', 'C'], [90, 12], [10, 12]), match('c', '3', ['A', 'D'], [10, 12], [11, 12]), match('d', '4', ['C', 'D'], [12, 12], [10, 12]),
  ]).table();
  assert.deepEqual(t.map((r) => r.teamId), ['A', 'B', 'C', 'D'].sort((x, y) => t.findIndex((r) => r.teamId === x) - t.findIndex((r) => r.teamId === y)));
  const [a, b] = [t.findIndex((r) => r.teamId === 'A'), t.findIndex((r) => r.teamId === 'B')];
  // All four have one win. A v B was played, but A never met C: no head to head for the four.
  assert.ok(b < a, 'not everyone met everyone, so run rate decides and B is ahead');

  // Seeding last: nothing played between them and identical figures.
  teams = [team('A', 2), team('B', 1), team('C', 3), team('D', 4)];
  t = run(teams, [fx('1', ref('A'), ref('C')), fx('2', ref('B'), ref('D'))], [match('a', '1', ['A', 'C'], [20, 12], [10, 12]), match('b', '2', ['B', 'D'], [20, 12], [10, 12])]).table();
  assert.deepEqual(t.slice(0, 2).map((r) => r.teamId), ['B', 'A']);
  assert.equal(t[0].why, 'Ahead of Team A on seeding');
});

test('two teams level who met: head to head beats net run rate', () => {
  const teams = [team('A', 2), team('B', 1), team('C', 3)];
  // Double round robin, A and B each win one against the other?  No: A beats B twice here, and
  // loses twice to C, while B beats C twice. A and B have two wins each but A won both meetings.
  const fixtures = ['1', '2', '3', '4', '5', '6'].map((id, i) => fx(id, ref(['A', 'A', 'B', 'B', 'C', 'C'][i]), ref(['B', 'B', 'C', 'C', 'A', 'A'][i])));
  const matches = [
    match('a', '1', ['A', 'B'], [11, 12], [10, 12]), match('b', '2', ['A', 'B'], [11, 12], [10, 12]),
    match('c', '3', ['B', 'C'], [90, 12], [10, 12]), match('d', '4', ['B', 'C'], [90, 12], [10, 12]),
    match('e', '5', ['C', 'A'], [12, 12], [11, 12]), match('f', '6', ['C', 'A'], [12, 12], [11, 12]),
  ];
  // Everyone has two wins and everyone met everyone twice: head to head points are equal (8 each),
  // so run rate decides. Now hand A a third win by walkover and B one too: still level, but
  // between A and B alone A leads 2 to 0.
  const t = run(teams, [...fixtures, fx('7', ref('A'), ref('D'), { status: 'walkover', winner_id: 'A' }), fx('8', ref('B'), ref('D'), { status: 'walkover', winner_id: 'B' })], matches).table();
  assert.deepEqual(t.slice(0, 2).map((r) => r.teamId), ['B', 'A'], 'team D is not in the tournament, so those walkovers count for nothing');
  const teams4 = [...teams, team('D', 4)];
  const t4 = run(teams4, [...fixtures, fx('7', ref('A'), ref('D'), { status: 'walkover', winner_id: 'A' }), fx('8', ref('B'), ref('D'), { status: 'walkover', winner_id: 'B' })], matches).table();
  assert.deepEqual(t4.slice(0, 2).map((r) => r.teamId), ['A', 'B']);
  assert.equal(t4[0].why, 'Ahead of Team B on head to head');
});

test('knockout places fill in only when the games before them are done', () => {
  const teams = [team('A', 1, 'A'), team('B', 2, 'B'), team('C', 3, 'B'), team('D', 4, 'A')];
  const g1 = fx('g1', ref('A'), ref('D'), { stage: 'group', grp: 'A' });
  const g2 = fx('g2', ref('B'), ref('C'), { stage: 'group', grp: 'B' });
  const s1 = fx('s1', { kind: 'groupPos', group: 'A', pos: 1 }, { kind: 'groupPos', group: 'B', pos: 2 }, { stage: 'sf', label: 'Semi final 1' });
  const s2 = fx('s2', { kind: 'groupPos', group: 'B', pos: 1 }, { kind: 'groupPos', group: 'A', pos: 2 }, { stage: 'sf', label: 'Semi final 2' });
  const fin = fx('fin', { kind: 'winner', fixture: 's1' }, { kind: 'winner', fixture: 's2' }, { stage: 'final', label: 'Final' });
  const third = fx('third', { kind: 'loser', fixture: 's1' }, { kind: 'loser', fixture: 's2' }, { stage: 'third', label: 'Third place' });
  const all = [g1, g2, s1, s2, fin, third];
  assert.equal(refLabel(fin.home, teams, all), 'Winner of Semi final 1');
  assert.equal(refLabel(s1.away, teams, all), 'B2');

  const m1 = match('m1', 'g1', ['A', 'D'], [10, 12], [20, 12]);
  let b = run(teams, all, [m1]);
  assert.deepEqual(b.groups, ['A', 'B']);
  assert.equal(b.outcome(s1).home, 'D', 'group A is done: D won it');
  assert.equal(b.outcome(s1).away, null, 'group B is not done');
  assert.deepEqual(b.table('A').map((r) => r.teamId), ['D', 'A']);

  const m2 = match('m2', 'g2', ['B', 'C'], [30, 12], [20, 12]);
  const ms1 = match('ms1', 's1', ['D', 'C'], [15, 12], [15, 12]); // tied semi final
  const ms2 = match('ms2', 's2', ['B', 'A'], [10, 12], [25, 12]);
  b = run(teams, all, [m1, m2, ms1, ms2]);
  assert.deepEqual([b.outcome(s2).winner, b.outcome(s2).loser], ['A', 'B']);
  assert.equal(b.outcome(s1).tie, true);
  assert.equal(b.outcome(fin).home, null, 'a tied semi final waits for the organiser');
  assert.equal(b.outcome(fin).away, 'A');
  assert.deepEqual(b.champions, []);

  // The organiser says C go through.
  const decided = all.map((f) => (f.id === 's1' ? { ...f, winner_id: 'C', note: 'C go through on a bowl out' } : f));
  b = run(teams, decided, [m1, m2, ms1, ms2, match('mf', 'fin', ['C', 'A'], [40, 12], [12, 12])]);
  assert.equal(b.outcome(decided[4]).home, 'C');
  assert.equal(b.outcome(decided[5]).home, 'D');
  assert.deepEqual(b.champions, ['C']);
  assert.equal(b.table('A').length, 2, 'knockout games do not touch the group table');
  assert.equal(b.table('A')[0].played, 1);
});

test('a tied final can be shared', () => {
  const teams = [team('A', 1), team('B', 2)];
  const fin = fx('fin', ref('A'), ref('B'), { stage: 'final' });
  const m = match('m', 'fin', ['A', 'B'], [20, 12], [20, 12]);
  assert.deepEqual(run(teams, [fin], [m]).champions, []);
  assert.deepEqual(run(teams, [fin], [m], true).champions, ['A', 'B']);
});

test('a series is won as soon as one side cannot be caught', () => {
  const teams = [team('A', 1), team('B', 2)];
  const games = ['1', '2', '3'].map((id, i) => fx(id, ref(i % 2 ? 'B' : 'A'), ref(i % 2 ? 'A' : 'B'), { stage: 'series', label: `Game ${id}` }));
  let b = run(teams, games, [match('a', '1', ['A', 'B'], [20, 12], [10, 12])]);
  assert.deepEqual(b.champions, []);
  b = run(teams, games, [match('a', '1', ['A', 'B'], [20, 12], [10, 12]), match('b', '2', ['B', 'A'], [5, 12], [9, 4, 'target'])]);
  assert.deepEqual(b.champions, ['A']);
  assert.deepEqual(b.table().map((r) => [r.teamId, r.won]), [['A', 2], ['B', 0]]);
});

test('which match counts for a fixture', () => {
  const f = fx('f', ref('A'), ref('B'));
  const early = match('early', 'f', ['A', 'B'], [10, 12], [20, 12], { created_at: '2026-12-05T10:00:00Z' });
  const late = match('late', 'f', ['A', 'B'], [30, 12], [20, 12], { created_at: '2026-12-05T10:05:00Z' });
  const live = match('live', 'f', ['A', 'B'], [1, 2], [0, 0], { status: 'live', created_at: '2026-12-05T09:00:00Z' });
  assert.equal(countedMatch(f, [late, early])?.id, 'early', 'the first one started counts');
  assert.equal(countedMatch({ ...f, match_id: 'late' }, [late, early])?.id, 'late', 'unless the organiser picked the other');
  assert.equal(countedMatch({ ...f, voided: ['early'] }, [late, early])?.id, 'late', 'or set the first aside');
  assert.equal(countedMatch(f, [{ ...early, status: 'abandoned' }])?.id, undefined);
  assert.equal(fixtureState(f, [live]), 'live');
  assert.equal(fixtureState(f, []), 'scheduled');
  assert.equal(fixtureState({ ...f, voided: ['early'] }, [early]), 'scheduled', 'a replay puts the game back on the list');
  const teams = [team('A', 1), team('B', 2)];
  assert.equal(run(teams, [f], [late, early]).table()[0].teamId, 'B');
  assert.equal(run(teams, [{ ...f, match_id: 'late' }], [late, early]).table()[0].teamId, 'A');
});

test('a game whose teams were picked by hand follows the match', () => {
  const teams = [team('A', 1), team('B', 2), team('C', 3)];
  const fin = fx('fin', { kind: 'tablePos', pos: 1 }, { kind: 'tablePos', pos: 2 }, { stage: 'final' });
  const lg = fx('l', ref('A'), ref('B'));
  // The league is not done, but the final was started by hand with C v A.
  const b = run(teams, [lg, fin], [match('m', 'fin', ['C', 'A'], [20, 12], [10, 12])]);
  assert.deepEqual([b.outcome(fin).home, b.outcome(fin).away, b.outcome(fin).winner], ['C', 'A', 'C']);
  assert.equal(b.statsMatches.length, 1);
  assert.deepEqual(b.statsMatches[0].teams, ['C', 'A']);
});

test('a withdrawn team with no results leaves the table', () => {
  const teams = [team('A', 1), team('B', 2), { ...team('C', 3), withdrawn: true }];
  const t = run(teams, [fx('1', ref('A'), ref('B')), fx('2', ref('A'), ref('C'), { status: 'cancelled' })], [match('a', '1', ['A', 'B'], [20, 12], [10, 12])]);
  assert.deepEqual(t.table().map((r) => r.teamId), ['A', 'B']);
  assert.equal(t.gamesPerTeam, 1);
});
