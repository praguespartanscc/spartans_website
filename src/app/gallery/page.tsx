import type { Metadata } from 'next';
import { getGallery, latestPhotos } from '@/lib/drive';
import { photoUrl } from '@/lib/photos';
import PageHero from '@/components/ui/PageHero';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import AlbumCard from '@/components/gallery/AlbumCard';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import { SOCIAL } from '@/lib/club';

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const { sections } = await getGallery();
  const cover = sections.find((s) => s.cover)?.cover;
  return {
    title: 'Photo gallery',
    description: 'Photos from Prague Spartans Cricket Club: matches, events, awards and life at the club in Prague.',
    alternates: { canonical: '/gallery' },
    openGraph: { url: '/gallery', title: 'Prague Spartans photo gallery', ...(cover ? { images: [photoUrl(cover.id, 1200)] } : {}) },
  };
}

export default async function GalleryPage() {
  const { sections } = await getGallery();
  const latest = await latestPhotos(12);

  return (
    <>
      <PageHero
        eyebrow="Photos"
        title={
          <>
            Club <span className="text-gold">gallery</span>
          </>
        }
        intro="Match days, events, awards and everything in between."
      />
      <section className="py-16 sm:py-20">
        <div className="container-x">
          {sections.length === 0 ? (
            <EmptyState title="Photos coming soon">
              We&apos;re putting the club&apos;s photos together. In the meantime, follow us on{' '}
              <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hi">
                Instagram
              </a>
              .
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s, i) => (
                <AlbumCard key={s.id} album={s} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>
      {latest.length > 0 && (
        <section className="border-t border-cream/12 py-16 sm:py-20">
          <div className="container-x">
            <SectionHeading eyebrow="Just added" title="Latest photos" />
            <PhotoGrid title="Latest photos" photos={latest.map(({ photo }) => photo)} />
          </div>
        </section>
      )}
    </>
  );
}
