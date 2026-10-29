// Rebuilds a whole indoor match from its event list. Nothing is stored except the events, so
// undo, editing an old ball, inserting a missed one or changing a rule mid match all come
// down to running replay() again.

import type { DismissalKind, IndoorRules, RulesPatch } from './rules.ts';
import { applyRulesPatch, cloneRules, isFinalOver } from './rules.ts';
import type { BallInput, BallValue, End, WicketInput } from './scoring.ts';
import { scoreBall } from './scoring.ts';
import type { BattingQueue } from './queue.ts';
import { addLatePlayer, callNext, depart, newQueue } from './queue.ts';

export type TeamIndex = 0 | 1;
export type Player = { id: string; name: string };
export type TeamSetup = { name: string; players: Player[] }; // players in batting order

export type MatchSetup = {
  teams: [TeamSetup, TeamSetup];
  battingFirst: TeamIndex;
  rules: IndoorRules;
};

export type EventData =
  | { type: 'ball'; data: BallInput }
  | { type: 'overStart'; data: { bowlerId: string } }
  | { type: 'openers'; data: { strikerId: string; nonStrikerId: string } }
  | { type: 'swapStrike'; data: Record<string, never> }
  | { type: 'retire'; data: { who: End; out: boolean } }
  | { type: 'nextBatter'; data: { playerId: string } }
  | { type: 'penalty'; data: { team: TeamIndex; runs: number; note?: string } }
  | { type: 'rulesChange'; data: { patch: RulesPatch; note?: string } }
  | { type: 'oversChange'; data: { overs: number } }
  | { type: 'addPlayer'; data: { team: TeamIndex; player: Player } }
  | { type: 'inningsEnd'; data: { reason?: string } };

export type EventType = EventData['type'];
export type IndoorEvent = { id: string; seq: number; deleted?: boolean } & EventData;

export type BatterLine = {
  id: string;
  name: string;
  runs: number; // shown on the card: after wicket penalties (if they come off the batter) and any cap
  scored: number; // every run credited off the bat
  balls: number;
  outs: number;
  penaltyRuns: number;
  visits: number;
  visitRuns: number; // runs in the current or last visit, for retirement
  status: 'yet' | 'batting' | 'out' | 'retired';
  howOut: DismissalKind | null;
  zoneHits: Record<string, number>;
  boundaries: number;
};

export type BowlerLine = { id: string; name: string; balls: number; runs: number; wickets: number; wides: number; noBalls: number; overs: number[] };

export type BallRecord = {
  eventId: string;
  over: number; // 0 based
  ballOfOver: number; // legal balls in the over after this one
  legal: boolean;
  input: BallInput;
  value: BallValue;
  strikerId: string;
  bowlerId: string | null;
  dismissedId: string | null;
  penalty: number; // runs taken off for the wicket (and all out, if any)
  allOut: boolean;
  freeHit: boolean;
  finalOver: boolean;
  retiredId: string | null;
  totalAfter: number;
  wicketsAfter: number;
};

export type OverRecord = { index: number; bowlerId: string | null; balls: BallRecord[] };

export type EndReason = 'overs' | 'target' | 'allOut' | 'declared';

export type InningsState = {
  index: TeamIndex;
  batting: TeamIndex;
  bowling: TeamIndex;
  total: number; // includes wicket penalties, not behaviour penalties (those sit in adjustments)
  wickets: number;
  legalBalls: number;
  oversLimit: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  wicketPenalties: number;
  striker: string | null;
  nonStriker: string | null;
  bowler: string | null;
  lastOverBowler: string | null;
  queue: BattingQueue;
  batters: Record<string, BatterLine>;
  battingOrder: string[]; // in the order they first came in
  bowlers: Record<string, BowlerLine>;
  bowlingOrder: string[];
  overs: OverRecord[];
  fow: { wicket: number; score: number; playerId: string; overs: string }[];
  partnership: { runs: number; balls: number };
  cycleOuts: number;
  allOuts: number;
  freeHit: boolean;
  complete: boolean;
  endReason: EndReason | null;
};

