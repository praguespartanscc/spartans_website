import Link from 'next/link';
import type { Album } from '@/lib/drive';
import { photoSrcSet, photoUrl } from '@/lib/photos';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function AlbumCard({ album, priority }: { album: Album; priority?: boolean }) {
  return (
    <Link href={`/gallery/${album.path.join('/')}`} className="card card-hover group flex h-full flex-col overflow-hidden">
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
          <span className="h-sub block text-[28px] leading-tight text-cream group-hover:text-gold">{album.name}</span>
          <span className="mt-1 block text-[14px] text-sand">
            {plural(album.total, 'photo')}
            {album.albums.length > 0 && ` · ${plural(album.albums.length, 'album')}`}
          </span>
        </span>
      </span>
    </Link>
  );
}
