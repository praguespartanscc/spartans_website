// Uploads what the phone has scored. Safe to call again and again: events are upserted by
// their phone made ids, so a retry never adds a ball twice.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IndoorEvent } from './engine.ts';
import type { LocalMatch, MatchRecord } from './store.ts';
import { listLocal, removeLocal, saveLocal } from './store.ts';

type EventRow = { id: string; match_id: string; seq: number; type: string; data: unknown; deleted: boolean };

export function toRow(matchId: string, e: IndoorEvent): EventRow {
  return { id: e.id, match_id: matchId, seq: e.seq, type: e.type, data: e.data, deleted: e.deleted === true };
}

export function fromRow(r: EventRow): IndoorEvent {
  return { id: r.id, seq: r.seq, type: r.type, data: r.data, deleted: r.deleted } as IndoorEvent;
}

export type PushResult = {
  pending: string[];
  matchPending: boolean;
  error: string | null;
  // gone: an admin deleted the match. refused: this account may not score it. Neither is retried.
  // rejected: the database would not take one or more events (they stay on the phone).
  code?: 'gone' | 'refused' | 'rejected';
  // The server has this match's row (so if it later disappears there, it was deleted).
  uploaded?: boolean;
  // Events the database would not take this time (a subset of pending).
  rejected?: string[];
};

type DbError = { code?: string; message: string };

// The tournament links are only sent for a tournament match. An ordinary match uploads exactly
// as it always has, also on a database that has no tournament columns yet.
export function matchRow(m: MatchRecord): Record<string, unknown> {
  const row: Record<string, unknown> = { id: m.id, team_a: m.team_a, team_b: m.team_b, setup: m.setup, summary: m.summary, status: m.status, share_slug: m.share_slug, played_on: m.played_on };
  if (m.tournament_id) row.tournament_id = m.tournament_id;
  if (m.fixture_id) row.fixture_id = m.fixture_id;
  return row;
}

const refused = (e: DbError) => e.code === '42501' || /row-level security|permission denied/i.test(e.message);
// An answer from the database itself (an SQLSTATE or PostgREST code), as opposed to no signal.
const fromDatabase = (e: DbError) => /^([0-9A-Z]{5}|PGRST\d+)$/.test(e.code ?? '');

const CHUNK = 100;

// Order matters:
//   1. a new match needs its row before any ball can be saved
//   2. the balls, oldest first
//   3. the score and result, only once the balls are up, so the result is never ahead of them
// An event the database rejects is set aside and the rest still go up.
// Events rejected before are skipped (they would only fail again and slow every ball down)
// unless retryRejected is set, which the scorer does now and then and when a match is opened.
export async function push(supabase: SupabaseClient, lm: LocalMatch, opts: { retryRejected?: boolean } = {}): Promise<PushResult> {
  const m = lm.match;
  const row = matchRow(m);
  let uploaded = lm.uploaded === true;
  let rowSent = false;

  if (!uploaded) {
    const { error } = await supabase.from('indoor_matches').upsert(row, { onConflict: 'id' }).select('id');
    if (error) return { pending: lm.pending, matchPending: true, error: error.message, code: refused(error) ? 'refused' : undefined };
    uploaded = true;
    rowSent = true;
  }

  const skip = new Set(opts.retryRejected ? [] : (lm.rejected ?? []));
  const want = new Set(lm.pending.filter((id) => !skip.has(id)));
  const rows = lm.events
    .filter((e) => want.has(e.id))
    .sort((a, b) => a.seq - b.seq)
    .map((e) => toRow(m.id, e));
  // Skipped events are still rejected as far as anyone knows.
  const rejected: string[] = lm.pending.filter((id) => skip.has(id));
  let rejection: string | null = rejected.length ? 'not accepted by the database' : null;
  const stop = (from: number, error: DbError, code?: PushResult['code']): PushResult => ({
    pending: [...rejected, ...rows.slice(from).map((r) => r.id)],
    matchPending: lm.matchPending && !rowSent,
    error: error.message,
    code,
    uploaded,
    rejected,
  });

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from('indoor_events').upsert(chunk, { onConflict: 'id' });
    if (!error) continue;
    if (error.code === '23503') return stop(i, error, 'gone'); // the match row no longer exists
    if (refused(error)) return stop(i, error, 'refused');
    if (!fromDatabase(error)) return stop(i, error); // no signal: try again later
    // The database refused something in this chunk. Send its events one by one to find which.
    for (let k = 0; k < chunk.length; k += 1) {
      const one = await supabase.from('indoor_events').upsert([chunk[k]], { onConflict: 'id' });
      if (!one.error) continue;
      if (!fromDatabase(one.error)) return stop(i + k, one.error);
      rejected.push(chunk[k].id);
      rejection = one.error.message;
    }
  }

  let matchPending = lm.matchPending && !rowSent;
  if (matchPending) {
    // Once uploaded, only ever update: a match an admin deleted must not come back from a phone.
    const { data, error } = await supabase.from('indoor_matches').update(row).eq('id', m.id).select('id');
    if (error) return { pending: rejected, matchPending: true, error: error.message, code: refused(error) ? 'refused' : undefined, uploaded, rejected };
    if (!data?.length) return { pending: rejected, matchPending: true, error: 'deleted', code: 'gone', uploaded, rejected };
    matchPending = false;
  }
  return { pending: rejected, matchPending, error: rejection, code: rejected.length ? 'rejected' : undefined, uploaded, rejected };
}

export async function fetchMatch(supabase: SupabaseClient, id: string): Promise<{ match: MatchRecord; events: IndoorEvent[] } | null> {
  const [{ data: match }, { data: events }] = await Promise.all([
    supabase.from('indoor_matches').select('*').eq('id', id).maybeSingle(),
    supabase.from('indoor_events').select('id, match_id, seq, type, data, deleted').eq('match_id', id).order('seq'),
  ]);
  if (!match) return null;
  return { match: match as MatchRecord, events: ((events ?? []) as EventRow[]).map(fromRow) };
}

// Uploads everything still waiting on this phone, match by match (used by the match list, so
// the scorer does not have to open each match). Returns how many matches now have nothing waiting.
export async function uploadWaiting(supabase: SupabaseClient): Promise<number> {
  let done = 0;
  for (const lm of listLocal()) {
    if (lm.pending.length === 0 && !lm.matchPending) continue;
    const res = await push(supabase, lm, { retryRejected: true }).catch(() => null);
    if (!res) continue;
    if (res.code === 'gone') {
      removeLocal(lm.match.id);
      continue;
    }
    saveLocal({ ...lm, pending: res.pending, matchPending: res.matchPending, uploaded: lm.uploaded || res.uploaded === true, rejected: res.rejected ?? [] });
    if (res.pending.length === 0 && !res.matchPending) done += 1;
  }
  return done;
}
