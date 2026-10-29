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

// Returns the event ids still waiting (empty when everything is up).
export async function push(supabase: SupabaseClient, lm: LocalMatch): Promise<{ pending: string[]; matchPending: boolean; error: string | null }> {
  const m = lm.match;
  if (lm.matchPending) {
    const row = { id: m.id, team_a: m.team_a, team_b: m.team_b, setup: m.setup, summary: m.summary, status: m.status, share_slug: m.share_slug, played_on: m.played_on };
    const { error } = await supabase.from('indoor_matches').upsert(row, { onConflict: 'id' });
    if (error) return { pending: lm.pending, matchPending: true, error: error.message };
  }
  if (lm.pending.length === 0) return { pending: [], matchPending: false, error: null };
  const want = new Set(lm.pending);
  const rows = lm.events.filter((e) => want.has(e.id)).map((e) => toRow(m.id, e));
  const { error } = await supabase.from('indoor_events').upsert(rows, { onConflict: 'id' });
  if (error) return { pending: lm.pending, matchPending: false, error: error.message };
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
