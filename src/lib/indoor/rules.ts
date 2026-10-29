// Indoor cricket match settings. Everything a group might agree on the day is data here,
// so the engine never hard-codes a rule. Plain types only (no enums): the tests run this
// file directly with Node's type stripping.

export type RebowlPolicy = 'never' | 'finalOver' | 'always';
export type InningsEnd = 'chaseStops' | 'allOvers';

export type DismissalKind =
  | 'bowled'
  | 'caught' // caught directly
  | 'caughtOffWall' // off a side wall before touching the floor
  | 'caughtOffKeeperWall' // off the wall behind the keeper
  | 'ceiling' // struck ball hits the ceiling directly
  | 'ceilingCaught' // wall then ceiling, caught before the floor
  | 'runOut'
  | 'stumped'
  | 'hitWicket'
  | 'lbw'
  | 'obstructing'
  | 'retiredOut';

export const DISMISSAL_LABEL: Record<DismissalKind, string> = {
  bowled: 'Bowled',
  caught: 'Caught',
  caughtOffWall: 'Caught off side wall',
  caughtOffKeeperWall: 'Caught off keeper wall',
  ceiling: 'Hit the ceiling',
  ceilingCaught: 'Caught off wall and ceiling',
  runOut: 'Run out',
  stumped: 'Stumped',
  hitWicket: 'Hit wicket',
  lbw: 'LBW',
  obstructing: 'Obstructing the field',
  retiredOut: 'Retired out',
};

// Dismissals that can still happen on a free hit.
export const FREE_HIT_DISMISSALS: DismissalKind[] = ['runOut', 'obstructing', 'retiredOut'];
// Off a no ball the batter can only be out the same ways, and off a wide only these.
export const NO_BALL_DISMISSALS: DismissalKind[] = FREE_HIT_DISMISSALS;
export const WIDE_DISMISSALS: DismissalKind[] = ['stumped', 'runOut', 'hitWicket', 'obstructing', 'retiredOut'];

// A surface the struck ball can hit first. Walls are as seen by the batter on strike.
export type Zone = {
  id: string;
  label: string;
  // Where it sits on the court diagram.
  area: 'nearLeft' | 'nearRight' | 'farLeft' | 'farRight' | 'farLeftA' | 'farLeftB' | 'farRightA' | 'farRightB' | 'farWall' | 'keeperWall' | 'ceiling';
  runs: number; // added for a struck ball, bye or leg bye whose first hit is this surface
  allowRunning: boolean; // can the batters still run after the ball hits it
  catchOffIsOut: boolean; // a catch after the ball hits this surface is out
  boundary: boolean; // shown as a boundary in stats and on the chips
  enabled: boolean;
  mergedRuns?: number; // on a split half: what the whole wall scored, so merging brings it back
};

export type IndoorRules = {
  schema: 1;
  presetId: string;
  name: string;
  match: {
    oversPerInnings: number;
    ballsPerOver: number;
    minPlayers: number;
    maxOversPerBowler: number | null;
    consecutiveOversAllowed: boolean;
    swapEndsAtOverEnd: boolean; // batters change ends after each over, as in outdoor cricket
    inningsEnd: InningsEnd;
  };
  zones: Zone[];
  running: {
    maxRunsPerBall: number | null;
    wallRunsNeedACompletedRun: boolean; // wall runs only count if at least one run is run
    deadBallMaxRuns: number; // a dead ball keeps the wall runs plus at most this many run (league: 1)
  };
  extras: {
    wideRuns: number;
    noBallRuns: number;
    // never: always counts as a ball. finalOver: counts as a ball except in the last over, where it is re-bowled.
    rebowl: RebowlPolicy;
    runsRunOnWideCount: boolean;
    byeWallRuns: number | null; // byes and leg byes off any wall score this instead of the wall value (league: 1)
    byesAllowed: boolean;
    legByesAllowed: boolean;
    freeHitAfterNoBall: boolean;
  };
  wickets: {
    penalty: number; // runs taken off the team for each wicket (league: 5)
    alsoFromBatter: boolean; // take the penalty off the dismissed batter's own score too
    wicketBallScoresNothing: boolean; // no runs, extras or wall runs on a wicket ball
    shortSide: { enabled: boolean; maxPlayers: number; everyNth: number; penalty: number }; // league: 5 or fewer players, every 4th wicket is -10
    allOutPenalty: number; // extra runs off when the whole side has been dismissed once (0 = none)
    onAllOut: 'continue' | 'endInnings';
    retiredRejoinQueue: boolean; // retired batters come back with the dismissed ones
    newBatterNonStrikerAfterLastBall: boolean; // league: incoming batter takes the non-striker's end
    allowed: DismissalKind[];
  };
  batting: {
    retireAt: number | null; // individual runs in one visit (extras not counted)
    capAtRetire: boolean; // show the batter on the retire score, not above it (team keeps all runs)
  };
  penalties: { behaviourRuns: number };
  points: { win: number; tie: number; loss: number };
};

