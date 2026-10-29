import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { IndoorEvent } from '../engine.ts';
import { bowlerChoices, needs, replay, teamTotal } from '../engine.ts';
import { BOUNDARY_STOPS_RULES, PRESETS, QUICK_RULES, STANDARD_ZONES } from '../presets.ts';
import { DISMISSAL_LABEL } from '../rules.ts';
import { ballLabel, chaseText, resultText } from '../format.ts';
import { Log, inn0, inn1, rules, setup } from './helpers.ts';

// ---------- Wickets ----------

test('a wicket ball scores nothing but the minus 5, even with runs, a no ball and a wall', () => {
  const s = setup(rules());
  const st = new Log().bowl('b1').out('runOut', { runs: 2, extra: 'noBall', zone: 'farLeft' }).play(s);
  assert.equal(inn0(st).total, -5);
  assert.equal(inn0(st).wickets, 1);
  assert.equal(inn0(st).extras.noBalls, 0);
});

test('a stumping off a wide gives minus 5 and no wide runs', () => {
  const st = new Log().bowl('b1').out('stumped', { extra: 'wide' }).play(setup(rules()));
  assert.equal(inn0(st).total, -5);
  assert.equal(inn0(st).extras.wides, 0);
});

test('bowled off a no ball is not out and the no ball counts', () => {
  const st = new Log().bowl('b1').out('bowled', { extra: 'noBall' }).play(setup(rules()));
  assert.equal(inn0(st).wickets, 0);
  assert.equal(inn0(st).total, 2);
});

test('minus 5 comes off the batter too when that setting is on', () => {
  const on = new Log().bowl('b1').run(0, 'farFull').out().play(setup(rules()));
  assert.equal(inn0(on).batters.a1.runs, -1);
  assert.equal(inn0(on).batters.a1.scored, 4);
  assert.equal(inn0(on).total, -1);
  const off = new Log().bowl('b1').run(0, 'farFull').out().play(setup(rules({ wickets: { alsoFromBatter: false } })));
  assert.equal(inn0(off).batters.a1.runs, 4);
  assert.equal(inn0(off).total, -1);
});

test('with 5 or fewer players every 4th wicket is minus 10', () => {
  const r = rules({ wickets: { allOutPenalty: 0 } });
  const short = new Log().bowl('b1').out().out().out().out().play(setup(r, 5));
  assert.equal(inn0(short).total, -25);
  const full = new Log().bowl('b1').out().out().out().out().play(setup(r, 6));
  assert.equal(inn0(full).total, -20);
});

test('batters return in the order they got out once everyone has batted', () => {
  // Four players: a1 and a2 open. a1 out, a3 out, a4 out (whole side out once), then a1 again.
  const r = rules({ wickets: { shortSide: { enabled: false, maxPlayers: 5, everyNth: 4, penalty: 10 } } });
  const st = new Log().bowl('b1').out().out().out().play(setup(r, 4));
  const i = inn0(st);
  assert.equal(i.striker, 'a1');
  assert.equal(i.nonStriker, 'a2');
  assert.deepEqual(i.queue.returning, ['a3', 'a4']);
  const st2 = new Log().bowl('b1').out().out().out().out().play(setup(r, 4));
  assert.equal(inn0(st2).striker, 'a3');
});

test('an extra all out penalty lands when the whole side has been out once', () => {
  const r = rules({ wickets: { allOutPenalty: 10, shortSide: { enabled: false, maxPlayers: 5, everyNth: 4, penalty: 10 } } });
  const st = new Log().bowl('b1').out().out().out().play(setup(r, 4));
  assert.equal(inn0(st).total, -25);
  assert.equal(inn0(st).allOuts, 1);
  const none = new Log().bowl('b1').out().out().out().play(setup(rules({ wickets: { shortSide: { enabled: false, maxPlayers: 5, everyNth: 4, penalty: 10 } } }), 4));
  assert.equal(inn0(none).total, -15);
});

test('all out can end the innings instead', () => {
  const r = rules({ wickets: { onAllOut: 'endInnings' } });
  const st = new Log().bowl('b1').out().out().play(setup(r, 3));
  assert.equal(inn0(st).complete, true);
  assert.equal(inn0(st).endReason, 'allOut');
  assert.equal(st.current, 1);
});

// ---------- Walls ----------

test('far wall: 4 on the full plus 0 run, 6 after a bounce plus 1 run', () => {
  const st = new Log().bowl('b1').run(0, 'farFull').run(1, 'farBounce').play(setup(rules()));
  assert.equal(inn0(st).batters.a1.runs, 11);
  assert.equal(inn0(st).total, 11);
  assert.equal(inn0(st).striker, 'a2'); // one run run, so they crossed
  assert.equal(inn0(st).batters.a1.boundaries, 2);
});

