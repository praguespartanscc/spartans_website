import { NextResponse } from 'next/server';
import { parseCricHeroes } from '@/lib/cricheroes';

// Expands a CricHeroes app short link (chshare.link/...) into the player profile link it
// points to. The page carries the full link in its data (no redirect).
export async function POST(req: Request) {
  const { link, name } = (await req.json().catch(() => ({}))) as { link?: string; name?: string };
  const parsed = parseCricHeroes(link ?? '', name);
  if (parsed.kind === 'error') return NextResponse.json({ error: parsed.message }, { status: 400 });
  if (parsed.kind === 'profile') return NextResponse.json({ url: parsed.url });
  try {
    const res = await fetch(parsed.url, { signal: AbortSignal.timeout(5000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; PragueSpartansBot/1.0)' } });
    const html = await res.text();
    const m = /"link_data"\s*:\s*\{[^}]*?"url"\s*:\s*"([^"]+)"/.exec(html);
    const target = m ? JSON.parse(`"${m[1]}"`) as string : null;
    if (!target) return NextResponse.json({ url: parsed.url }); // keep the short link
    const expanded = parseCricHeroes(target, name);
    if (expanded.kind === 'profile') return NextResponse.json({ url: expanded.url });
    return NextResponse.json({ error: 'That link opens a match or team, not a player. Open your own profile in the app, tap Share, then Copy link.' }, { status: 400 });
  } catch {
    return NextResponse.json({ url: parsed.url });
  }
}
