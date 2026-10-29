import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { CommitteeMember, Match, Player, Practice, Sponsor } from '@/types/supabase';
import { POSITION_ORDER, SQUADS } from '@/lib/club';
import { slugify } from '@/lib/format';

// Server-side reads for the public pages. Pages render this into their HTML
// (and refresh it every minute), so visitors and search engines get real content.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

async function readAll<T>(table: string): Promise<T[]> {
  if (!db) return [];
  const { data, error } = await db.from(table).select('*');
  if (error) {
    console.error(`Could not load ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

// "YYYY-MM-DD" for today in Prague, whatever time zone the server runs in.
export function pragueToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());
}

export type PublicPlayer = Player & { slug: string };

// Only the public profile fields leave the server, never contact details.
function toPublicPlayer(row: Player, slug: string): PublicPlayer {
  return {
    id: row.id,
    slug,
    name: row.name,
    player_type: row.player_type ?? null,
    role: row.role ?? null,
    team: row.team ?? null,
    photo_url: row.photo_url ?? null,
    bio: row.bio ?? null,
    batting_style: row.batting_style ?? null,
    bowling_style: row.bowling_style ?? null,
    jersey_number: row.jersey_number ?? null,
    joined_year: row.joined_year ?? null,
    cricheroes_url: row.cricheroes_url ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export const getPlayers = cache(async (): Promise<PublicPlayer[]> => {
  const rows = (await readAll<Player>('players'))
    .filter((p) => p.is_active !== false && p.name)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
  // Stable, unique URL slugs: the earliest player keeps the plain name.
  const used = new Map<string, number>();
  return rows
    .map((row) => {
      const base = slugify(row.name) || 'player';
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      return toPublicPlayer(row, n === 1 ? base : `${base}-${n}`);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

export const getPlayerBySlug = cache(async (slug: string) => {
  const players = await getPlayers();
  return players.find((p) => p.slug === slug) ?? null;
});

export const getMatches = cache(async (): Promise<Match[]> => {
  const rows = await readAll<Match>('matches');
  return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
});

export async function getMatch(id: number) {
  return (await getMatches()).find((m) => m.id === id) ?? null;
}

export const getPractices = cache(async (): Promise<Practice[]> => {
  const rows = await readAll<Practice>('practices');
  return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
});

export const getCommittee = cache(async (): Promise<CommitteeMember[]> => {
  const rank = (p: string) => {
    const i = POSITION_ORDER.indexOf(p);
    return i === -1 ? POSITION_ORDER.length : i;
  };
  // Linked members show their current name and photo (committee_public, migration 13).
  let rows: CommitteeMember[] = [];
  const res = db ? await db.rpc('committee_public') : null;
  if (res && !res.error && Array.isArray(res.data)) rows = res.data as CommitteeMember[];
  else rows = await readAll<CommitteeMember>('committee');
  return rows.sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100) || rank(a.position) - rank(b.position));
});

const TIER_RANK: Record<string, number> = { principal: 0, gold: 1, partner: 2 };

export const getSponsors = cache(async (): Promise<Sponsor[]> => {
  const rows = await readAll<Sponsor>('sponsors');
  return rows.sort(
    (a, b) =>
      (TIER_RANK[a.tier ?? 'partner'] ?? 3) - (TIER_RANK[b.tier ?? 'partner'] ?? 3) ||
      (a.sort_order ?? 100) - (b.sort_order ?? 100) ||
      a.name.localeCompare(b.name),
  );
});

// Admin-editable settings (supabase/migrations/003). Empty until that migration runs.
export const getSettings = cache(async (): Promise<Record<string, string | null>> => {
  const rows = await readAll<{ key: string; value: string | null }>('site_settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});

// Squads with their official team page links from settings (falling back to the built-in ones).
export async function getSquads() {
  const settings = await getSettings();
  return SQUADS.map((s) => ({ ...s, teamUrl: settings[`team_url_${s.slug}`] || s.teamUrl }));
}

export type SelectedPlayer = { player: PublicPlayer; slot: 'xi' | 'twelfth'; is_captain: boolean; is_keeper: boolean };

// The published XI for a match (the database only returns it once an admin publishes it).
export async function getSelection(matchId: number): Promise<SelectedPlayer[]> {
  if (!db) return [];
  const { data, error } = await db.from('match_selection').select('*').eq('match_id', matchId).order('sort_order');
  if (error || !data?.length) return [];
  const players = await getPlayers();
  const byId = new Map(players.map((p) => [String(p.id), p]));
  return data
    .map((row) => ({ ...row, player: byId.get(String(row.player_id)) }))
    .filter((row): row is SelectedPlayer & { player: PublicPlayer } => !!row.player)
    .map(({ player, slot, is_captain, is_keeper }) => ({ player, slot, is_captain, is_keeper }));
}

// An indoor match for its public follow page, by share link. Never cached: the score is live.
export type FollowMatch = {
  id: string;
  team_a: string;
  team_b: string;
  setup: unknown;
  status: 'live' | 'complete' | 'abandoned';
  played_on: string;
  updated_at: string;
  events: unknown[];
};

export const isShareSlug = (slug: string) => /^[a-z0-9]{8,32}$/.test(slug);

export const getIndoorMatchBySlug = cache(async (slug: string): Promise<FollowMatch | null> => {
  if (!db || !isShareSlug(slug)) return null;
  const { data, error } = await db.rpc('indoor_match_by_slug', { p_slug: slug });
  if (error) {
    console.error('Could not load indoor match:', error.message);
    return null;
  }
  return (data as FollowMatch | null) ?? null;
});
