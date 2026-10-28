import type { Metadata } from 'next';
import { CLUB_NAME } from '@/lib/club';
import { languageAlternates, localePath, OG_LOCALE, type Lang } from '@/lib/i18n';

// Default share image (1200x630).
export const OG_IMAGE = {
  url: '/og/prague-spartans-cricket-club.jpg',
  width: 1200,
  height: 630,
  alt: 'Prague Spartans Cricket Club – cricket club in Prague, Czech Republic',
};

type Img = { url: string; width?: number; height?: number; alt?: string };

// Full metadata for a public page. Child metadata replaces (not merges) openGraph and
// twitter objects, so every page sets them completely here. `path` is the English path;
// bilingual pages get the matching /cs URL and hreflang alternates.
export function pageMeta(o: {
  lang?: Lang;
  path: string;
  title?: string;
  absoluteTitle?: string;
  description: string;
  images?: Img[];
  type?: 'website' | 'profile' | 'article';
  bilingual?: boolean;
}): Metadata {
  const lang = o.lang ?? 'en';
  const url = localePath(lang, o.path);
  const full = o.absoluteTitle ?? `${o.title} | ${CLUB_NAME}`;
  const images = o.images ?? [OG_IMAGE];
  const bilingual = o.bilingual ?? true;
  return {
    title: o.absoluteTitle ? { absolute: o.absoluteTitle } : o.title,
    description: o.description,
    alternates: { canonical: url, ...(bilingual ? { languages: languageAlternates(o.path) } : {}) },
    openGraph: {
      type: o.type ?? 'website',
      siteName: CLUB_NAME,
      locale: OG_LOCALE[lang],
      ...(bilingual ? { alternateLocale: [OG_LOCALE[lang === 'en' ? 'cs' : 'en']] } : {}),
      url,
      title: full,
      description: o.description,
      images,
    },
    twitter: { card: 'summary_large_image', title: full, description: o.description, images: images.map((i) => i.url) },
  };
}
