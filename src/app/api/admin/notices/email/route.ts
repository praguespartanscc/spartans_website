import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { emailConfigured, escapeHtml, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/club';

export const dynamic = 'force-dynamic';

// Emails a notice to every approved member. Runs as the signed-in admin, so the
// database's own rules decide what they can read.
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.isAdmin !== true) return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ error: 'Email is not set up yet' }, { status: 503 });

  const { noticeId } = (await request.json().catch(() => ({}))) as { noticeId?: number };
  const { data: notice } = await supabase.from('notices').select('*').eq('id', noticeId).maybeSingle();
  if (!notice) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });

  const { data: members } = await supabase.from('profiles').select('email').eq('status', 'approved');
  const to = Array.from(new Set((members ?? []).map((m) => m.email).filter(Boolean))) as string[];
  if (!to.length) return NextResponse.json({ sent: 0 });

  try {
    await sendEmail({
      to,
      bcc: true,
      subject: `Prague Spartans: ${notice.title}`,
      text: `${notice.title}\n\n${notice.body}\n\nSee all notices: ${SITE_URL}/dashboard`,
      html: `<h2>${escapeHtml(notice.title)}</h2><p style="white-space:pre-line">${escapeHtml(notice.body)}</p><p><a href="${SITE_URL}/dashboard">Open your member dashboard</a></p>`,
    });
  } catch (err) {
    console.error('Notice email failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'The email service refused the message. Check the Gmail app password in Vercel.' }, { status: 502 });
  }
  return NextResponse.json({ sent: to.length });
}