test('side walls: near half 1 plus running, far half 2 plus running', () => {
  const st = new Log().bowl('b1').run(1, 'nearLeft').run(1, 'farRight').play(setup(rules()));
  assert.equal(inn0(st).batters.a1.runs, 2);
  assert.equal(inn0(st).batters.a2.runs, 3);
});

test('a side wall split into custom halves scores each half', () => {
  const zones = [
    ...STANDARD_ZONES.filter((z) => z.id !== 'farLeft'),
    { id: 'farLeftA', label: 'Far side wall, left, first half', area: 'farLeftA' as const, runs: 1, allowRunning: true, catchOffIsOut: true, boundary: false, enabled: true },
    { id: 'farLeftB', label: 'Far side wall, left, second half', area: 'farLeftB' as const, runs: 2, allowRunning: true, catchOffIsOut: true, boundary: false, enabled: true },
  ];
  const st = new Log().bowl('b1').run(2, 'farLeftA').run(2, 'farLeftB').play(setup(rules({ zones })));
  assert.equal(inn0(st).batters.a1.runs, 7);
});

test('no running after a boundary when the house rule is on', () => {
  const st = new Log().bowl('b1').run(2, 'farFull').run(1, 'farBounce').play(setup(BOUNDARY_STOPS_RULES));
  assert.equal(inn0(st).total, 10);
  assert.equal(inn0(st).striker, 'a1');
});

test('wall runs can require a completed run, boundary walls always pay', () => {
  const r = rules({ running: { wallRunsNeedACompletedRun: true } });
  const st = new Log().bowl('b1').run(0, 'nearLeft').run(2, 'nearLeft').run(0, 'farFull').play(setup(r));
  assert.equal(inn0(st).total, 0 + 3 + 4);
});

test('a dead ball keeps at most 1 run', () => {
  const st = new Log().bowl('b1').ball({ runs: 3, deadBall: true }).play(setup(rules()));
  assert.equal(inn0(st).total, 1);
});

test('a running limit per ball', () => {
  const st = new Log().bowl('b1').run(5, 'nearLeft').play(setup(rules({ running: { maxRunsPerBall: 3 } })));
  assert.equal(inn0(st).total, 4);
});

test('byes and leg byes off any wall score 1 plus running', () => {
  const st = new Log().bowl('b1').extra('bye', 1, 'farLeft').extra('legBye', 0, 'keeper').play(setup(rules()));
  assert.equal(inn0(st).extras.byes, 2);
  assert.equal(inn0(st).extras.legByes, 1);
  assert.equal(inn0(st).batters.a1.runs + inn0(st).batters.a2.runs, 0);
});

test('byes switched off count nothing', () => {
  const st = new Log().bowl('b1').extra('bye', 2, 'keeper').play(setup(rules({ extras: { byesAllowed: false } })));
  assert.equal(inn0(st).total, 0);
});

// ---------- Dismissals by surface ----------

test('hitting the ceiling is out', () => {
  const st = new Log().bowl('b1').out('ceiling').play(setup(rules()));
  assert.equal(inn0(st).wickets, 1);
  assert.equal(inn0(st).bowlers.b1.wickets, 1);
});

test('a catch off the keeper wall counts, a catch off the far wall does not', () => {
  const st = new Log().bowl('b1').out('caughtOffKeeperWall', { zone: 'keeper' }).play(setup(rules()));
  assert.equal(inn0(st).wickets, 1);
  const far = new Log().bowl('b1').out('caughtOffWall', { zone: 'farFull' }).play(setup(rules()));
  assert.equal(inn0(far).wickets, 0);
  assert.equal(inn0(far).total, 4); // not out, so the wall still pays
});

test('a dismissal that is switched off does not stand', () => {
  const r = rules({ wickets: { allowed: ['bowled', 'caught', 'runOut'] } });
  const st = new Log().bowl('b1').out('ceiling').play(setup(r));
  assert.equal(inn0(st).wickets, 0);
});

test('free hit after a no ball: bowled does not count, run out does', () => {
  const r = rules({ extras: { freeHitAfterNoBall: true } });
  const st = new Log().bowl('b1').extra('noBall').out('bowled').out('bowled').play(setup(r));
  assert.equal(inn0(st).wickets, 1);
  const ro = new Log().bowl('b1').extra('noBall').out('runOut').play(setup(r));
  assert.equal(inn0(ro).wickets, 1);
});

