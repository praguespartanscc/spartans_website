// CricHeroes profile links in every form members paste them, turned into one standard link:
// https://cricheroes.com/player-profile/<id>/<name>. Safe in the browser and on the server.
//
// Seen in the wild (checked October 2026):
//   https://cricheroes.com/player-profile/3026625/venkat/matches   (any tab, any case, ?utm…)
//   https://www.cricheroes.in/player-profile/299975/Player           (old domain, www, m.)
//   https://chshare.link/player/AbC123                               (the app's Share button now)
//   https://crichero.es/?link=<full link>, cricheroes.page.link/?link=<full link> (wrappers)
//   the whole share message with the link inside, or just the player ID number

import { slugify } from '@/lib/format';

const PROFILE = /https?:\/\/(?:(?:www|m|app)\.)?cricheroes\.(?:com|in)\/player-profile\/(\d{1,10})(?:\/([^/?#\s]+))?/i;
const SHORT = /https?:\/\/(?:www\.)?chshare\.link\/[a-z-]+\/[A-Za-z0-9]{4,12}/i;
const WRAPPED = /https?:\/\/(?:www\.)?(?:crichero\.es|cricheroes\.page\.link)\/?\?[^\s]*?\blink=([^&\s]+)/i;

export type CricHeroesLink =
  | { kind: 'profile'; id: string; url: string }
  | { kind: 'short'; url: string } // app short link, expanded on the server
  | { kind: 'error'; message: string };

export function profileUrl(id: string, name?: string | null): string {
  return `https://cricheroes.com/player-profile/${id}/${slugify(name ?? '') || 'player'}`;
}

export function parseCricHeroes(input: string, name?: string | null): CricHeroesLink {
  let text = (input ?? '').trim();
  if (!text) return { kind: 'error', message: 'Paste your CricHeroes profile link.' };
  const wrapped = WRAPPED.exec(text);
  if (wrapped) {
    try {
      text = decodeURIComponent(wrapped[1]);
    } catch {
      // keep the original text
    }
  }
  const full = PROFILE.exec(text);
  if (full) return { kind: 'profile', id: full[1], url: profileUrl(full[1], full[2] ? decodeURIComponent(full[2]) : name) };
  const short = SHORT.exec(text);
  if (short) return { kind: 'short', url: short[0] };
  const digits = text.replace(/[\s-]/g, '');
  if (/^\d{5,9}$/.test(digits)) return { kind: 'profile', id: digits, url: profileUrl(digits, name) };
  if (/^\+?\d{10,15}$/.test(digits)) {
    return { kind: 'error', message: 'That looks like a phone number. Paste the link to your CricHeroes profile instead.' };
  }
  if (/cricheroes|chshare/i.test(text)) {
    return { kind: 'error', message: 'That CricHeroes link is not a player profile. Open your own profile in the app, tap Share, then Copy link.' };
  }
  return { kind: 'error', message: 'That does not look like a CricHeroes profile link.' };
}

// What we store: the standard profile link, or an app short link we could not expand.
export function isStoredCricHeroes(url: string): boolean {
  return /^https?:\/\/(?:(?:www|m|app)\.)?cricheroes\.(?:com|in)\/player-profile\/\d+/i.test(url) || /^https?:\/\/(?:www\.)?chshare\.link\//i.test(url);
}

// Browser side: parse, and ask our server to expand an app short link.
export async function resolveCricHeroes(input: string, name?: string | null): Promise<{ url: string } | { error: string }> {
  const parsed = parseCricHeroes(input, name);
  if (parsed.kind === 'error') return { error: parsed.message };
  if (parsed.kind === 'profile') return { url: parsed.url };
  try {
    const res = await fetch('/api/cricheroes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ link: parsed.url, name }) });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) return { url: data.url };
    return { error: data.error ?? 'Could not read that link.' };
  } catch {
    return { url: parsed.url }; // offline: keep the short link, an admin can still open it
  }
}
