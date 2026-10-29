import type { MetadataRoute } from 'next';
import { getMatches, getPlayers } from '@/lib/data';
import { SITE_URL, SQUADS } from '@/lib/club';
import { allAlbums, getGallery } from '@/lib/drive';
import { photoUrl } from '@/lib/photos';
import { localePath } from '@/lib/i18n';

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];
type Page = { path: string; lastModified?: string | Date | null; images?: string[] };

// Every public page in English and Czech, each listing its other-language twin (hreflang).
// lastModified is only given when it is actually known (search engines ignore made-up dates).
function both({ path, lastModified, images }: Page): Entry[] {
  const languages = {
    en: `${SITE_URL}${path === '/' ? '' : path}`,
    cs: `${SITE_URL}${localePath('cs', path)}`,
    'x-default': `${SITE_URL}${path === '/' ? '' : path}`,
  };
  return (['en', 'cs'] as const).map((lang) => ({
    url: languages[lang],
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
    ...(images?.length ? { images } : {}),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [players, matches, gallery] = await Promise.all([getPlayers(), getMatches(), getGallery()]);

  const pages: Page[] = [
    { path: '/' },
    { path: '/join' },
    { path: '/about' },
    { path: '/fixtures' },
    { path: '/players' },
    { path: '/practices' },
    { path: '/ground' },
    { path: '/cricket-in-prague', lastModified: '2026-10-28' },
    { path: '/committee' },
    { path: '/sponsors' },
    { path: '/safeguarding' },
    { path: '/privacy' },
    { path: '/live' },
    { path: '/gallery' },
    ...SQUADS.map((s) => ({ path: `/squads/${s.slug}` })),
    ...allAlbums(gallery.sections).map((a) => ({
      path: `/gallery/${a.path.join('/')}`,
      images: a.photos.slice(0, 50).map((p) => photoUrl(p.id, 1600)),
    })),
    // Player pages with neither a photo nor a bio are noindex until they have content.
    ...players
      .filter((p) => p.photo_url || p.bio)
      .map((p) => ({ path: `/players/${p.slug}`, lastModified: p.updated_at, images: p.photo_url ? [p.photo_url] : [] })),
    ...matches.map((m) => ({ path: `/fixtures/${m.id}`, lastModified: m.created_at })),
  ];

  return pages.flatMap(both);
}
