import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findAlbum } from '@/lib/drive';
import { photoUrl } from '@/lib/photos';
import { CLUB_NAME, SITE_URL, WEBSITE_ID } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubRef } from '@/lib/structured';
import AlbumCard, { photoCount } from '@/components/gallery/AlbumCard';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import SectionHeading from '@/components/ui/SectionHeading';
import JsonLd from '@/components/JsonLd';

// Shared by /gallery/[...path] (English) and /cs/gallery/[...path] (Czech). Album names
// are the Google Drive folder names and are shown as they are.

const albumPath = (path: string[]) => `/gallery/${path.join('/')}`;

export async function albumMeta(lang: Lang, path: string[]): Promise<Metadata> {
  const found = await findAlbum(path);
  if (!found) return { title: tr(lang, { en: 'Album not found', cs: 'Album nenalezeno' }), robots: { index: false } };
  const { album, trail } = found;
  const where = trail.length > 1 ? `${trail[0].name}: ` : '';
  return pageMeta({
    lang,
    path: albumPath(path),
    title: `${album.name} · ${tr(lang, { en: 'Photos', cs: 'Fotky' })}`,
    description: tr(lang, {
      en: `${where}${album.name}. ${photoCount(album.total, 'en')} from Prague Spartans Cricket Club in Prague.`,
      cs: `${where}${album.name}. ${photoCount(album.total, 'cs')} z kriketového klubu Prague Spartans v Praze.`,
    }),
    ...(album.cover ? { images: [{ url: photoUrl(album.cover.id, 1200), alt: album.name }] } : {}),
  });
}

export default async function AlbumView({ lang, path }: { lang: Lang; path: string[] }) {
  const found = await findAlbum(path);
  if (!found) notFound();
  const { album, trail } = found;

  // One list drives both the visible breadcrumb and the BreadcrumbList; the current album
  // is the last item (shown as the H1, not as a link).
  const crumbs: [string, string][] = [
    [tr(lang, { en: 'Gallery', cs: 'Fotogalerie' }), '/gallery'],
    ...trail.map((a): [string, string] => [a.name, albumPath(a.path)]),
  ];

  const galleryLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: album.name,
    description: tr(lang, {
      en: `${photoCount(album.total, 'en')} from ${CLUB_NAME} in Prague.`,
      cs: `${photoCount(album.total, 'cs')} z kriketového klubu Prague Spartans v Praze.`,
    }),
    url: `${SITE_URL}${localePath(lang, albumPath(path))}`,
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE_ID },
    about: clubRef,
    publisher: clubRef,
    ...(album.cover ? { thumbnailUrl: photoUrl(album.cover.id, 800) } : {}),
    image: album.photos.slice(0, 30).map((p) => ({
      '@type': 'ImageObject',
      contentUrl: photoUrl(p.id, 1600),
      thumbnailUrl: photoUrl(p.id, 400),
      creditText: CLUB_NAME,
      ...(p.width && p.height ? { width: p.width, height: p.height } : {}),
    })),
    ...(album.albums.length > 0
      ? {
          hasPart: album.albums.map((a) => ({
            '@type': 'ImageGallery',
            name: a.name,
            url: `${SITE_URL}${localePath(lang, albumPath(a.path))}`,
          })),
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={galleryLd} />
      <JsonLd data={breadcrumbs(lang, crumbs)} />
      <section className="border-b border-cream/12">
        <div className="container-x pb-12 pt-14 sm:pb-16 sm:pt-20">
          <nav
            aria-label={tr(lang, { en: 'Breadcrumb', cs: 'Drobečková navigace' })}
            className="rise mb-4 flex flex-wrap items-center gap-2 text-[15px] text-faint"
          >
            {crumbs.slice(0, -1).map(([name, href], i) => (
              <span key={href} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                <Link href={localePath(lang, href)} className="hover:text-gold">
                  {name}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="display rise max-w-4xl text-[clamp(44px,8vw,96px)]" style={{ ['--d' as string]: '80ms' }}>
            {album.name}{' '}
            <span className="h-sub mt-3 block text-[clamp(20px,2.6vw,28px)] text-gold">
              {tr(lang, { en: 'Prague Spartans photo album', cs: 'Fotoalbum Prague Spartans' })}
            </span>
          </h1>
          <p className="rise mt-4 text-lg text-sand" style={{ ['--d' as string]: '160ms' }}>
            {photoCount(album.total, lang)}
          </p>
        </div>
      </section>

      {album.albums.length > 0 && (
        <section className="py-14 sm:py-16">
          <div className="container-x">
            {album.photos.length > 0 && <SectionHeading eyebrow={album.name} title={tr(lang, { en: 'Albums', cs: 'Alba' })} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {album.albums.map((a, i) => (
                <AlbumCard key={a.id} album={a} priority={i < 3} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {album.photos.length > 0 && (
        <section className={album.albums.length > 0 ? 'border-t border-cream/12 py-14 sm:py-16' : 'py-10 sm:py-14'}>
          <div className="container-x">
            {album.albums.length > 0 && <SectionHeading eyebrow={album.name} title={tr(lang, { en: 'Photos', cs: 'Fotky' })} />}
            <PhotoGrid title={album.name} photos={album.photos} lang={lang} />
          </div>
        </section>
      )}

      {album.total === 0 && (
        <section className="py-14">
          <div className="container-x text-muted">{tr(lang, { en: 'No photos here yet.', cs: 'Zatím tu nejsou žádné fotky.' })}</div>
        </section>
      )}
    </>
  );
}
