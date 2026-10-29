import type { Photo } from '@/lib/drive';
import { photoCaption, photoSrcSet, photoUrl } from '@/lib/photos';
import { tr, type Lang } from '@/lib/i18n';

// A photo from the Drive "Thumbnails" folder, filling its (relative) parent. Renders nothing when
// there is no photo, so the section falls back to the plain black background.
export default function SitePhoto({
  photo,
  lang = 'en',
  sizes,
  className = '',
  decorative = false,
  eager = false,
}: {
  photo: Photo | null;
  lang?: Lang;
  sizes: string;
  className?: string;
  decorative?: boolean;
  eager?: boolean;
}) {
  if (!photo) return null;
  const caption = photoCaption(photo.name);
  const alt = decorative
    ? ''
    : caption
      ? `${caption}, ${tr(lang, { en: 'Prague Spartans Cricket Club', cs: 'kriketový klub Prague Spartans' })}`
      : tr(lang, { en: 'Prague Spartans Cricket Club players', cs: 'Hráči kriketového klubu Prague Spartans' });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN
    <img
      src={photoUrl(photo.id, 1200)}
      srcSet={photoSrcSet(photo.id, [600, 900, 1200, 1600, 2000])}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}

