import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Server-side client with the project's secret key (set by the Vercel–Supabase integration).
// It bypasses row-level security, so only use it in server code that checks what it is doing.
export function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}
