// A tournament in the indoor scorer: teams with fixed squads, a list of fixtures with a time
// and a court, and the matches scored for them. Plain types only (no enums): the tests run
// this file directly with Node's type stripping.
//
// A fixture never stores a score. Its state comes from the match scored for it, so the phone
// keeps working the way it always has: it starts a match, scores it and uploads it.

import type { Player } from './engine.ts';
import type { IndoorRules } from './rules.ts';
import type { MatchStatus, MatchSummary } from './store.ts';

export type TournamentStatus = 'draft' | 'live' | 'complete';

// series: two teams, best of `legs`.
// roundRobin: everyone plays everyone `legs` times, then the finals stage.
// groups: `groups` groups, each a round robin of `legs`, then the finals stage.
// knockout: straight knockout, byes for the top seeds.
export type FormatKind = 'series' | 'roundRobin' | 'groups' | 'knockout';

// What follows the league or group stage.
// page: 1st v 2nd (winner to the final), 3rd v 4th, then loser v winner, then the final.
export type Finals = 'none' | 'final' | 'semis' | 'quarters' | 'page';

export type Format = { kind: FormatKind; legs: number; groups: number; finals: Finals; thirdPlace: boolean };

// One block of time in a hall. Times are wall clock in Prague ("2026-12-05", "17:00").
export type Session = { id: string; day: string; venue: string; courts: number; start: string; end: string };

export type Points = { win: number; tie: number; loss: number; noResult: number };

export type Settings = {
  format: Format;
  sessions: Session[];
  matchMinutes: number; // time one game takes
  gapMinutes: number; // changeover between games on a court
  points: Points;
  duty: boolean; // a resting team is named as umpire for each game
  seed: number; // fixed so the same teams and times always give the same schedule
  playerOfTournament?: string | null; // the organiser's pick, a player key from stats.ts
  sharedTitle?: boolean; // a tied final nobody wanted to break
};

export type Tournament = {
  id: string;
  slug: string;
  name: string;
  status: TournamentStatus;
  created_by?: string | null;
  organisers: string[];
  rules: IndoorRules;
  settings: Settings;
  rev: number;
  created_at?: string;
  updated_at?: string;
};

export type TournamentTeam = {
  id: string;
  tournament_id: string;
  name: string;
  short: string | null;
  seed: number; // 1 is the top seed
  grp: string | null; // 'A', 'B', ...
  squad: Player[];
  withdrawn: boolean;
  sort: number;
};

// Who plays in a fixture: a team, or a place that is filled in once earlier games are done.
export type TeamRef =
  | { kind: 'team'; id: string }
  | { kind: 'groupPos'; group: string; pos: number } // "A1": first in group A
  | { kind: 'tablePos'; pos: number } // "2nd": second in the league table
  | { kind: 'winner'; fixture: string }
  | { kind: 'loser'; fixture: string };

// league, group, series: every team plays. The rest are knockout games.
export type Stage = 'league' | 'group' | 'series' | 'ko' | 'qf' | 'sf' | 'third' | 'q1' | 'elim' | 'q2' | 'final';

export const KNOCKOUT_STAGES: Stage[] = ['ko', 'qf', 'sf', 'third', 'q1', 'elim', 'q2', 'final'];
export const isKnockout = (stage: string) => (KNOCKOUT_STAGES as string[]).includes(stage);

export type FixtureStatus = 'scheduled' | 'walkover' | 'no_result' | 'cancelled';

export type Fixture = {
  id: string;
  tournament_id: string;
  stage: Stage;
  grp: string | null;
  round: number; // 1 based within its stage
  seq: number; // game number across the whole tournament, in playing order
  label: string; // "Final", "Semi final 1", "Group A"
  home: TeamRef;
  away: TeamRef;
  duty: TeamRef | null;
  venue: string | null;
  court: number | null; // 1 based
  day: string | null; // "2026-12-05"
  starts: string | null; // "17:40"
  status: FixtureStatus;
  winner_id: string | null; // walkover winner, or who goes through after a tie
  match_id: string | null; // the organiser's pick when more than one match was scored
  voided: string[]; // matches that do not count (a replay was ordered)
  locked: boolean; // moved by hand: a re-plan leaves it where it is
  note: string | null;
};

// The part of a match row a tournament needs. No events and no setup.
export type TournamentMatch = {
  id: string;
  tournament_id?: string | null;
  fixture_id: string | null;
  status: MatchStatus;
  share_slug: string;
  team_a: string;
  team_b: string;
  summary: MatchSummary | null;
  played_on: string;
  created_at?: string;
  updated_at?: string;
};

export type TournamentData = { tournament: Tournament; teams: TournamentTeam[]; fixtures: Fixture[]; matches: TournamentMatch[] };

export const DEFAULT_POINTS: Points = { win: 4, tie: 2, loss: 0, noResult: 2 };

// The match that counts for a fixture: the organiser's pick, or else the first one started
// that has not been set aside. Two phones can score the same game, and neither is refused.
export function countedMatch(fixture: Fixture, matches: TournamentMatch[]): TournamentMatch | null {
  const own = matches.filter((m) => m.fixture_id === fixture.id && !fixture.voided.includes(m.id) && m.status !== 'abandoned');
  if (!own.length) return null;
  const picked = fixture.match_id ? own.find((m) => m.id === fixture.match_id) : null;
  if (picked) return picked;
  return [...own].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id))[0];
}

// Every match scored for a fixture that is not the one that counts.
export function otherMatches(fixture: Fixture, matches: TournamentMatch[]): TournamentMatch[] {
  const counted = countedMatch(fixture, matches);
  return matches.filter((m) => m.fixture_id === fixture.id && m.id !== counted?.id);
}

export type FixtureState = 'scheduled' | 'live' | 'complete' | 'walkover' | 'no_result' | 'cancelled';

export function fixtureState(fixture: Fixture, matches: TournamentMatch[]): FixtureState {
  if (fixture.status !== 'scheduled') return fixture.status;
  const m = countedMatch(fixture, matches);
  if (!m) return 'scheduled';
  return m.status === 'complete' ? 'complete' : 'live';
}

// A fixture is over when nothing more will be played in it.
export const isOver = (s: FixtureState) => s === 'complete' || s === 'walkover' || s === 'no_result' || s === 'cancelled';

const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

// What to show for a place nobody has earned yet: "A1", "2nd", "Winner of Semi final 1".
export function refLabel(ref: TeamRef, teams: TournamentTeam[], fixtures: Fixture[]): string {
  if (ref.kind === 'team') return teams.find((t) => t.id === ref.id)?.name ?? 'Team';
  if (ref.kind === 'groupPos') return `${ref.group}${ref.pos}`;
  if (ref.kind === 'tablePos') return ordinal(ref.pos);
  const f = fixtures.find((x) => x.id === ref.fixture);
  const name = f ? fixtureTitle(f) : 'an earlier game';
  return `${ref.kind === 'winner' ? 'Winner' : 'Loser'} of ${name}`;
}

// What a game is called on a card. League games are simply numbered in playing order: their
// round numbers stop meaning much once the games are shuffled so teams get a rest.
export function fixtureTitle(f: Pick<Fixture, 'stage' | 'label' | 'seq'>): string {
  return f.stage === 'league' || !f.label ? `Game ${f.seq}` : f.label;
}

export const sameRef = (a: TeamRef, b: TeamRef) => JSON.stringify(a) === JSON.stringify(b);

// "17:40" as minutes from midnight, and back.
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const toClock = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
