import type { DismissalKind, IndoorRules, Zone } from './rules.ts';
import { FREE_HIT_DISMISSALS, NO_BALL_DISMISSALS, WIDE_DISMISSALS, extraCountsAsBall } from './rules.ts';

export type ExtraKind = 'wide' | 'noBall' | 'bye' | 'legBye';
export type End = 'striker' | 'nonStriker';

export type WicketInput = {
  kind: DismissalKind;
  who: End;
  zone?: string | null; // the wall a catch came off
  fielderId?: string | null;
};

// What the scorer taps for one delivery.
export type BallInput = {
  zone: string | null; // first surface the ball hit, if any
  runs: number; // runs physically run
  extra: ExtraKind | null;
  wicket: WicketInput | null;
  deadBall?: boolean;
};

export type BallValue = {
  legal: boolean; // counts as one of the over
  runsRun: number; // after the running limits, used for strike
  wallRuns: number;
  batterRuns: number;
  extraRuns: number;
  teamRuns: number; // before any wicket penalty
  faced: boolean; // a ball faced by the striker
  wicket: WicketInput | null; // null when the appeal does not stand (free hit, catch off a wall that does not count)
  struckZone: Zone | null; // wall hit off the bat, for stats
};

export function findZone(rules: IndoorRules, id: string | null | undefined): Zone | null {
  if (!id) return null;
  return rules.zones.find((z) => z.id === id && z.enabled) ?? null;
}

// Does this dismissal stand under today's rules?
export function wicketStands(rules: IndoorRules, w: WicketInput, freeHit: boolean, extra: ExtraKind | null = null): boolean {
  if (!rules.wickets.allowed.includes(w.kind)) return false;
  if (freeHit && !FREE_HIT_DISMISSALS.includes(w.kind)) return false;
  if (extra === 'noBall' && !NO_BALL_DISMISSALS.includes(w.kind)) return false;
  if (extra === 'wide' && !WIDE_DISMISSALS.includes(w.kind)) return false;
  if (w.kind === 'caughtOffWall' || w.kind === 'caughtOffKeeperWall') {
    const z = findZone(rules, w.zone);
    if (z && !z.catchOffIsOut) return false;
  }
  return true;
}

// Value of one delivery. Pure: the engine adds wicket penalties and strike changes.
export function scoreBall(rules: IndoorRules, ball: BallInput, ctx: { finalOver: boolean; freeHit: boolean }): BallValue {
  const zone = findZone(rules, ball.zone);
  const extra = ball.extra;
  // Byes or leg byes switched off: the batters may run, but nothing counts.
  const blocked = extra != null && !isExtraAllowed(rules, extra);
  const legal = extra === 'wide' || extra === 'noBall' ? extraCountsAsBall(rules, ctx.finalOver) : true;
  const faced = extra !== 'wide';
  const wicket = ball.wicket && wicketStands(rules, ball.wicket, ctx.freeHit, ball.extra) ? ball.wicket : null;

  // A wicket ball scores nothing else under the league rules: no runs, no wall, no extras.
  if (wicket && rules.wickets.wicketBallScoresNothing) {
    return { legal, runsRun: 0, wallRuns: 0, batterRuns: 0, extraRuns: 0, teamRuns: 0, faced, wicket, struckZone: null };
  }

  let runsRun = blocked ? 0 : Math.max(0, Math.floor(ball.runs || 0));
  if (zone && !zone.allowRunning) runsRun = 0;
  if (rules.running.maxRunsPerBall != null) runsRun = Math.min(runsRun, rules.running.maxRunsPerBall);
  if (ball.deadBall) runsRun = Math.min(runsRun, rules.running.deadBallMaxRuns);

  let wallRuns = zone && !blocked ? zone.runs : 0;
  if ((extra === 'bye' || extra === 'legBye') && zone && !blocked && rules.extras.byeWallRuns != null) wallRuns = rules.extras.byeWallRuns;
  // Optional: the wall only pays if the batters complete a run. Boundary walls always pay.
  if (zone && !zone.boundary && rules.running.wallRunsNeedACompletedRun && runsRun === 0) wallRuns = 0;

  let batterRuns = 0;
  let extraRuns = 0;
  if (extra === 'wide') {
    extraRuns = rules.extras.wideRuns + (rules.extras.runsRunOnWideCount ? runsRun + wallRuns : 0);
  } else if (extra === 'noBall') {
    extraRuns = rules.extras.noBallRuns;
    batterRuns = runsRun + wallRuns;
  } else if (extra === 'bye' || extra === 'legBye') {
    extraRuns = runsRun + wallRuns;
  } else {
    batterRuns = runsRun + wallRuns;
  }
  if (extra === 'wide') wallRuns = rules.extras.runsRunOnWideCount ? wallRuns : 0;

  const struck = extra === null || extra === 'noBall';
  return {
    legal,
    runsRun,
    wallRuns,
    batterRuns,
    extraRuns,
    teamRuns: batterRuns + extraRuns,
    faced,
    wicket,
    struckZone: struck ? zone : null,
  };
}

function isExtraAllowed(rules: IndoorRules, extra: ExtraKind): boolean {
  if (extra === 'bye') return rules.extras.byesAllowed;
  if (extra === 'legBye') return rules.extras.legByesAllowed;
  return true;
}
