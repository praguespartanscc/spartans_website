import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allAlbums, findAlbum, getGallery } from '@/lib/drive';
import { photoUrl } from '@/lib/photos';
import { CLUB_NAME, SITE_URL } from '@/lib/club';
import AlbumCard from '@/components/gallery/AlbumCard';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import SectionHeading from '@/components/ui/SectionHeading';

export const revalidate = 600;

type Props = { params: Promise<{ path: string[] }> };

// Pre-build every album; albums added later are built on their first visit.
export async function generateStaticParams() {
  const { sections } = await getGallery();
  return allAlbums(sections).map((a) => ({ path: a.path }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const found = await findAlbum(path);
  if (!found) return { title: 'Album not found', robots: { index: false } };
  const { album, trail } = found;
  const url = `/gallery/${path.join('/')}`;
  const where = trail.length > 1 ? `${trail[0].name}: ` : '';
  return {
    title: `${album.name} · Photos`,
    description: `${where}${album.name}. ${album.total} photos from ${CLUB_NAME}.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${album.name} · ${CLUB_NAME}`, ...(album.cover ? { images: [photoUrl(album.cover.id, 1200)] } : {}) },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { path } = await params;
  const found = await findAlbum(path);
  if (!found) notFound();
  const { album, trail } = found;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: album.name,
    url: `${SITE_URL}/gallery/${path.join('/')}`,
    isPartOf: { '@type': 'SportsTeam', name: CLUB_NAME, url: SITE_URL },
    image: album.photos.slice(0, 30).map((p) => photoUrl(p.id, 1600)),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-cream/12">
        <div className="container-x pb-12 pt-14 sm:pb-16 sm:pt-20">
          <nav aria-label="Breadcrumb" className="rise mb-4 flex flex-wrap items-center gap-2 text-[15px] text-faint">
            <Link href="/gallery" className="hover:text-gold">
              Gallery
            </Link>
            {trail.slice(0, -1).map((a) => (
              <span key={a.id} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <Link href={`/gallery/${a.path.join('/')}`} className="hover:text-gold">
                  {a.name}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="display rise max-w-4xl text-[clamp(44px,8vw,96px)]" style={{ ['--d' as string]: '80ms' }}>
            {album.name}
          </h1>
          <p className="rise mt-4 text-lg text-sand" style={{ ['--d' as string]: '160ms' }}>
            {album.total} photo{album.total === 1 ? '' : 's'}
          </p>
        </div>
      </section>

      {album.albums.length > 0 && (
        <section className="py-14 sm:py-16">
          <div className="container-x">
            {album.photos.length > 0 && <SectionHeading eyebrow={album.name} title="Albums" />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {album.albums.map((a, i) => (
                <AlbumCard key={a.id} album={a} priority={i < 3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {album.photos.length > 0 && (
        <section className={album.albums.length > 0 ? 'border-t border-cream/12 py-14 sm:py-16' : 'py-10 sm:py-14'}>
          <div className="container-x">
            {album.albums.length > 0 && <SectionHeading eyebrow={album.name} title="Photos" />}
            <PhotoGrid title={album.name} photos={album.photos} />
          </div>
        </section>
      )}

      {album.total === 0 && (
        <section className="py-14">
          <div className="container-x text-muted">No photos here yet.</div>
        </section>
      )}
    </>
  );
}
