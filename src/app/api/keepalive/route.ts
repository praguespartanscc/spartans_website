import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Called once a day by a Vercel cron job (vercel.json). Free Supabase projects pause
// after a week without activity; one tiny read a day keeps the club database awake.
export async function GET(request: Request) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" with every cron call. Nobody else may call this.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from('site_settings').select('key').limit(1);
  if (error) {
    console.error('Keepalive failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
