import { NextResponse } from 'next/server';
import { getLiveStatus } from '@/lib/youtube';

export const revalidate = 60;

// Tiny live/next-stream summary for the header badge, cached at the edge for a minute.
export async function GET() {
  const s = await getLiveStatus();
  return NextResponse.json(
    {
      live: s.live ? { id: s.live.id, title: s.live.title } : null,
      next: s.upcoming[0] ? { id: s.upcoming[0].id, title: s.upcoming[0].title, start: s.upcoming[0].scheduledStart ?? null } : null,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