// ---------- Extras and the final over ----------

test('a wide counts as a ball of the over, except in the final over where it is bowled again', () => {
  const r = rules({ match: { oversPerInnings: 2 } });
  const st = new Log().bowl('b1').extra('wide').dots(5).bowl('b2').extra('wide').extra('noBall').dots(5).play(setup(r));
  const i = inn0(st);
  assert.equal(i.overs[0].balls.length, 6);
  assert.equal(i.overs[1].balls.length, 7);
  assert.equal(i.legalBalls, 11);
  assert.equal(i.complete, false); // one ball still to bowl, because both extras were re-bowled
  assert.equal(i.total, 6);
  const done = new Log().bowl('b1').extra('wide').dots(5).bowl('b2').extra('wide').extra('noBall').dots(6).play(setup(r));
  assert.equal(inn0(done).complete, true);
  assert.equal(inn0(done).overs[1].balls[0].finalOver, true);
});

test('every preset re-bowls extras in the final over', () => {
  for (const p of PRESETS) assert.equal(p.extras.rebowl, 'finalOver', p.name);
});

test('re-bowl can be set to never or always', () => {
  const never = new Log().bowl('b1').extra('wide').dots(5).play(setup(rules({ match: { oversPerInnings: 1 }, extras: { rebowl: 'never' } })));
  assert.equal(inn0(never).complete, true);
  const always = new Log().bowl('b1').extra('wide').dots(5).play(setup(rules({ match: { oversPerInnings: 3 }, extras: { rebowl: 'always' } })));
  assert.equal(inn0(always).legalBalls, 5);
});

test('wides and no balls are 2 runs, and the no ball adds what the batter hit', () => {
  const st = new Log().bowl('b1').extra('wide').extra('noBall', 1, 'nearRight').play(setup(rules()));
  assert.equal(inn0(st).total, 2 + 2 + 2);
  assert.equal(inn0(st).batters.a1.runs, 2);
  assert.equal(inn0(st).bowlers.b1.runs, 6);
});

// ---------- Retirement ----------

test('a batter retires at the set score, with no minus 5, and the next one comes in', () => {
  const st = new Log().bowl('b1').run(0, 'farBounce').run(0, 'farBounce').run(0, 'farBounce').run(0, 'farBounce').run(0, 'farBounce').play(setup(rules()));
  const i = inn0(st);
  assert.equal(i.batters.a1.status, 'retired');
  assert.equal(i.batters.a1.runs, 30);
  assert.equal(i.wickets, 0);
  assert.equal(i.total, 30);
  assert.equal(i.striker, 'a3');
});

test('runs past the retire score can be kept or capped', () => {
  const keep = new Log().bowl('b1').run(0, 'farBounce').run(1, 'farBounce').play(setup(rules({ batting: { retireAt: 10 } })));
  assert.equal(inn0(keep).batters.a1.runs, 13);
  const cap = new Log().bowl('b1').run(0, 'farBounce').run(1, 'farBounce').play(setup(rules({ batting: { retireAt: 10, capAtRetire: true } })));
  assert.equal(inn0(cap).batters.a1.runs, 10);
  assert.equal(inn0(cap).total, 13);
  // The batter retired after a single, so the new batter takes the far end.
  assert.equal(inn0(cap).nonStriker, 'a3');
});

test('no retirement when it is switched off', () => {
  const l = new Log().bowl('b1');
  for (let k = 0; k < 6; k++) l.run(0, 'farBounce');
  const st = l.play(setup(rules({ batting: { retireAt: null } })));
  assert.equal(inn0(st).batters.a1.status, 'batting');
});

test('retired batters come back after everyone, in the order they left', () => {
  const r = rules({ batting: { retireAt: 6 }, wickets: { shortSide: { enabled: false, maxPlayers: 5, everyNth: 4, penalty: 10 } } });
  // a1 retires, a3 out, a4 out: a1 left first, so a1 is back first.
  const st = new Log().bowl('b1').run(0, 'farBounce').out().out().play(setup(r, 4));
  assert.equal(inn0(st).striker, 'a1');
});

test('a voluntary retirement is not out, retired out costs the penalty', () => {
  const st = new Log().bowl('b1').event({ type: 'retire', data: { who: 'striker', out: false } } as IndoorEvent).play(setup(rules()));
  assert.equal(inn0(st).total, 0);
  const ro = new Log().bowl('b1').event({ type: 'retire', data: { who: 'striker', out: true } } as IndoorEvent).play(setup(rules()));
  assert.equal(inn0(ro).total, -5);
});

// ---------- Strike ----------

