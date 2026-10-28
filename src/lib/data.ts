import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { CommitteeMember, Match, Player, Practice, Sponsor } from '@/types/supabase';
import { POSITION_ORDER } from '@/lib/club';
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
  const rows = await readAll<CommitteeMember>('committee');
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
