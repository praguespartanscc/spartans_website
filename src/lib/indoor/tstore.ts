// A copy of each tournament this phone has opened, so its games can be started and scored in a
// hall with no signal. Tournaments are created and edited online, the copy is only read.

import type { LocalMatch } from './store.ts';
import type { TournamentData, TournamentMatch } from './tournament.ts';

export type CachedTournament = TournamentData & { fetchedAt: string };

const KEY = (id: string) => `indoor:t:${id}`;
const INDEX = 'indoor:tindex';
const DRAFT = 'indoor:tdraft';
const KEEP = 10;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function drop(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage blocked: nothing to remove
  }
}

export function loadTournament(id: string): CachedTournament | null {
  return read<CachedTournament>(KEY(id));
}

export function cacheTournament(data: TournamentData): void {
  const id = data.tournament.id;
  write(KEY(id), { ...data, fetchedAt: new Date().toISOString() });
  const index = [id, ...(read<string[]>(INDEX) ?? []).filter((x) => x !== id)];
  write(INDEX, index.slice(0, KEEP));
  for (const old of index.slice(KEEP)) drop(KEY(old));
}

export function forgetTournament(id: string): void {
  drop(KEY(id));
  write(INDEX, (read<string[]>(INDEX) ?? []).filter((x) => x !== id));
}

export function cachedTournaments(): CachedTournament[] {
  return (read<string[]>(INDEX) ?? []).map((id) => loadTournament(id)).filter((x): x is CachedTournament => x != null);
}

// The create screens keep what has been typed, so a refresh does not lose forty names.
export const loadDraft = <T>(): T | null => read<T>(DRAFT);
export const saveDraft = (draft: unknown): void => void write(DRAFT, draft);
export const clearDraft = (): void => drop(DRAFT);

// Matches of a tournament as the phone knows them: the server's list, with this phone's own
// copies on top where they are newer (not uploaded yet) or not on the server at all.
export function mergeMatches(tournamentId: string, remote: TournamentMatch[], local: LocalMatch[]): TournamentMatch[] {
  const byId = new Map(remote.map((m) => [m.id, m]));
  for (const lm of local) {
    const m = lm.match;
    if (m.tournament_id !== tournamentId) continue;
    if (byId.has(m.id) && lm.pending.length === 0 && !lm.matchPending) continue;
    byId.set(m.id, {
      id: m.id,
      tournament_id: m.tournament_id,
      fixture_id: m.fixture_id ?? null,
      status: m.status,
      share_slug: m.share_slug,
      team_a: m.team_a,
      team_b: m.team_b,
      summary: m.summary,
      played_on: m.played_on,
      created_at: m.created_at ?? byId.get(m.id)?.created_at,
      updated_at: m.updated_at,
    });
  }
  return [...byId.values()];
}