test('strike changes on odd runs and at the end of the over', () => {
  const st = new Log().bowl('b1').run(1).run(2).dots(4).play(setup(rules()));
  assert.equal(inn0(st).striker, 'a1');
  assert.equal(needs(st), 'bowler');
});

test('a last ball wicket brings the new batter in at the non striker end', () => {
  const r = rules({ match: { swapEndsAtOverEnd: false } });
  const st = new Log().bowl('b1').dots(5).out().play(setup(r));
  assert.equal(inn0(st).striker, 'a2');
  assert.equal(inn0(st).nonStriker, 'a3');
  const off = new Log().bowl('b1').dots(5).out().play(setup(rules({ match: { swapEndsAtOverEnd: false }, wickets: { newBatterNonStrikerAfterLastBall: false } })));
  assert.equal(inn0(off).striker, 'a3');
  const outdoor = new Log().bowl('b1').dots(5).out().play(setup(rules()));
  assert.equal(inn0(outdoor).striker, 'a2');
});

test('the non striker can be run out', () => {
  const st = new Log().bowl('b1').out('runOut', {}, 'nonStriker').play(setup(rules()));
  assert.equal(inn0(st).batters.a2.status, 'out');
  assert.equal(inn0(st).nonStriker, 'a3');
});

test('openers can be chosen before the first ball', () => {
  const st = new Log().event({ type: 'openers', data: { strikerId: 'a4', nonStrikerId: 'a2' } } as IndoorEvent).bowl('b1').out().play(setup(rules()));
  assert.equal(inn0(st).batters.a4.status, 'out');
  assert.equal(inn0(st).striker, 'a1');
});

// ---------- Innings and result ----------

function oneOverMatch(inningsEnd: 'chaseStops' | 'allOvers') {
  const r = rules({ match: { oversPerInnings: 1, inningsEnd } });
  return new Log().bowl('b1').run(0, 'farBounce').dots(5).bowl('a1').run(1, 'farBounce').dots(5).play(setup(r));
}

test('the chase stops at the target', () => {
  const st = oneOverMatch('chaseStops');
  assert.equal(inn1(st).endReason, 'target');
  assert.equal(inn1(st).legalBalls, 1);
  assert.equal(st.status, 'complete');
  assert.equal(st.result?.winner, 1);
  assert.equal(resultText(st), 'Team B won by 1 run, with 5 balls to spare');
  assert.ok(st.warnings.length > 0); // the five dots after the end are ignored
});

test('or all the overs are bowled', () => {
  const st = oneOverMatch('allOvers');
  assert.equal(inn1(st).endReason, 'overs');
  assert.equal(inn1(st).legalBalls, 6);
  assert.equal(resultText(st), 'Team B won by 1 run');
  assert.deepEqual(st.result?.points, [0, 4]);
});

test('a tie gives both sides the tie points', () => {
  const r = rules({ match: { oversPerInnings: 1 } });
  const st = new Log().bowl('b1').run(0, 'farFull').dots(5).bowl('a1').run(0, 'farFull').dots(5).play(setup(r));
  assert.equal(resultText(st), 'Match tied');
  assert.deepEqual(st.result?.points, [2, 2]);
});

test('chasing a negative total still gets to bat', () => {
  const r = rules({ match: { oversPerInnings: 1 } });
  const st = new Log().bowl('b1').out().dots(5).bowl('a1').ball().run(1).play(setup(r));
  assert.equal(inn1(st).legalBalls, 2);
  assert.equal(inn1(st).endReason, 'target');
  assert.equal(chaseText(st), null);
});

test('overs can be cut for a late side', () => {
  const st = new Log().event({ type: 'oversChange', data: { overs: 1 } } as IndoorEvent).over('b1').play(setup(rules()));
  assert.equal(inn0(st).complete, true);
  assert.equal(inn1(st).oversLimit, 10);
});

test('a behaviour penalty changes the side total', () => {
  const st = new Log().bowl('b1').run(1).event({ type: 'penalty', data: { team: 1, runs: -5 } } as IndoorEvent).play(setup(rules()));
  assert.equal(teamTotal(st, 1), -5);
  assert.equal(teamTotal(st, 0), 1);
});

test('a late player joins the end of the batting order', () => {
  const st = new Log()
    .event({ type: 'addPlayer', data: { team: 0, player: { id: 'late', name: 'Late' } } } as IndoorEvent)
    .bowl('b1')
    .out()
    .out()
    .out()
    .out()
    .play(setup(rules(), 5));
  assert.equal(inn0(st).striker, 'late');
});

