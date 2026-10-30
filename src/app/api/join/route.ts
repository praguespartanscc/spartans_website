import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabaseAdmin';
import { clientIp, rateLimited, sameOrigin } from '@/lib/request';

export const dynamic = 'force-dynamic';

// The join form posts here. The row is written with the server key after the checks below,
// so visitors no longer insert into team_applications directly (the database refuses them).
//   - same-site request, at most 5 per address per hour
//   - a honeypot field bots fill in and people never see
//   - Cloudflare Turnstile, once NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set
//   - sensible lengths and a real-looking email

const SPECIFICATIONS = ['batsman', 'bowler', 'allrounder', 'wicketkeeper', 'wicketkeeper_batsman'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = { name?: unknown; email?: unknown; age?: unknown; location?: unknown; specification?: unknown; experience?: unknown; website?: unknown; token?: unknown };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function turnstileOk(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip === 'unknown' ? undefined : ip }),
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const ip = clientIp(request);
  if (rateLimited(`join:${ip}`, 5, 60 * 60_000)) return NextResponse.json({ error: 'rate' }, { status: 429 });

  const body = ((await request.json().catch(() => null)) ?? {}) as Body;
  // Honeypot: the form has a hidden "website" field that people never fill in.
  if (text(body.website, 10)) return NextResponse.json({ ok: true });

  const name = text(body.name, 100);
  const email = text(body.email, 200).toLowerCase();
  const location = text(body.location, 120);
  const specification = text(body.specification, 40);
  const experience = text(body.experience, 2000);
  const age = Number.parseInt(text(body.age, 3), 10);
  if (name.length < 2 || !EMAIL.test(email) || !location || !experience) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!SPECIFICATIONS.includes(specification)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!Number.isInteger(age) || age < 5 || age > 99) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!(await turnstileOk(text(body.token, 4000), ip))) return NextResponse.json({ error: 'captcha' }, { status: 400 });

  const db = adminClient();
  if (!db) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const { error } = await db.from('team_applications').insert({ name, email, age, location, specification, experience, status: 'pending' });
  if (error) {
    console.error('Join application failed:', error.message);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
