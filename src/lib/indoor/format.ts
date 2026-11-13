import type { BallRecord, InningsState, MatchState, TeamIndex } from './engine.ts';
import { oversText, target, teamTotal } from './engine.ts';
import { DISMISSAL_LABEL } from './rules.ts';
import type { MatchSummary } from './store.ts';

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

// Small copy of the score for match lists, so they do not have to replay every match.
export function summaryOf(state: MatchState): MatchSummary {
  return {
    innings: state.innings
      .filter((inn) => inn.index === 0 || inn.legalBalls > 0 || inn.complete)
      .map((inn) => ({ team: state.teams[inn.batting].name, total: teamTotal(state, inn.batting), wickets: inn.wickets, overs: inningsOvers(state, inn) })),
    result: resultText(state),
  };
}

// A finished match whose stored score is not what its uploaded balls add up to: the last balls
// never left the scorer's phone. Returns the stored score to show instead, or null when all is well.
export function storedAhead(status: string | undefined, summary: MatchSummary | null | undefined, state: MatchState): MatchSummary | null {
  if (status !== 'complete' || !summary?.innings?.length) return null;
  const now = summaryOf(state);
  const same =
    state.status === 'complete' &&
    now.innings.length === summary.innings.length &&
    now.innings.every((i, k) => i.total === summary.innings[k].total && i.wickets === summary.innings[k].wickets && i.overs === summary.innings[k].overs);
  return same ? null : summary;
}

type SeriesRow = { id: string; played_on: string; team_a: string; team_b: string; status: string; summary: MatchSummary | null };

// When the same two teams play several matches on one day, the tally for that day, by match id:
// "KASI 2, Vicky 2". Only finished matches count, and a pair with a single match gets nothing.
export function seriesLines(rows: SeriesRow[]): Record<string, string> {
  const low = (n: string) => n.trim().toLowerCase();
  const groups = new Map<string, { ids: string[]; names: [string, string]; wins: [number, number]; played: number }>();
  for (const r of rows) {
    const pair = [low(r.team_a), low(r.team_b)].sort();
    const key = `${r.played_on}|${pair[0]}|${pair[1]}`;
    const g = groups.get(key) ?? { ids: [], names: low(r.team_a) === pair[0] ? [r.team_a, r.team_b] : [r.team_b, r.team_a], wins: [0, 0], played: 0 };
    groups.set(key, g);
    g.ids.push(r.id);
    const inn = r.summary?.innings;
    if (r.status !== 'complete' || !inn || inn.length < 2) continue;
    g.played += 1;
    if (inn[0].total === inn[1].total) continue;
    const winner = low(inn[0].total > inn[1].total ? inn[0].team : inn[1].team);
    g.wins[winner === pair[0] ? 0 : 1] += 1;
  }
  const out: Record<string, string> = {};
  for (const g of groups.values()) {
    if (g.played < 2) continue;
    const line = `${g.names[0]} ${g.wins[0]}, ${g.names[1]} ${g.wins[1]}`;
    for (const id of g.ids) out[id] = line;
  }
  return out;
}
