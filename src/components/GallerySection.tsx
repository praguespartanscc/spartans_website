import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import type { Photo } from '@/lib/drive';
import { photoSrcSet, photoUrl } from '@/lib/photos';
import SectionHeading from '@/components/ui/SectionHeading';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

const COLS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

// Grid of the Drive "Thumbnails" photos on the home page. Hidden when there are none.
// `href` is the English path. It is localised here.
export default function GallerySection({ photos, lang = 'en' }: { photos: { photo: Photo; href: string }[]; lang?: Lang }) {
  if (photos.length === 0) return null;
  // With only a few photos, skip the big first tile and use fewer columns.
  const few = photos.length < 5;

  return (
    <section className="py-20 sm:py-28" aria-labelledby="gallery-heading">
      <div className="container-x">
        <SectionHeading
          id="gallery-heading"
          eyebrow={tr(lang, { en: 'Gallery', cs: 'Galerie' })}
          title={tr(lang, { en: 'Life at the club', cs: 'Život v klubu' })}
          action={
            <Link href={localePath(lang, '/gallery')} className="link-arrow">
              {tr(lang, { en: 'See all photos', cs: 'Všechny fotky' })} <ArrowRight size={18} />
            </Link>
          }
        />
        <Reveal className={`stagger grid grid-cols-2 gap-2 sm:gap-3 ${few ? COLS[Math.min(photos.length, 4)] : 'sm:grid-cols-4'}`}>
          {photos.slice(0, 8).map(({ photo, href }, i) => (
            <Link
              key={photo.id}
              href={localePath(lang, href)}
              aria-label={tr(lang, { en: 'Open the photo gallery', cs: 'Otevřít fotogalerii' })}
              className={`group relative block overflow-hidden bg-panel-2 ${i === 0 && !few ? 'col-span-2 row-span-2' : ''} ${photos.length === 1 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <span className={`block ${photos.length === 1 ? 'aspect-[16/9]' : 'aspect-square'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */}
                <img
                  src={photoUrl(photo.id, i === 0 ? 1200 : 600)}
                  srcSet={photoSrcSet(photo.id, i === 0 ? [800, 1200, 1600] : [400, 600, 800])}
                  sizes={i === 0 ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 640px) 25vw, 50vw'}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                />
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
