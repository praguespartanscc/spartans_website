import { NextResponse } from 'next/server';
import { emailConfigured, escapeHtml, sendEmail } from '@/lib/email';
import { adminClient } from '@/lib/supabaseAdmin';
import { SITE_URL } from '@/lib/club';

export const dynamic = 'force-dynamic';

const TABLES = ['profiles', 'team_applications'] as const;
type Table = (typeof TABLES)[number];
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Called by the database (supabase/migrations/09_join_notifications.sql) with just the
// table and id of a new registration or join request. The details are read from the
// database here and each row is emailed about once, so callers can't send made-up content.
export async function POST(request: Request) {
  // The database sends the shared secret (Supabase Vault, "join_hook_secret"). Once it is also
  // set in Vercel as JOIN_HOOK_SECRET, nobody else can trigger these emails.
  const secret = process.env.JOIN_HOOK_SECRET;
  if (secret && request.headers.get('x-hook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { table?: string; id?: string } | null;
  const table = TABLES.find((t) => t === body?.table) as Table | undefined;
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!table || !id || id.length > 64) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const db = adminClient();
  if (!db) return NextResponse.json({ skipped: 'server key not set' });
  if (!emailConfigured()) return NextResponse.json({ skipped: 'email not set up' });

  const { data: row } = await db.from(table).select('*').eq('id', id).maybeSingle();
  if (!row || row.notified_at) return NextResponse.json({ skipped: 'nothing to send' });
  if (table === 'profiles' && row.status !== 'pending') return NextResponse.json({ skipped: 'not waiting for approval' });
  if (Date.now() - new Date(row.created_at).getTime() > MAX_AGE_MS) return NextResponse.json({ skipped: 'too old' });

  // Claim the row first so two calls can't both send.
  const { data: claimed } = await db.from(table).update({ notified_at: new Date().toISOString() }).eq('id', id).is('notified_at', null).select('id');
  if (!claimed?.length) return NextResponse.json({ skipped: 'already sent' });

  const fromEnv = (process.env.ADMIN_NOTIFY_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const admins = fromEnv.length ? fromEnv : (((await db.rpc('admin_notify_emails')).data ?? []) as string[]);
  if (!admins.length) return NextResponse.json({ skipped: 'no admins to email' });

  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const isMember = table === 'profiles';
  const name = str(row.full_name || row.name) || 'Someone';
  const lines = isMember
    ? [`${name} registered on the website.`, `Email: ${str(row.email)}`, `CricHeroes: ${str(row.cricheroes_url) || 'not given'}`, `Approve: ${SITE_URL}/admin/members`]
    : [
        `${name} applied to join the club.`,
        `Email: ${str(row.email)}`,
        `Plays as: ${str(row.specification)}`,
        `Experience: ${str(row.experience)}`,
        `Review: ${SITE_URL}/admin/applications`,
      ];

  try {
    await sendEmail({
      to: admins,
      subject: isMember ? `New member registration: ${name}` : `New join request: ${name}`,
      text: lines.join('\n'),
      html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
    });
  } catch (err) {
    // Let a later call retry.
    await db.from(table).update({ notified_at: null }).eq('id', id);
    console.error('Join notification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Email failed' }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
