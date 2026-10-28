import type { User } from '@supabase/supabase-js';

// Where someone lands after signing in: admins to the admin dashboard, everyone else to theirs.
export function homeFor(user: Pick<User, 'app_metadata'> | null | undefined) {
  return user?.app_metadata?.isAdmin === true ? '/admin' : '/dashboard';
}

// Only follow redirects to pages on this site (never "//evil.com" or full URLs).
export function safeRedirect(path: string | null | undefined): string | null {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : null;
} 