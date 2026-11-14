// Glue between the organiser's choices and the schedule engine: builds a whole tournament from
// its teams, format and sessions, and re-plans one that is already under way.

import type { Player } from './engine.ts';
import type { IndoorRules } from './rules.ts';
import type { Entrant, Placed } from './schedule.ts';
import { assignGroups, buildFixtures, resolveFormat, schedule } from './schedule.ts';
import type { Fixture, Format, Points, Session, Settings, Tournament, TournamentMatch, TournamentTeam } from './tournament.ts';
import { fixtureState, isKnockout } from './tournament.ts';

// A fair guess at how long one game takes: about two and a half minutes an over, both innings,
// plus the change of innings. Rounded to five minutes.
export function matchMinutesFor(rules: IndoorRules): number {
  const raw = rules.match.oversPerInnings * 2 * (rules.match.ballsPerOver / 6) * 2.5 + 5;
  return Math.max(15, Math.round(raw / 5) * 5);
}

export function pointsFor(rules: IndoorRules): Points {
  return { win: rules.points.win, tie: rules.points.tie, loss: rules.points.loss, noResult: rules.points.tie };
}

export function defaultSettings(rules: IndoorRules, format: Format, sessions: Session[], seed: number): Settings {
  return { format, sessions, matchMinutes: matchMinutesFor(rules), gapMinutes: 5, points: pointsFor(rules), duty: false, seed };
}

export type NewTeam = { id: string; name: string; squad: Player[] };

// Which group each team is in, for the format as it is really played (a format that cannot be
// played with this many teams falls back to the nearest one that can).
export function groupsFor(entrants: Entrant[], format: Format): Record<string, string> {
  const real = resolveFormat(entrants.length, format);
  return real.kind === 'groups' ? assignGroups(entrants, real.groups) : {};
}

// Everything a new tournament needs, ready to save. Teams are seeded in the order given.
export function planTournament(
  tournament: Pick<Tournament, 'id' | 'slug' | 'name' | 'rules'>,
  teams: NewTeam[],
  settings: Settings,
  makeId: () => string,
): { tournament: Tournament; teams: TournamentTeam[]; placed: Placed } {
  const entrants: Entrant[] = teams.map((t, i) => ({ id: t.id, seed: i + 1 }));
  const groups = groupsFor(entrants, settings.format);
  const placed = schedule(buildFixtures(tournament.id, entrants, settings.format, makeId), settings);
  return {
    tournament: { ...tournament, status: 'live', organisers: [], settings, rev: 0 },
    teams: teams.map((t, i) => ({ id: t.id, tournament_id: tournament.id, name: t.name, short: null, seed: i + 1, grp: groups[t.id] ?? null, squad: t.squad, withdrawn: false, sort: i })),
    placed,
  };
}

// Games that must stay exactly where they are: anything live or finished, or ruled on.
export function pinnedIds(fixtures: Fixture[], matches: TournamentMatch[]): string[] {
  return fixtures.filter((f) => fixtureState(f, matches) !== 'scheduled').map((f) => f.id);
}

// New times and courts for the games that are left. now (Prague day and time) keeps a game
// from being put into a slot that has already gone by.
export function replan(fixtures: Fixture[], matches: TournamentMatch[], settings: Settings, now?: { day: string; starts: string }): Placed {
  return schedule(fixtures, settings, { pinned: pinnedIds(fixtures, matches), previous: fixtures, notBefore: now });
}

// Has anything been played or ruled on? Until then the whole schedule can simply be made again.
export const hasStarted = (fixtures: Fixture[], matches: TournamentMatch[]) => matches.some((m) => m.status !== 'abandoned') || fixtures.some((f) => f.status !== 'scheduled');

// The league or group games a late team needs: one against every other team of its group, as
// many times as the format says. They are added to the end and then given times.
export function gamesForLateTeam(tournamentId: string, team: TournamentTeam, others: TournamentTeam[], format: Format, startSeq: number, makeId: () => string): Fixture[] {
  const out: Fixture[] = [];
  const rivals = others.filter((t) => !t.withdrawn && t.id !== team.id && (t.grp ?? null) === (team.grp ?? null));
  for (let leg = 0; leg < Math.max(1, format.legs); leg += 1) {
    rivals.forEach((r, i) => {
      const first = (leg + i) % 2 === 0;
      out.push({
        id: makeId(),
        tournament_id: tournamentId,
        stage: format.kind === 'groups' ? 'group' : 'league',
        grp: team.grp ?? null,
        round: leg + 1,
        seq: startSeq + out.length,
        label: team.grp ? `Group ${team.grp}` : 'Extra game',
        home: { kind: 'team', id: first ? team.id : r.id },
        away: { kind: 'team', id: first ? r.id : team.id },
        duty: null,
        venue: null,
        court: null,
        day: null,
        starts: null,
        status: 'scheduled',
        winner_id: null,
        match_id: null,
        voided: [],
        locked: false,
        note: null,
      });
    });
  }
  return out;
}

// The group a late team joins: the smallest one (the first of them when level).
export function smallestGroup(teams: TournamentTeam[]): string | null {
  const groups = [...new Set(teams.map((t) => t.grp).filter((g): g is string => !!g))].sort();
  if (!groups.length) return null;
  const size = (g: string) => teams.filter((t) => t.grp === g && !t.withdrawn).length;
  return groups.reduce((best, g) => (size(g) < size(best) ? g : best), groups[0]);
}

// A team's league or group games, split into those already settled and those still to play.
export function gamesOf(teamId: string, fixtures: Fixture[], matches: TournamentMatch[]): { played: Fixture[]; left: Fixture[] } {
  const own = fixtures.filter((f) => !isKnockout(f.stage) && ((f.home.kind === 'team' && f.home.id === teamId) || (f.away.kind === 'team' && f.away.id === teamId)) && f.status !== 'cancelled');
  return { played: own.filter((f) => fixtureState(f, matches) !== 'scheduled'), left: own.filter((f) => fixtureState(f, matches) === 'scheduled') };
}
