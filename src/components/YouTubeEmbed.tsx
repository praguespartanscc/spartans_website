import type { Lang } from '@/lib/i18n';

// Privacy-friendly YouTube player (no cookies until the visitor presses play).
// `lang` sets the player's interface language (hl) to match the page.
export default function YouTubeEmbed({
  id,
  title,
  autoplay,
  lang = 'en',
}: {
  id: string;
  title: string;
  autoplay?: boolean;
  lang?: Lang;
}) {
  const params = new URLSearchParams({ rel: '0', hl: lang, ...(autoplay ? { autoplay: '1', mute: '1' } : {}) });
  return (
    <div className="relative aspect-video w-full overflow-hidden border border-cream/12 bg-panel">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
