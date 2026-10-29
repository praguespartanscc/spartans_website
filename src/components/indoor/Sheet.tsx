'use client';

import { useEffect, useRef } from 'react';
import { Close } from '@/components/ui/Icons';

// Bottom sheet for the scorer: big targets, closes on Escape or a tap on the scrim.
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button type="button" aria-label="Close" className="scrim-in absolute inset-0 bg-ink/75" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sheet-in relative max-h-[88vh] w-full max-w-lg overflow-y-auto border-t border-cream/12 bg-panel px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 outline-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream/20" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="h-sub text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Close">
            <Close size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