export type RulesPatch = {
  [K in keyof IndoorRules]?: IndoorRules[K] extends Array<unknown>
    ? IndoorRules[K]
    : IndoorRules[K] extends object
      ? Partial<IndoorRules[K]>
      : IndoorRules[K];
};

// Court order for lists and the diagram: far wall, far halves, near halves, keeper wall.
const AREA_ORDER: Zone['area'][] = ['farWall', 'farLeftB', 'farLeft', 'farLeftA', 'farRightB', 'farRight', 'farRightA', 'nearLeft', 'nearRight', 'keeperWall', 'ceiling'];

// One copy of each wall, in court order. A side split into halves drops its whole-wall zone.
export function normaliseZones(zones: Zone[]): Zone[] {
  const seen = new Set<string>();
  const unique = zones.filter((z) => (seen.has(z.id) ? false : (seen.add(z.id), true)));
  const halves = new Set(unique.filter((z) => /^far(Left|Right)[AB]$/.test(z.area)).map((z) => z.area.slice(0, -1)));
  return unique
    .filter((z) => !halves.has(z.area))
    .map((z, i) => ({ z, i }))
    .sort((a, b) => AREA_ORDER.indexOf(a.z.area) - AREA_ORDER.indexOf(b.z.area) || a.i - b.i)
    .map(({ z }) => z);
}

export function isSplit(zones: Zone[]): boolean {
  return zones.some((z) => z.area === 'farLeftA' || z.area === 'farRightA');
}

// Far side walls into a first half (1) and second half (2), keeping each wall's switches.
export function splitFarWalls(zones: Zone[]): Zone[] {
  const out: Zone[] = [];
  for (const z of normaliseZones(zones)) {
    const side = z.area === 'farLeft' ? 'Left' : z.area === 'farRight' ? 'Right' : null;
    if (!side) {
      out.push(z);
      continue;
    }
    const half = (part: 'A' | 'B'): Zone => ({
      ...z,
      id: `far${side}${part}`,
      area: `far${side}${part}`,
      label: `${z.label}, ${part === 'A' ? 'first' : 'second'} half`,
      runs: part === 'A' ? 1 : 2,
      mergedRuns: z.runs,
    });
    out.push(half('A'), half('B'));
  }
  return normaliseZones(out);
}

// Back to one zone per far side wall, as it was before the split.
export function mergeFarWalls(zones: Zone[]): Zone[] {
  const out: Zone[] = [];
  for (const z of normaliseZones(zones)) {
    const m = /^far(Left|Right)([AB])$/.exec(z.area);
    if (!m) {
      out.push(z);
      continue;
    }
    if (m[2] === 'B') continue;
    const { mergedRuns, ...rest } = z;
    out.push({
      ...rest,
      id: `far${m[1]}`,
      area: `far${m[1]}` as Zone['area'],
      label: z.label.replace(/, first half$/, ''),
      runs: mergedRuns ?? zones.find((x) => x.area === `far${m[1]}B`)?.runs ?? z.runs,
    });
  }
  return normaliseZones(out);
}

// Applies a mid-match change. Nested groups merge, zone lists replace.
export function applyRulesPatch(rules: IndoorRules, patch: RulesPatch): IndoorRules {
  const next = { ...rules } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    const current = (rules as unknown as Record<string, unknown>)[key];
    next[key] =
      value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object' && !Array.isArray(current)
        ? { ...(current as object), ...(value as object) }
        : value;
  }
  if (patch.zones) next.zones = normaliseZones(patch.zones);
  return next as unknown as IndoorRules;
}

export function cloneRules(rules: IndoorRules): IndoorRules {
  return JSON.parse(JSON.stringify(rules)) as IndoorRules;
}

// Is this over (0 based) the last one of the innings?
export function isFinalOver(rules: IndoorRules, overIndex: number, oversLimit: number): boolean {
  return overIndex >= oversLimit - 1 && rules.match.oversPerInnings > 0;
}

// Does a wide or no ball count as one of the over?
export function extraCountsAsBall(rules: IndoorRules, finalOver: boolean): boolean {
  if (rules.extras.rebowl === 'never') return true;
  if (rules.extras.rebowl === 'always') return false;
  return !finalOver;
}
