import Link from 'next/link';
import type { Album } from '@/lib/drive';
import { albumName, photoSrcSet, photoUrl } from '@/lib/photos';
import { localePath, type Lang } from '@/lib/i18n';

// Czech counts take three forms: 1 fotka, 2–4 fotky, 5+ (and 0) fotek.
function czechPlural(n: number, one: string, few: string, many: string) {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many;
}

// "5 photos" / "5 fotek".
export function photoCount(n: number, lang: Lang = 'en') {
  return lang === 'cs' ? `${n} ${czechPlural(n, 'fotka', 'fotky', 'fotek')}` : `${n} photo${n === 1 ? '' : 's'}`;
}

// "2 albums" / "2 alba".
export function albumCount(n: number, lang: Lang = 'en') {
  return lang === 'cs' ? `${n} ${czechPlural(n, 'album', 'alba', 'alb')}` : `${n} album${n === 1 ? '' : 's'}`;
}

export default function AlbumCard({ album, priority, lang = 'en' }: { album: Album; priority?: boolean; lang?: Lang }) {
  return (
    <Link
      href={localePath(lang, `/gallery/${album.path.join('/')}`)}
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-panel-2">
        {album.cover && (
          // eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN
          <img
            src={photoUrl(album.cover.id, 800)}
            srcSet={photoSrcSet(album.cover.id, [400, 800, 1200])}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-5">
          <span className="h-sub block text-[28px] leading-tight text-cream group-hover:text-gold">{albumName(album.name, lang)}</span>
          <span className="mt-1 block text-[14px] text-sand">
            {photoCount(album.total, lang)}
            {album.albums.length > 0 && ` · ${albumCount(album.albums.length, lang)}`}
          </span>
        </span>
      </span>
    </Link>
  );
}
