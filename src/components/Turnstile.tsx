'use client';

import { useEffect, useRef } from 'react';
import type { Lang } from '@/lib/i18n';

// Cloudflare Turnstile widget (the quiet "are you human" check). Renders nothing unless
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the form keeps working without it.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';

export default function Turnstile({ lang, onToken }: { lang: Lang; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return;
    const el = box.current;
    const render = () => {
      if (!window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(el, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        language: lang,
        callback: (token: string) => callback.current(token),
        'expired-callback': () => callback.current(''),
        'error-callback': () => callback.current(''),
      });
    };
    if (window.turnstile) render();
    else {
      window.onTurnstileLoad = render;
      if (!document.querySelector(`script[src^="https://challenges.cloudflare.com/turnstile"]`)) {
        const s = document.createElement('script');
        s.src = SCRIPT;
        s.async = true;
        document.head.appendChild(s);
      }
    }
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [lang]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" />;
}
