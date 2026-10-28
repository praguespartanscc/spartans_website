import type { User } from '@supabase/supabase-js';

// Where someone lands after signing in: admins to the admin dashboard, everyone else to theirs.
export function homeFor(user: Pick<User, 'app_metadata'> | null | undefined) {
  return user?.app_metadata?.isAdmin === true ? '/admin' : '/dashboard';
}

// Only follow redirects to pages on this site (never "//evil.com" or full URLs).
export function safeRedirect(path: string | null | undefined): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : null;
} 
// A CricHeroes player profile link, e.g. https://cricheroes.com/player-profile/123/name
// (same rule as public.is_cricheroes_profile in the database).
export function isCricHeroesProfile(url: string): boolean {
  return /^https?:\/\/([a-z0-9-]+\.)*cricheroes\.(com|in)\/player-profile\/\d+/i.test(url.trim());
}

export const CRICHEROES_HELP = 'In the CricHeroes app: tap your profile, then Share, then Copy link.';
