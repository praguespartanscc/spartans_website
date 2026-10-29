import type { BallRecord, InningsState, MatchState, TeamIndex } from './engine.ts';
import { oversText, target, teamTotal } from './engine.ts';
import { DISMISSAL_LABEL } from './rules.ts';

// Short chip text for one delivery, as on a scorecard: "4", "2wd", "1nb", "2b", "W", "R".
export function ballLabel(b: BallRecord): string {
  const v = b.value;
  if (b.dismissedId) return b.penalty ? `W ${-b.penalty}` : 'W';
  const extra = b.input.extra;
  if (extra === 'wide') return `${v.extraRuns}wd`;
  if (extra === 'noBall') return `${v.extraRuns + v.batterRuns}nb`;
  if (extra === 'bye') return `${v.extraRuns}b`;
  if (extra === 'legBye') return `${v.extraRuns}lb`;
  return String(v.batterRuns);
}

export function ballTone(b: BallRecord): 'wicket' | 'boundary' | 'extra' | 'dot' | 'runs' {
  if (b.dismissedId) return 'wicket';
  if (b.value.struckZone?.boundary) return 'boundary';
  if (b.input.extra) return 'extra';
  return b.value.teamRuns === 0 ? 'dot' : 'runs';
}

export function scoreText(state: MatchState, inn: InningsState): string {
  const total = teamTotal(state, inn.batting);
  return `${total}/${inn.wickets}`;
}

export function inningsOvers(state: MatchState, inn: InningsState): string {
  return oversText(inn.legalBalls, state.rules.match.ballsPerOver);
}

export function runRate(state: MatchState, inn: InningsState): number {
  if (inn.legalBalls === 0) return 0;
  return (teamTotal(state, inn.batting) * state.rules.match.ballsPerOver) / inn.legalBalls;
}

// "Needs 23 from 14 balls" during a chase.
export function chaseText(state: MatchState): string | null {
  const t = target(state);
  const inn = state.innings[state.current];
  if (t == null || inn.index !== 1 || inn.complete) return null;
  const need = t - teamTotal(state, inn.batting);
  const left = inn.oversLimit * state.rules.match.ballsPerOver - inn.legalBalls;
  if (need <= 0) return `Ahead by ${1 - need}, ${left} balls left`;
  return `Needs ${need} from ${left} ${left === 1 ? 'ball' : 'balls'}`;
}

// The line the umpire reads out: "Team A 47 for 3, 6.2 overs".
export function announceText(state: MatchState): string {
  const inn = state.innings[state.current];
  const team = state.teams[inn.batting].name;
  return `${team} ${teamTotal(state, inn.batting)} for ${inn.wickets}, ${inningsOvers(state, inn)} overs`;
}

export function resultText(state: MatchState): string | null {
  const r = state.result;
  if (!r) return null;
  if (r.winner == null) return 'Match tied';
  const name = state.teams[r.winner].name;
  if (r.byChase && r.ballsLeft > 0) return `${name} won by ${r.margin} ${r.margin === 1 ? 'run' : 'runs'}, with ${r.ballsLeft} ${r.ballsLeft === 1 ? 'ball' : 'balls'} to spare`;
  return `${name} won by ${r.margin} ${r.margin === 1 ? 'run' : 'runs'}`;
}

export function dismissalText(state: MatchState, team: TeamIndex, id: string): string {
  const inn = state.innings.find((i) => i.batting === team);
  const b = inn?.batters[id];
  if (!b) return '';
  if (b.status === 'batting') return 'not out';
  if (b.status === 'retired') return 'retired';
  if (b.status === 'yet') return 'did not bat';
  return b.howOut ? DISMISSAL_LABEL[b.howOut].toLowerCase() : 'out';
}
