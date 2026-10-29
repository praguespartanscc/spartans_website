import type { DismissalKind, IndoorRules, Zone } from './rules.ts';
import { cloneRules } from './rules.ts';

// Presets are starting points. Every value stays editable before and during the match.
// Names are neutral on purpose: no club or league names.

const ALL_DISMISSALS: DismissalKind[] = [
  'bowled',
  'caught',
  'caughtOffWall',
  'caughtOffKeeperWall',
  'ceiling',
  'ceilingCaught',
  'runOut',
  'stumped',
  'hitWicket',
  'lbw',
  'obstructing',
  'retiredOut',
];

const zone = (z: Omit<Zone, 'enabled'> & { enabled?: boolean }): Zone => ({ enabled: true, ...z });

// Near half of each side wall scores 1, far half 2, far wall 4 on the full or 6 after a bounce.
export const STANDARD_ZONES: Zone[] = [
  zone({ id: 'nearLeft', label: 'Near side wall, left', area: 'nearLeft', runs: 1, allowRunning: true, catchOffIsOut: true, boundary: false }),
  zone({ id: 'nearRight', label: 'Near side wall, right', area: 'nearRight', runs: 1, allowRunning: true, catchOffIsOut: true, boundary: false }),
  zone({ id: 'farLeft', label: 'Far side wall, left', area: 'farLeft', runs: 2, allowRunning: true, catchOffIsOut: true, boundary: false }),
  zone({ id: 'farRight', label: 'Far side wall, right', area: 'farRight', runs: 2, allowRunning: true, catchOffIsOut: true, boundary: false }),
  zone({ id: 'farFull', label: 'Far wall on the full', area: 'farWall', runs: 4, allowRunning: true, catchOffIsOut: false, boundary: true }),
  zone({ id: 'farBounce', label: 'Far wall after a bounce', area: 'farWall', runs: 6, allowRunning: true, catchOffIsOut: false, boundary: true }),
  zone({ id: 'keeper', label: 'Keeper wall', area: 'keeperWall', runs: 1, allowRunning: true, catchOffIsOut: true, boundary: false }),
];

export const LEAGUE_RULES: IndoorRules = {
  schema: 1,
  presetId: 'league',
  name: 'Indoor league (standard)',
  match: {
    oversPerInnings: 8,
    ballsPerOver: 6,
    minPlayers: 5,
    maxOversPerBowler: 3,
    consecutiveOversAllowed: false,
    swapEndsAtOverEnd: true,
    inningsEnd: 'chaseStops',
  },
  zones: STANDARD_ZONES,
  running: {
    maxRunsPerBall: null,
    wallRunsNeedACompletedRun: false,
    deadBallMaxRuns: 1,
  },
  extras: {
    wideRuns: 2,
    noBallRuns: 2,
    rebowl: 'finalOver',
    runsRunOnWideCount: false,
    byeWallRuns: 1,
    byesAllowed: true,
    legByesAllowed: true,
    freeHitAfterNoBall: false,
  },
  wickets: {
    penalty: 5,
    alsoFromBatter: true,
    wicketBallScoresNothing: true,
    shortSide: { enabled: true, maxPlayers: 5, everyNth: 4, penalty: 10 },
    allOutPenalty: 0,
    onAllOut: 'continue',
    retiredRejoinQueue: true,
    newBatterNonStrikerAfterLastBall: true,
    allowed: ALL_DISMISSALS,
  },
  batting: { retireAt: 30, capAtRetire: false },
  penalties: { behaviourRuns: 5 },
  points: { win: 4, tie: 2, loss: 0 },
};

// A short friendly game: every wall is 1 plus what you run, no retirement, cheaper extras.
export const QUICK_RULES: IndoorRules = {
  ...cloneRules(LEAGUE_RULES),
  presetId: 'quick',
  name: 'Quick game',
  match: { ...LEAGUE_RULES.match, oversPerInnings: 6, maxOversPerBowler: null, consecutiveOversAllowed: true, minPlayers: 2 },
  zones: STANDARD_ZONES.map((z) => ({ ...z, runs: 1 })),
  extras: { ...LEAGUE_RULES.extras, wideRuns: 1, noBallRuns: 1 },
  wickets: { ...LEAGUE_RULES.wickets, shortSide: { ...LEAGUE_RULES.wickets.shortSide, enabled: false } },
  batting: { retireAt: null, capAtRetire: false },
};

// House rule: once the ball reaches the far wall the batters cannot run any more.
export const BOUNDARY_STOPS_RULES: IndoorRules = {
  ...cloneRules(LEAGUE_RULES),
  presetId: 'boundaryStops',
  name: 'No running after a boundary',
  zones: STANDARD_ZONES.map((z) => (z.boundary ? { ...z, allowRunning: false } : { ...z })),
};

export const PRESETS: IndoorRules[] = [LEAGUE_RULES, QUICK_RULES, BOUNDARY_STOPS_RULES];

export function presetById(id: string): IndoorRules {
  return cloneRules(PRESETS.find((p) => p.presetId === id) ?? LEAGUE_RULES);
}
