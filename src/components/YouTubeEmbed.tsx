// Privacy-friendly YouTube player (no cookies until the visitor presses play).
export default function YouTubeEmbed({ id, title, autoplay }: { id: string; title: string; autoplay?: boolean }) {
  const params = new URLSearchParams({ rel: '0', ...(autoplay ? { autoplay: '1', mute: '1' } : {}) });
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
