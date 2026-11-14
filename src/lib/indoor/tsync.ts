// Reads and writes tournaments. Unlike matches these are edited online: a tournament has one
// schedule that several people look at, so the server's copy is the one that counts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fixture, Tournament, TournamentData, TournamentMatch, TournamentTeam } from './tournament.ts';

const MATCH_COLUMNS = 'id, tournament_id, fixture_id, status, share_slug, team_a, team_b, summary, played_on, created_at, updated_at';

type DbError = { code?: string; message: string };

// missing: the database has no tournament tables yet (the update has not been run).
// refused: this account may not change the tournament. stale: someone else changed the
// schedule first. offline: no answer.
export type Problem = 'missing' | 'refused' | 'stale' | 'offline';
export type Saved = { ok: true } | { ok: false; problem: Problem; message: string };

export function problemOf(e: DbError): Problem {
  if (e.code === 'PGRST205' || e.code === 'PGRST204' || e.code === '42P01' || e.code === '42703') return 'missing';
  if (e.code === '42501' || /row-level security|permission denied/i.test(e.message)) return 'refused';
  return 'offline';
}

export const PROBLEM_TEXT: Record<Problem, string> = {
  missing: 'Tournaments need a database update that has not been run yet.',
  refused: 'Only the organiser or an admin can change this tournament.',
  stale: 'Someone else changed the schedule. Reload to see it.',
  offline: 'No connection. Try again when you are online.',
};

const fail = (e: DbError): Saved => ({ ok: false, problem: problemOf(e), message: e.message });

const fixtureRow = (f: Fixture) => ({ ...f, starts: f.starts ? f.starts.slice(0, 5) : null });

export async function listTournaments(supabase: SupabaseClient): Promise<{ list: Tournament[]; problem: Problem | null }> {
  const { data, error } = await supabase.from('indoor_tournaments').select('*').order('updated_at', { ascending: false }).limit(20);
  if (error) return { list: [], problem: problemOf(error) };
  return { list: (data ?? []) as Tournament[], problem: null };
}

export async function fetchTournament(supabase: SupabaseClient, id: string): Promise<{ data: TournamentData | null; problem: Problem | null }> {
  const [t, teams, fixtures, matches] = await Promise.all([
    supabase.from('indoor_tournaments').select('*').eq('id', id).maybeSingle(),
    supabase.from('indoor_tournament_teams').select('*').eq('tournament_id', id).order('sort'),
    supabase.from('indoor_fixtures').select('*').eq('tournament_id', id).order('seq'),
    supabase.from('indoor_matches').select(MATCH_COLUMNS).eq('tournament_id', id).order('created_at'),
  ]);
  const error = t.error ?? teams.error ?? fixtures.error ?? matches.error;
  if (error) return { data: null, problem: problemOf(error) };
  if (!t.data) return { data: null, problem: null };
  return {
    data: {
      tournament: t.data as Tournament,
      teams: (teams.data ?? []) as TournamentTeam[],
      fixtures: ((fixtures.data ?? []) as Fixture[]).map((f) => ({ ...f, voided: f.voided ?? [] })),
      matches: (matches.data ?? []) as TournamentMatch[],
    },
    problem: null,
  };
}

// A new tournament: its row, then its teams, then its games. Each step can be sent again.
export async function createTournament(supabase: SupabaseClient, data: Pick<TournamentData, 'tournament' | 'teams' | 'fixtures'>): Promise<Saved> {
  const t = data.tournament;
  const row = { id: t.id, slug: t.slug, name: t.name, status: t.status, organisers: t.organisers, rules: t.rules, settings: t.settings, rev: t.rev };
  const a = await supabase.from('indoor_tournaments').upsert(row, { onConflict: 'id' }).select('id');
  if (a.error) return fail(a.error);
  if (data.teams.length) {
    const b = await supabase.from('indoor_tournament_teams').upsert(data.teams, { onConflict: 'id' });
    if (b.error) return fail(b.error);
  }
  if (data.fixtures.length) {
    const c = await supabase.from('indoor_fixtures').upsert(data.fixtures.map(fixtureRow), { onConflict: 'id' });
    if (c.error) return fail(c.error);
  }
  return { ok: true };
}

// A new schedule for a tournament that exists. The rev number is claimed first, so two people
// re-planning at the same moment cannot both win: the second is told to reload.
// Games that are no longer in the schedule are removed, except any that already has a match.
export async function saveSchedule(
  supabase: SupabaseClient,
  tournament: Tournament,
  next: { settings?: Tournament['settings']; teams?: TournamentTeam[]; fixtures: Fixture[]; removeTeams?: string[] },
  keepFixtures: string[] = [],
): Promise<Saved & { rev?: number }> {
  const patch: Record<string, unknown> = { rev: tournament.rev + 1 };
  if (next.settings) patch.settings = next.settings;
  const claim = await supabase.from('indoor_tournaments').update(patch).eq('id', tournament.id).eq('rev', tournament.rev).select('id');
  if (claim.error) return fail(claim.error);
  if (!claim.data?.length) return { ok: false, problem: 'stale', message: 'rev moved on' };

  if (next.teams?.length) {
    const b = await supabase.from('indoor_tournament_teams').upsert(next.teams, { onConflict: 'id' });
    if (b.error) return fail(b.error);
  }
  if (next.fixtures.length) {
    const c = await supabase.from('indoor_fixtures').upsert(next.fixtures.map(fixtureRow), { onConflict: 'id' });
    if (c.error) return fail(c.error);
  }
  const keep = new Set([...next.fixtures.map((f) => f.id), ...keepFixtures]);
  const existing = await supabase.from('indoor_fixtures').select('id').eq('tournament_id', tournament.id);
  if (existing.error) return fail(existing.error);
  const gone = ((existing.data ?? []) as { id: string }[]).map((r) => r.id).filter((id) => !keep.has(id));
  if (gone.length) {
    const d = await supabase.from('indoor_fixtures').delete().in('id', gone);
    if (d.error) return fail(d.error);
  }
  if (next.removeTeams?.length) {
    const e = await supabase.from('indoor_tournament_teams').delete().in('id', next.removeTeams);
    if (e.error) return fail(e.error);
  }
  return { ok: true, rev: tournament.rev + 1 };
}

async function patchRow(supabase: SupabaseClient, table: string, id: string, patch: Record<string, unknown>): Promise<Saved> {
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('id');
  if (error) return fail(error);
  // No row came back: the policy hid it, so this account may not change it.
  if (!data?.length) return { ok: false, problem: 'refused', message: 'no row changed' };
  return { ok: true };
}

export const updateFixture = (supabase: SupabaseClient, id: string, patch: Partial<Fixture>) =>
  patchRow(supabase, 'indoor_fixtures', id, { ...patch, ...(patch.starts ? { starts: patch.starts.slice(0, 5) } : {}) });
export const updateTeam = (supabase: SupabaseClient, id: string, patch: Partial<TournamentTeam>) => patchRow(supabase, 'indoor_tournament_teams', id, patch);
export const updateTournament = (supabase: SupabaseClient, id: string, patch: Partial<Pick<Tournament, 'name' | 'status' | 'settings' | 'organisers' | 'rules'>>) =>
  patchRow(supabase, 'indoor_tournaments', id, patch);

export async function deleteTournament(supabase: SupabaseClient, id: string): Promise<Saved> {
  const { data, error } = await supabase.from('indoor_tournaments').delete().eq('id', id).select('id');
  if (error) return fail(error);
  if (!data?.length) return { ok: false, problem: 'refused', message: 'no row deleted' };
  return { ok: true };
}