export type Result = { winner: TeamIndex | null; margin: number; byChase: boolean; ballsLeft: number; points: [number, number] };

export type RulesLogEntry = { eventId: string; innings: TeamIndex; overs: string; patch: RulesPatch; note?: string };

export type MatchState = {
  setup: MatchSetup;
  rules: IndoorRules;
  teams: [TeamSetup, TeamSetup];
  innings: InningsState[];
  current: TeamIndex;
  adjustments: [number, number];
  penaltiesLog: { eventId: string; team: TeamIndex; runs: number; note?: string }[];
  rulesLog: RulesLogEntry[];
  status: 'live' | 'complete';
  result: Result | null;
  warnings: string[];
};

const BOWLER_CREDIT: DismissalKind[] = ['bowled', 'caught', 'caughtOffWall', 'caughtOffKeeperWall', 'ceiling', 'ceilingCaught', 'stumped', 'hitWicket', 'lbw'];

export function oversText(legalBalls: number, ballsPerOver: number): string {
  return `${Math.floor(legalBalls / ballsPerOver)}.${legalBalls % ballsPerOver}`;
}

export function teamTotal(state: MatchState, team: TeamIndex): number {
  const inn = state.innings.find((i) => i.batting === team);
  return (inn ? inn.total : 0) + state.adjustments[team];
}

// Runs the chasing side needs to win, or null in the first innings.
export function target(state: MatchState): number | null {
  if (state.innings.length < 2) return null;
  return teamTotal(state, state.innings[0].batting) + 1;
}

