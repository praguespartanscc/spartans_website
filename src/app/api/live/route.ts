import { NextResponse } from 'next/server';
import { getLiveStatus } from '@/lib/youtube';
import { getLiveNow } from '@/lib/data';

export const revalidate = 60;

// Tiny summary for the header badge: YouTube stream, indoor matches being scored, and a
// training session that is on right now. Cached at the edge for a minute.
export async function GET() {
  const [s, now] = await Promise.all([getLiveStatus(), getLiveNow()]);
  return NextResponse.json(
    {
      indoor: now.indoor.map((m) => ({ slug: m.share_slug, teams: `${m.team_a} v ${m.team_b}` })),
      session: now.sessions.find((x) => x.status === 'now') ?? null,
      live: s.live ? { id: s.live.id, title: s.live.title } : null,
      next: s.upcoming[0] ? { id: s.upcoming[0].id, title: s.upcoming[0].title, start: s.upcoming[0].scheduledStart ?? null } : null,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
