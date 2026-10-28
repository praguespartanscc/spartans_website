'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { driveFileUrl, photoSrcSet, photoUrl } from '@/lib/photos';
import { ArrowRight, ArrowUpRight, Close } from '@/components/ui/Icons';

export type GridPhoto = { id: string; name: string; width: number | null; height: number | null };

// Masonry grid of photos; tapping one opens a full-screen viewer (arrow keys, swipe, Esc).
export default function PhotoGrid({ photos, title }: { photos: GridPhoto[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4" aria-label={`${title} photos`}>
        {photos.map((p, i) => (
          <li key={p.id} className="mb-2 break-inside-avoid sm:mb-3">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */}
              <img
                src={photoUrl(p.id, 800)}
                srcSet={photoSrcSet(p.id, [400, 800, 1200])}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                width={p.width ?? 800}
                height={p.height ?? 600}
                alt=""
                loading={i < 8 ? 'eager' : 'lazy'}
                decoding="async"
                className="block h-auto w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Viewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} title={title} />}
    </>
  );
}

function Viewer({
  photos,
  index,
  onIndex,
  onClose,
  title,
}: {
  photos: GridPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  title: string;
}) {
  const photo = photos[index];
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const go = useCallback((step: number) => onIndex((index + step + photos.length) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const previous = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [go, onClose]);

  // Load the neighbours in the background so swiping feels instant.
  useEffect(() => {
    for (const step of [1, -1]) {
      const n = photos[(index + step + photos.length) % photos.length];
      if (n) new window.Image().src = photoUrl(n.id, 1600);
    }
  }, [index, photos]);

  const navBtn = 'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center bg-ink/70 text-cream transition-colors hover:text-gold sm:flex';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[300] flex flex-col bg-ink/95 backdrop-blur-sm"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-[15px] text-muted">
        <span>
          {index + 1} / {photos.length}
        </span>
        <span className="flex items-center gap-2">
          <a href={driveFileUrl(photo.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-2 hover:text-cream">
            Full size <ArrowUpRight size={14} />
          </a>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center text-cream hover:text-gold">
            <Close size={26} />
          </button>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {photos.length > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${navBtn} left-3`}>
            <ArrowRight size={22} className="rotate-180" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */}
        <img
          key={photo.id}
          src={photoUrl(photo.id, 1600)}
          srcSet={photoSrcSet(photo.id, [800, 1600, 2400])}
          sizes="100vw"
          alt={photo.name}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
        {photos.length > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${navBtn} right-3`}>
            <ArrowRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
