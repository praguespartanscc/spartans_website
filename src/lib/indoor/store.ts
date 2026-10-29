// The scorer's phone keeps every match it scores, so a refresh, a flat battery or no
// signal in the hall never loses a ball. Supabase gets a copy whenever there is a connection.

import type { IndoorEvent, MatchSetup } from './engine.ts';

export type MatchStatus = 'live' | 'complete' | 'abandoned';

export type MatchSummary = {
  innings: { team: string; total: number; wickets: number; overs: string }[];
  result: string | null;
};

export type MatchRecord = {
  id: string;
  team_a: string;
  team_b: string;
  setup: MatchSetup;
  summary: MatchSummary | null;
  status: MatchStatus;
  share_slug: string;
  played_on: string;
  created_by?: string | null;
  scorer_id?: string | null;
  updated_at?: string;
};

export type LocalMatch = {
  match: MatchRecord;
  events: IndoorEvent[];
  pending: string[]; // event ids not yet on the server
  matchPending: boolean; // match row (new, summary or status) not yet on the server
  uploaded?: boolean; // the server has had this match, so if it disappears there it was deleted
};

const KEY = (id: string) => `indoor:match:${id}`;
const INDEX = 'indoor:index';

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

export function loadLocal(id: string): LocalMatch | null {
  return read<LocalMatch>(KEY(id));
}

export function saveLocal(lm: LocalMatch): boolean {
  const ok = write(KEY(lm.match.id), lm);
  const index = read<string[]>(INDEX) ?? [];
  if (!index.includes(lm.match.id)) write(INDEX, [lm.match.id, ...index].slice(0, 50));
  return ok;
}

export function removeLocal(id: string): void {
  try {
    localStorage.removeItem(KEY(id));
    write(INDEX, (read<string[]>(INDEX) ?? []).filter((x) => x !== id));
  } catch {
    // storage blocked: nothing to remove
  }
}

export function listLocal(): LocalMatch[] {
  return (read<string[]>(INDEX) ?? []).map((id) => loadLocal(id)).filter((x): x is LocalMatch => x != null);
}

export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Older browsers: RFC 4122 version 4 from random bytes.
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function newSlug(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => chars[x % chars.length]).join('');
}

// Server copy and phone copy together: anything the phone has not uploaded yet wins.
export function mergeEvents(local: LocalMatch | null, remote: IndoorEvent[]): IndoorEvent[] {
  if (!local) return remote;
  const byId = new Map<string, IndoorEvent>();
  for (const e of remote) byId.set(e.id, e);
  const pending = new Set(local.pending);
  for (const e of local.events) if (pending.has(e.id) || !byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()];
}
