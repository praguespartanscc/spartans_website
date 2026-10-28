import type { MetadataRoute } from 'next';
import { getMatches, getPlayers } from '@/lib/data';
import { SITE_URL, SQUADS } from '@/lib/club';

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, changeFrequency: Entry['changeFrequency'], priority: number): Entry => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  return [
    page('', 'daily', 1),
    page('/fixtures', 'daily', 0.9),
    page('/players', 'weekly', 0.9),
    page('/practices', 'weekly', 0.8),
    page('/about', 'monthly', 0.8),
    page('/contact', 'monthly', 0.8),
    page('/committee', 'monthly', 0.6),
    page('/sponsors', 'monthly', 0.6),
    ...SQUADS.map((s) => page(`/squads/${s.slug}`, 'weekly', 0.8)),
    ...players.map((p) => ({
      ...page(`/players/${p.slug}`, 'monthly', 0.6),
      ...(p.updated_at ? { lastModified: new Date(p.updated_at) } : {}),
    })),
    ...matches.map((m) => page(`/fixtures/${m.id}`, m.result === 'will be played' ? 'daily' : 'yearly', 0.5)),
  ];
}