test('bowler limits: maximum overs and no consecutive overs', () => {
  const st = new Log().over('b1').over('b2').over('b1').over('b2').over('b1').play(setup(rules()));
  const c = bowlerChoices(st);
  assert.equal(c.find((x) => x.id === 'b1')?.blocked, 'Used all overs');
  const st2 = new Log().over('b2').play(setup(rules()));
  assert.equal(bowlerChoices(st2).find((x) => x.id === 'b2')?.blocked, 'Bowled the last over');
  assert.equal(bowlerChoices(st2).find((x) => x.id === 'b3')?.blocked, null);
});

// ---------- Replay ----------

const ball = (id: string, seq: number, data: Record<string, unknown>): IndoorEvent =>
  ({ id, seq, type: 'ball', data: { zone: null, runs: 0, extra: null, wicket: null, ...data } }) as IndoorEvent;

test('undo, edit and insert give the same state as a clean replay', () => {
  const s = setup(rules());
  const start: IndoorEvent = { id: 'o1', seq: 0, type: 'overStart', data: { bowlerId: 'b1' } };
  const clean = [start, ball('x1', 1, { runs: 1 }), ball('x2', 2, { zone: 'farFull' }), ball('x3', 3, { wicket: { kind: 'bowled', who: 'striker' } }), ball('x4', 4, { runs: 2, zone: 'nearLeft' })];
  const want = replay(s, clean);

  const undone = replay(s, [...clean, { ...ball('x5', 5, { zone: 'farBounce' }), deleted: true }]);
  assert.deepEqual(undone.innings, want.innings);

  const missing = clean.filter((e) => e.id !== 'x2');
  const inserted = replay(s, [...missing, ball('x2', 1.5, { zone: 'farFull' })]);
  const cleanReseq = replay(s, clean.map((e) => (e.id === 'x2' ? { ...e, seq: 1.5 } : e)));
  assert.deepEqual(inserted.innings, cleanReseq.innings);
  assert.equal(inserted.innings[0].total, want.innings[0].total);

  const wrong = clean.map((e) => (e.id === 'x2' ? ball('x2', 2, { zone: 'nearRight' }) : e));
  const edited = wrong.map((e) => (e.id === 'x2' ? ball('x2', 2, { zone: 'farFull' }) : e));
  assert.notDeepEqual(replay(s, wrong).innings, want.innings);
  assert.deepEqual(replay(s, edited).innings, want.innings);
});

test('events in any order replay by sequence', () => {
  const s = setup(rules());
  const evs: IndoorEvent[] = [ball('x2', 2, { zone: 'farFull' }), { id: 'o1', seq: 0, type: 'overStart', data: { bowlerId: 'b1' } }, ball('x1', 1, { runs: 1 })];
  assert.equal(replay(s, evs).innings[0].batters.a2.runs, 4);
});

test('a rule change mid match only affects later balls', () => {
  const st = new Log()
    .bowl('b1')
    .out()
    .event({ type: 'rulesChange', data: { patch: { wickets: { penalty: 10 } }, note: 'Agreed at the break' } } as IndoorEvent)
    .out()
    .play(setup(rules()));
  assert.equal(inn0(st).total, -15);
  assert.equal(st.rulesLog.length, 1);
  assert.equal(st.rulesLog[0].overs, '0.1');
});

// ---------- Presets and copy ----------

test('presets and labels carry no club or league names', () => {
  const text = JSON.stringify(PRESETS) + JSON.stringify(DISMISSAL_LABEL);
  assert.doesNotMatch(text, /spartan|prague|praha|čmks|cmks|vinoř|vinor|union|club/i);
});

test('labels use no dashes or semicolons', () => {
  const text = JSON.stringify(PRESETS.map((p) => [p.name, p.zones.map((z) => z.label)])) + JSON.stringify(DISMISSAL_LABEL);
  assert.doesNotMatch(text, /[–—;]/);
});

test('quick game: every wall is 1 plus running, no retirement', () => {
  const l = new Log().bowl('b1');
  for (let k = 0; k < 6; k++) l.run(1, 'farFull');
  const st = l.play(setup(QUICK_RULES));
  assert.equal(inn0(st).total, 12);
  assert.equal(inn0(st).batters.a1.status, 'batting');
});

test('ball chips read like a scorecard', () => {
  const st = new Log().bowl('b1').run(0, 'farFull').extra('wide').extra('noBall', 1).extra('bye', 1).out().play(setup(rules()));
  assert.deepEqual(inn0(st).overs[0].balls.map(ballLabel), ['4', '2wd', '3nb', '1b', 'W -5']);
});
