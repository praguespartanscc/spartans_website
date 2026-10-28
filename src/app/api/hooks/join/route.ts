import { NextResponse } from 'next/server';
import { emailConfigured, escapeHtml, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/club';

export const dynamic = 'force-dynamic';

// Called by a Supabase database webhook when someone registers (profiles) or applies
// to join (team_applications). Protected by a shared secret header.
export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admins = (process.env.ADMIN_NOTIFY_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!emailConfigured() || !admins.length) return NextResponse.json({ skipped: 'email not set up' });

  const payload = (await request.json().catch(() => null)) as { type?: string; table?: string; record?: Record<string, unknown> } | null;
  if (payload?.type !== 'INSERT' || !payload.record) return NextResponse.json({ skipped: 'not an insert' });

  const r = payload.record;
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const isMember = payload.table === 'profiles';
  const name = str(r.full_name || r.name) || 'Someone';
  const lines = isMember
    ? [`${name} registered on the website.`, `Email: ${str(r.email)}`, `CricHeroes: ${str(r.cricheroes_url) || 'not given'}`, `Approve: ${SITE_URL}/admin/members`]
    : [
        `${name} applied to join the club.`,
        `Email: ${str(r.email)}`,
        `Plays as: ${str(r.specification)}`,
        `Experience: ${str(r.experience)}`,
        `Review: ${SITE_URL}/admin/applications`,
      ];

  await sendEmail({
    to: admins,
    subject: isMember ? `New member registration: ${name}` : `New join request: ${name}`,
    text: lines.join('\n'),
    html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
  });
  return NextResponse.json({ sent: true });
}
