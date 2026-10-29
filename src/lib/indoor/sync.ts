// Uploads what the phone has scored. Safe to call again and again: events are upserted by
// their phone made ids, so a retry never adds a ball twice.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IndoorEvent } from './engine.ts';
import type { LocalMatch, MatchRecord } from './store.ts';

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
  code?: 'gone' | 'refused';
};

const refused = (e: { code?: string; message: string }) => e.code === '42501' || /row-level security|permission denied/i.test(e.message);

// Returns the event ids still waiting (empty when everything is up).
export async function push(supabase: SupabaseClient, lm: LocalMatch): Promise<PushResult> {
  const m = lm.match;
  if (lm.matchPending) {
    const row = { id: m.id, team_a: m.team_a, team_b: m.team_b, setup: m.setup, summary: m.summary, status: m.status, share_slug: m.share_slug, played_on: m.played_on };
    // Once uploaded, only ever update: a match an admin deleted must not come back from a phone.
    const { data, error } = lm.uploaded
      ? await supabase.from('indoor_matches').update(row).eq('id', m.id).select('id')
      : await supabase.from('indoor_matches').upsert(row, { onConflict: 'id' }).select('id');
    if (error) return { pending: lm.pending, matchPending: true, error: error.message, code: refused(error) ? 'refused' : undefined };
    if (lm.uploaded && !data?.length) return { pending: lm.pending, matchPending: true, error: 'deleted', code: 'gone' };
  }
  if (lm.pending.length === 0) return { pending: [], matchPending: false, error: null };
  const want = new Set(lm.pending);
  const rows = lm.events.filter((e) => want.has(e.id)).map((e) => toRow(m.id, e));
  const { error } = await supabase.from('indoor_events').upsert(rows, { onConflict: 'id' });
  if (error) {
    const gone = error.code === '23503'; // the match row no longer exists
    return { pending: lm.pending, matchPending: false, error: error.message, code: gone ? 'gone' : refused(error) ? 'refused' : undefined };
  }
  return { pending: [], matchPending: false, error: null };
}

export async function fetchMatch(supabase: SupabaseClient, id: string): Promise<{ match: MatchRecord; events: IndoorEvent[] } | null> {
  const [{ data: match }, { data: events }] = await Promise.all([
    supabase.from('indoor_matches').select('*').eq('id', id).maybeSingle(),
    supabase.from('indoor_events').select('id, match_id, seq, type, data, deleted').eq('match_id', id).order('seq'),
  ]);
  if (!match) return null;
  return { match: match as MatchRecord, events: ((events ?? []) as EventRow[]).map(fromRow) };
}
