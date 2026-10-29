'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { driveFileUrl, photoSrcSet, photoUrl } from '@/lib/photos';
import { ArrowRight, ArrowUpRight, Close } from '@/components/ui/Icons';
import type { Lang } from '@/lib/i18n';

export type GridPhoto = { id: string; name: string; width: number | null; height: number | null };

const LABELS = {
  en: {
    list: (title: string) => `${title} photos`,
    open: (n: number, total: number) => `Open photo ${n} of ${total}`,
    alt: (title: string, n: number) => `${title} – Prague Spartans Cricket Club, photo ${n}`,
    viewer: (title: string, n: number, total: number) => `${title}: photo ${n} of ${total}`,
    fullSize: 'Full size',
    close: 'Close',
    previous: 'Previous photo',
    next: 'Next photo',
  },
  cs: {
    list: (title: string) => `Fotky: ${title}`,
    open: (n: number, total: number) => `Otevřít fotku ${n} z ${total}`,
    alt: (title: string, n: number) => `${title} – Prague Spartans Cricket Club, fotka ${n}`,
    viewer: (title: string, n: number, total: number) => `${title}: fotka ${n} z ${total}`,
    fullSize: 'Plná velikost',
    close: 'Zavřít',
    previous: 'Předchozí fotka',
    next: 'Další fotka',
  },
};

// Masonry grid of photos; tapping one opens a full-screen viewer (arrow keys, swipe, Esc).
export default function PhotoGrid({ photos, title, lang = 'en' }: { photos: GridPhoto[]; title: string; lang?: Lang }) {
  const [open, setOpen] = useState<number | null>(null);
  const t = LABELS[lang];

  return (
    <>
      <ul className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4" aria-label={t.list(title)}>
        {photos.map((p, i) => (
          <li key={p.id} className="mb-2 break-inside-avoid sm:mb-3">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block w-full overflow-hidden bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
              aria-label={t.open(i + 1, photos.length)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */}
              <img
                src={photoUrl(p.id, 800)}
                srcSet={photoSrcSet(p.id, [400, 800, 1200])}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                width={p.width ?? 800}
                height={p.height ?? 600}
                alt={t.alt(title, i + 1)}
                loading={i < 8 ? 'eager' : 'lazy'}
                decoding="async"
                className="block h-auto w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Viewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} title={title} lang={lang} />}
    </>
  );
}

function Viewer({
  photos,
  index,
  onIndex,
  onClose,
  title,
  lang,
}: {
  photos: GridPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  title: string;
  lang: Lang;
}) {
  const t = LABELS[lang];
  const photo = photos[index];
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Which way the last change went, so the next photo slides in from that side.
  const [dir, setDir] = useState(0);
  const [closing, setClosing] = useState(false);
  const go = useCallback(
    (step: number) => {
      setDir(step);
      onIndex((index + step + photos.length) % photos.length);
    },
    [index, photos.length, onIndex],
  );
  // Fade out before unmounting.
  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
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
  }, [go, close]);

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
      aria-label={t.viewer(title, index + 1, photos.length)}
      className={`fixed inset-0 z-[300] flex flex-col bg-ink/95 backdrop-blur-sm ${closing ? 'lightbox-out' : 'lightbox-in'}`}
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
            {t.fullSize} <ArrowUpRight size={14} />
          </a>
          <button ref={closeRef} type="button" onClick={close} aria-label={t.close} className="flex h-11 w-11 items-center justify-center text-cream hover:text-gold">
            <Close size={26} />
          </button>
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16" onClick={(e) => e.target === e.currentTarget && close()}>
        {photos.length > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label={t.previous} className={`${navBtn} left-3`}>
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
          className={`max-h-full max-w-full select-none object-contain ${dir > 0 ? 'photo-next' : dir < 0 ? 'photo-prev' : 'photo-in'}`}
          draggable={false}
        />
        {photos.length > 1 && (
          <button type="button" onClick={() => go(1)} aria-label={t.next} className={`${navBtn} right-3`}>
            <ArrowRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