export function sortEvents(events: IndoorEvent[]): IndoorEvent[] {
  return events.filter((e) => !e.deleted).sort((a, b) => a.seq - b.seq || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function replay(setup: MatchSetup, events: IndoorEvent[]): MatchState {
  const state: MatchState = {
    setup,
    rules: cloneRules(setup.rules),
    teams: [
      { name: setup.teams[0].name, players: [...setup.teams[0].players] },
      { name: setup.teams[1].name, players: [...setup.teams[1].players] },
    ],
    innings: [],
    current: 0,
    adjustments: [0, 0],
    penaltiesLog: [],
    rulesLog: [],
    status: 'live',
    result: null,
    warnings: [],
  };
  state.innings.push(startInnings(state, 0, setup.battingFirst));
  for (const ev of sortEvents(events)) {
    apply(state, ev);
    advance(state);
  }
  finish(state);
  return state;
}

function nameOf(state: MatchState, team: TeamIndex, id: string): string {
  return state.teams[team].players.find((p) => p.id === id)?.name ?? 'Unknown';
}

function batterLine(id: string, name: string): BatterLine {
  return { id, name, runs: 0, scored: 0, balls: 0, outs: 0, penaltyRuns: 0, visits: 0, visitRuns: 0, status: 'yet', howOut: null, zoneHits: {}, boundaries: 0 };
}

function startInnings(state: MatchState, index: TeamIndex, batting: TeamIndex): InningsState {
  const players = state.teams[batting].players;
  const batters: Record<string, BatterLine> = {};
  for (const p of players) batters[p.id] = batterLine(p.id, p.name);
  const inn: InningsState = {
    index,
    batting,
    bowling: batting === 0 ? 1 : 0,
    total: 0,
    wickets: 0,
    legalBalls: 0,
    oversLimit: state.rules.match.oversPerInnings,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    wicketPenalties: 0,
    striker: null,
    nonStriker: null,
    bowler: null,
    lastOverBowler: null,
    queue: newQueue(players.map((p) => p.id)),
    batters,
    battingOrder: [],
    bowlers: {},
    bowlingOrder: [],
    overs: [],
    fow: [],
    partnership: { runs: 0, balls: 0 },
    cycleOuts: 0,
    allOuts: 0,
    freeHit: false,
    complete: false,
    endReason: null,
  };
  inn.striker = comeIn(inn, callNext(inn.queue, []));
  inn.nonStriker = comeIn(inn, callNext(inn.queue, [inn.striker]));
  return inn;
}

function comeIn(inn: InningsState, id: string | null): string | null {
  if (!id) return null;
  const b = inn.batters[id];
  if (!b) return null;
  b.status = 'batting';
  b.visits += 1;
  b.visitRuns = 0;
  if (!inn.battingOrder.includes(id)) inn.battingOrder.push(id);
  return id;
}

function bowlerLine(state: MatchState, inn: InningsState, id: string): BowlerLine {
  if (!inn.bowlers[id]) {
    inn.bowlers[id] = { id, name: nameOf(state, inn.bowling, id), balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, overs: [] };
    inn.bowlingOrder.push(id);
  }
  return inn.bowlers[id];
}

// The second innings opens as soon as the first one is over, so the break screen can show
// the openers and late rule changes land in the right innings.
function advance(state: MatchState): void {
  const inn = state.innings[state.current];
  if (inn.complete && state.current === 0) {
    state.current = 1;
    state.innings.push(startInnings(state, 1, inn.bowling));
  }
}

function live(state: MatchState): InningsState | null {
  const inn = state.innings[state.current];
  return inn.complete ? null : inn;
}

function hasBalls(inn: InningsState): boolean {
  return inn.overs.some((o) => o.balls.length > 0);
}

function apply(state: MatchState, ev: IndoorEvent): void {
  const rules = state.rules;
  switch (ev.type) {
    case 'rulesChange': {
      state.rules = applyRulesPatch(rules, ev.data.patch);
      const inn = state.innings[state.current];
      if (ev.data.patch.match?.oversPerInnings != null && !inn.complete) inn.oversLimit = ev.data.patch.match.oversPerInnings;
      state.rulesLog.push({ eventId: ev.id, innings: inn.index, overs: oversText(inn.legalBalls, rules.match.ballsPerOver), patch: ev.data.patch, note: ev.data.note });
      checkInningsEnd(state, inn, false);
      return;
    }
    case 'penalty': {
      state.adjustments[ev.data.team] += ev.data.runs;
      state.penaltiesLog.push({ eventId: ev.id, team: ev.data.team, runs: ev.data.runs, note: ev.data.note });
      const inn = state.innings[state.current];
      if (!inn.complete && inn.batting === ev.data.team) checkInningsEnd(state, inn, ev.data.runs > 0);
      return;
    }
    case 'addPlayer': {
      const { team, player } = ev.data;
      if (state.teams[team].players.some((p) => p.id === player.id)) return;
      state.teams[team].players.push(player);
      for (const inn of state.innings) {
        if (inn.batting !== team || inn.complete) continue;
        inn.batters[player.id] = batterLine(player.id, player.name);
        addLatePlayer(inn.queue, player.id);
        if (!inn.striker) inn.striker = comeIn(inn, callNext(inn.queue, [inn.nonStriker]));
        if (!inn.nonStriker) inn.nonStriker = comeIn(inn, callNext(inn.queue, [inn.striker]));
      }
      return;
    }
  }

  const inn = live(state);
  if (!inn) {
    state.warnings.push(`Event ${ev.id} came after the match ended`);
    return;
  }

  switch (ev.type) {
    case 'openers': {
      if (hasBalls(inn)) return void state.warnings.push(`Openers ${ev.id} came after the first ball`);
      const { strikerId, nonStrikerId } = ev.data;
      if (!inn.batters[strikerId] || !inn.batters[nonStrikerId] || strikerId === nonStrikerId) return;
      for (const b of Object.values(inn.batters)) Object.assign(b, batterLine(b.id, b.name));
      inn.battingOrder = [];
      inn.queue = newQueue(state.teams[inn.batting].players.map((p) => p.id).filter((id) => id !== strikerId && id !== nonStrikerId));
      inn.striker = comeIn(inn, strikerId);
      inn.nonStriker = comeIn(inn, nonStrikerId);
      return;
    }
    case 'overStart': {
      if (!state.teams[inn.bowling].players.some((p) => p.id === ev.data.bowlerId)) return;
      inn.bowler = ev.data.bowlerId;
      bowlerLine(state, inn, inn.bowler);
      const index = Math.floor(inn.legalBalls / rules.match.ballsPerOver);
      const over = inn.overs.find((o) => o.index === index);
      if (!over) inn.overs.push({ index, bowlerId: inn.bowler, balls: [] });
      else if (over.balls.length === 0) over.bowlerId = inn.bowler;
      return;
    }
    case 'swapStrike':
      [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
      return;
    case 'nextBatter':
      if (inn.batters[ev.data.playerId]) inn.queue.chosen = ev.data.playerId;
      return;
    case 'retire': {
      const id = ev.data.who === 'striker' ? inn.striker : inn.nonStriker;
      if (!id) return;
      if (ev.data.out) dismiss(state, inn, id, 'retiredOut', null);
      else retire(inn, id, state.rules);
      replace(inn, ev.data.who);
      partnershipReset(inn);
      checkInningsEnd(state, inn, false);
      return;
    }
    case 'oversChange': {
      const bowled = Math.ceil(inn.legalBalls / rules.match.ballsPerOver);
      inn.oversLimit = Math.max(bowled, Math.floor(ev.data.overs));
      checkInningsEnd(state, inn, false);
      return;
    }
    case 'inningsEnd':
      inn.complete = true;
      inn.endReason = 'declared';
      return;
    case 'ball':
      ball(state, inn, ev.id, ev.data);
      return;
  }
}

function partnershipReset(inn: InningsState): void {
  inn.partnership = { runs: 0, balls: 0 };
}

function retire(inn: InningsState, id: string, rules: IndoorRules): void {
  const b = inn.batters[id];
  b.status = 'retired';
  if (rules.batting.capAtRetire && rules.batting.retireAt != null && b.visitRuns > rules.batting.retireAt) {
    b.runs -= b.visitRuns - rules.batting.retireAt;
  }
  depart(inn.queue, id, 'retired', rules.wickets.retiredRejoinQueue);
}

// Takes the wicket penalty off and records the dismissal.
function dismiss(state: MatchState, inn: InningsState, id: string, kind: DismissalKind, bowlerId: string | null): { penalty: number; allOut: boolean } {
  const rules = state.rules;
  const b = inn.batters[id];
  inn.wickets += 1;
  let penalty = rules.wickets.penalty;
  const side = rules.wickets.shortSide;
  if (side.enabled && state.teams[inn.batting].players.length <= side.maxPlayers && side.everyNth > 0 && inn.wickets % side.everyNth === 0) {
    penalty = side.penalty;
  }
  b.outs += 1;
  b.status = 'out';
  b.howOut = kind;
  if (rules.wickets.alsoFromBatter) {
    b.runs -= penalty;
    b.penaltyRuns += penalty;
  }
  if (bowlerId && BOWLER_CREDIT.includes(kind)) bowlerLine(state, inn, bowlerId).wickets += 1;

  inn.cycleOuts += 1;
  let allOut = false;
  if (inn.cycleOuts >= Math.max(1, state.teams[inn.batting].players.length - 1)) {
    allOut = true;
    inn.cycleOuts = 0;
    inn.allOuts += 1;
    penalty += rules.wickets.allOutPenalty;
  }
  inn.total -= penalty;
  inn.wicketPenalties += penalty;
  inn.fow.push({ wicket: inn.wickets, score: inn.total, playerId: id, overs: oversText(inn.legalBalls, rules.match.ballsPerOver) });
  depart(inn.queue, id, 'out', rules.wickets.retiredRejoinQueue);
  if (allOut && rules.wickets.onAllOut === 'endInnings') {
    inn.complete = true;
    inn.endReason = 'allOut';
  }
  return { penalty, allOut };
}

// Fills the empty end with the next batter in the queue.
function replace(inn: InningsState, end: End): string | null {
  if (inn.complete) {
    if (end === 'striker') inn.striker = null;
    else inn.nonStriker = null;
    return null;
  }
  const other = end === 'striker' ? inn.nonStriker : inn.striker;
  const id = comeIn(inn, callNext(inn.queue, [other]));
  if (end === 'striker') inn.striker = id;
  else inn.nonStriker = id;
  return id;
}

function ball(state: MatchState, inn: InningsState, eventId: string, input: BallInput): void {
  const rules = state.rules;
  const bpo = rules.match.ballsPerOver;
  if (!inn.striker || !inn.nonStriker) {
    state.warnings.push(`Ball ${eventId} had no batter at one end`);
    return;
  }
  const overIndex = Math.floor(inn.legalBalls / bpo);
  let over = inn.overs.find((o) => o.index === overIndex);
  if (!over) {
    over = { index: overIndex, bowlerId: inn.bowler, balls: [] };
    inn.overs.push(over);
  }
  const finalOver = isFinalOver(rules, overIndex, inn.oversLimit);
  const freeHit = inn.freeHit;
  const v = scoreBall(rules, input, { finalOver, freeHit });

  const strikerId = inn.striker;
  const striker = inn.batters[strikerId];
  const bowler = inn.bowler ? bowlerLine(state, inn, inn.bowler) : null;

  // Runs
  inn.total += v.teamRuns;
  striker.scored += v.batterRuns;
  striker.runs += v.batterRuns;
  striker.visitRuns += v.batterRuns;
  if (v.faced) striker.balls += 1;
  if (v.struckZone) {
    striker.zoneHits[v.struckZone.id] = (striker.zoneHits[v.struckZone.id] ?? 0) + 1;
    if (v.struckZone.boundary) striker.boundaries += 1;
  }
  const extra = input.extra;
  if (extra === 'wide') inn.extras.wides += v.extraRuns;
  if (extra === 'noBall') inn.extras.noBalls += v.extraRuns;
  if (extra === 'bye') inn.extras.byes += v.extraRuns;
  if (extra === 'legBye') inn.extras.legByes += v.extraRuns;
  if (bowler) {
    bowler.runs += v.batterRuns + (extra === 'wide' || extra === 'noBall' ? v.extraRuns : 0);
    if (v.legal) bowler.balls += 1;
    if (extra === 'wide') bowler.wides += 1;
    if (extra === 'noBall') bowler.noBalls += 1;
    if (!bowler.overs.includes(overIndex)) bowler.overs.push(overIndex);
  }
  inn.partnership.runs += v.teamRuns;
  if (v.legal) {
    inn.legalBalls += 1;
    inn.partnership.balls += 1;
  }

  // Free hit carries over a wide, and a new no ball gives another one.
  inn.freeHit = extra === 'noBall' ? rules.extras.freeHitAfterNoBall : extra === 'wide' ? freeHit : false;

  // Who was out is decided by the end at the time of the delivery.
  const dismissedId = v.wicket ? (v.wicket.who === 'striker' ? inn.striker : inn.nonStriker) : null;
  if (v.runsRun % 2 === 1) [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];

  let penalty = 0;
  let allOut = false;
  let incoming: string | null = null;
  if (v.wicket && dismissedId) {
    const res = dismiss(state, inn, dismissedId, v.wicket.kind, inn.bowler);
    penalty = res.penalty;
    allOut = res.allOut;
    partnershipReset(inn);
    incoming = replace(inn, inn.striker === dismissedId ? 'striker' : 'nonStriker');
  }

  // Retirement at the set score (no penalty).
  let retiredId: string | null = null;
  const retireAt = rules.batting.retireAt;
  if (retireAt != null && striker.status === 'batting' && striker.visitRuns >= retireAt) {
    retiredId = striker.id;
    retire(inn, striker.id, rules);
    partnershipReset(inn);
    incoming = replace(inn, inn.striker === striker.id ? 'striker' : 'nonStriker');
  }

  const overDone = v.legal && inn.legalBalls % bpo === 0;
  if (overDone) {
    if (rules.match.swapEndsAtOverEnd) [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
    // A batter coming in off the last ball of an over starts at the non-striker's end.
    if (incoming && rules.wickets.newBatterNonStrikerAfterLastBall && inn.striker === incoming) {
      [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
    }
    inn.lastOverBowler = inn.bowler;
    inn.bowler = null;
  }

  over.balls.push({
    eventId,
    over: overIndex,
    ballOfOver: inn.legalBalls - overIndex * bpo,
    legal: v.legal,
    input,
    value: v,
    strikerId,
    bowlerId: bowler ? bowler.id : null,
    dismissedId: v.wicket ? dismissedId : null,
    penalty,
    allOut,
    freeHit,
    finalOver,
    retiredId,
    totalAfter: inn.total,
    wicketsAfter: inn.wickets,
  });

  checkInningsEnd(state, inn, v.teamRuns > 0);
}

function checkInningsEnd(state: MatchState, inn: InningsState, scored: boolean): void {
  if (inn.complete) return;
  if (inn.oversLimit > 0 && inn.legalBalls >= inn.oversLimit * state.rules.match.ballsPerOver) {
    inn.complete = true;
    inn.endReason = 'overs';
    return;
  }
  // Chasing side passes the target. Only checked when runs go on, so a chase of a negative
  // total still gets to bat.
  const t = inn.index === 1 ? target(state) : null;
  if (t != null && scored && state.rules.match.inningsEnd === 'chaseStops' && teamTotal(state, inn.batting) >= t) {
    inn.complete = true;
    inn.endReason = 'target';
  }
}

function finish(state: MatchState): void {
  const last = state.innings[state.innings.length - 1];
  if (state.innings.length < 2 || !last.complete) return;
  state.status = 'complete';
  const first = state.innings[0].batting;
  const second = last.batting;
  const a = teamTotal(state, first);
  const b = teamTotal(state, second);
  const { win, tie, loss } = state.rules.points;
  const points: [number, number] = [0, 0];
  if (a === b) {
    points[first] = tie;
    points[second] = tie;
    state.result = { winner: null, margin: 0, byChase: false, ballsLeft: 0, points };
    return;
  }
  const winner = a > b ? first : second;
  points[winner] = win;
  points[winner === 0 ? 1 : 0] = loss;
  const byChase = winner === second && last.endReason === 'target';
  const ballsLeft = byChase ? Math.max(0, last.oversLimit * state.rules.match.ballsPerOver - last.legalBalls) : 0;
  state.result = { winner, margin: Math.abs(a - b), byChase, ballsLeft, points };
}

// Bowlers the scorer can pick for the next over, with the reason a bowler is not available.
export function bowlerChoices(state: MatchState): { id: string; name: string; overs: number; blocked: string | null }[] {
  const inn = state.innings[state.current];
  const rules = state.rules;
  return state.teams[inn.bowling].players.map((p) => {
    const line = inn.bowlers[p.id];
    const overs = line ? line.overs.length : 0;
    let blocked: string | null = null;
    if (rules.match.maxOversPerBowler != null && overs >= rules.match.maxOversPerBowler) blocked = 'Used all overs';
    else if (!rules.match.consecutiveOversAllowed && inn.lastOverBowler === p.id) blocked = 'Bowled the last over';
    return { id: p.id, name: p.name, overs, blocked };
  });
}

export type Needs = 'bowler' | 'batter' | 'nothing' | 'done';

// What the scorer has to do before the next ball.
export function needs(state: MatchState): Needs {
  const inn = state.innings[state.current];
  if (state.status === 'complete' || inn.complete) return 'done';
  if (!inn.striker || !inn.nonStriker) return 'batter';
  if (!inn.bowler) return 'bowler';
  return 'nothing';
}

export function currentInnings(state: MatchState): InningsState {
  return state.innings[state.current];
}

export type { WicketInput };
