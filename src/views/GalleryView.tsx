import type { Metadata } from 'next';
import { getGallery, latestPhotos } from '@/lib/drive';
import { photoUrl, albumName } from '@/lib/photos';
import { SITE_URL, SOCIAL, WEBSITE_ID } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubRef } from '@/lib/structured';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import AlbumCard from '@/components/gallery/AlbumCard';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import JsonLd from '@/components/JsonLd';

// Shared by /gallery (English) and /cs/gallery (Czech). Album names are the Google Drive
// folder names and are shown as they are.

const galleryName = (lang: Lang) => tr(lang, { en: 'Prague Spartans photo gallery', cs: 'Fotogalerie Prague Spartans' });

const description = (lang: Lang) =>
  tr(lang, {
    en: 'Photos from Prague Spartans Cricket Club: matches, events, awards and club life in Prague, Czech Republic.',
    cs: 'Fotky z kriketového klubu Prague Spartans: zápasy, klubové akce, ocenění a život klubu v Praze.',
  });

export async function galleryMeta(lang: Lang): Promise<Metadata> {
  const { sections } = await getGallery();
  const cover = sections.find((s) => s.cover)?.cover;
  return pageMeta({
    lang,
    path: '/gallery',
    title: tr(lang, { en: 'Photo Gallery | Cricket in Prague', cs: 'Fotogalerie | Kriket v Praze' }),
    description: description(lang),
    ...(cover ? { images: [{ url: photoUrl(cover.id, 1200), alt: galleryName(lang) }] } : {}),
  });
}

export default async function GalleryView({ lang }: { lang: Lang }) {
  const { sections } = await getGallery();
  const latest = await latestPhotos(12);
  const latestTitle = tr(lang, { en: 'Latest photos', cs: 'Nejnovější fotky' });

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: galleryName(lang),
    description: description(lang),
    url: `${SITE_URL}${localePath(lang, '/gallery')}`,
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE_ID },
    about: clubRef,
    publisher: clubRef,
    hasPart: sections.map((s) => ({
      '@type': 'ImageGallery',
      name: albumName(s.name, lang),
      url: `${SITE_URL}${localePath(lang, `/gallery/${s.path.join('/')}`)}`,
      ...(s.cover ? { thumbnailUrl: photoUrl(s.cover.id, 800) } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Gallery', cs: 'Fotogalerie' }), '/gallery']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'Photos', cs: 'Fotky' })}
        title={tr(lang, {
          en: (
            <>
              Prague Spartans <span className="text-gold">photo gallery</span>
            </>
          ),
          cs: (
            <>
              Fotogalerie <span className="text-gold">Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'Match days, events, awards and everything in between at Prague Spartans Cricket Club in Prague.',
          cs: 'Zápasové dny, klubové akce, ocenění a vše mezi tím. Fotky z kriketového klubu Prague Spartans v Praze.',
        })}
      />
      <section className="py-16 sm:py-20">
        <div className="container-x">
          {sections.length === 0 ? (
            <EmptyState title={tr(lang, { en: 'Photos coming soon', cs: 'Fotky brzy přidáme' })}>
              {tr(lang, {
                en: <>We&apos;re putting the club&apos;s photos together. In the meantime, follow us on </>,
                cs: <>Fotky z klubu právě připravujeme. Mezitím nás sledujte na </>,
              })}
              <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hi">
                {tr(lang, { en: 'Instagram', cs: 'Instagramu' })}
              </a>
              .
            </EmptyState>
          ) : (
            <Reveal className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s, i) => (
                <AlbumCard key={s.id} album={s} priority={i < 3} lang={lang} />
              ))}
            </Reveal>
          )}
        </div>
      </section>
      {latest.length > 0 && (
        <section className="border-t border-cream/12 py-16 sm:py-20">
          <div className="container-x">
            <SectionHeading eyebrow={tr(lang, { en: 'Just added', cs: 'Nově přidané' })} title={latestTitle} />
            <PhotoGrid title={latestTitle} photos={latest.map(({ photo }) => photo)} lang={lang} />
          </div>
        </section>
      )}
    </>
  );
}
