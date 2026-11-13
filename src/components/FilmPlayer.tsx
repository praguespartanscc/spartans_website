'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Close } from '@/components/ui/Icons';
import { SEASON_FILM } from '@/lib/club';
import { tr, type Lang } from '@/lib/i18n';

// The season film in a pop-up: dark backdrop, the browser's own video controls, Escape to close.
// The file is only requested once this opens. Rendered into <body> so no section can clip it.
function FilmPlayer({ at, lang, onClose }: { at: number; lang: Lang; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      // Two stops only: the close button and the video.
      const first = closeRef.current;
      const last = videoRef.current;
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, [close]);

  // Start at the chosen chapter.
  const onReady = () => {
    const v = videoRef.current;
    if (!v) return;
    if (at > 0 && Math.abs(v.currentTime - at) > 1) v.currentTime = at;
    v.play().catch(() => {});
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, { en: `${SEASON_FILM.season} season film`, cs: `Film o sezóně ${SEASON_FILM.season}` })}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink/[0.98] p-4 ${closing ? 'lightbox-out' : 'lightbox-in'}`}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="flex w-full max-w-[908px] items-center justify-between gap-4 pb-3">
        <p className="eyebrow">{tr(lang, { en: `${SEASON_FILM.season} season film`, cs: `Film o sezóně ${SEASON_FILM.season}` })}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="grid h-11 w-11 place-items-center text-cream hover:text-gold"
          aria-label={tr(lang, { en: 'Close the film', cs: 'Zavřít film' })}
        >
          <Close size={26} />
        </button>
      </div>
      {/* Shown at the film's own size (908 pixels wide), never stretched. */}
      <video
        ref={videoRef}
        src={SEASON_FILM.src}
        poster={SEASON_FILM.poster}
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={onReady}
        className="photo-in aspect-[908/512] max-h-[calc(100svh-120px)] w-full max-w-[908px] bg-ink"
      />
      <p className="mt-3 w-full max-w-[908px] text-sm text-muted">{tr(lang, { en: 'The film has no sound.', cs: 'Film je bez zvuku.' })}</p>
    </div>,
    document.body,
  );
}

// Any button that opens the film, optionally at a chapter (seconds).
export function FilmButton({ at = 0, lang, className, label, children }: { at?: number; lang: Lang; className?: string; label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label={label} aria-haspopup="dialog">
        {children}
      </button>
      {open && <FilmPlayer at={at} lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}
