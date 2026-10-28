import Link from 'next/link';
import type { Video } from '@/lib/youtube';
import { ArrowRight } from '@/components/ui/Icons';

// Shown at the top of the home page only while the club's YouTube channel is live.
export default function LiveBar({ live }: { live: Video | null }) {
  if (!live) return null;
  return (
    <section aria-label="Live now on YouTube" className="bg-crimson text-white">
      <div className="container-x flex flex-wrap items-center justify-between gap-4 py-4">
        <p className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.14em]">
            <span className="live-dot h-2 w-2 rounded-full bg-white" /> Live now on YouTube
          </span>
          <span className="hidden truncate sm:inline">{live.title}</span>
        </p>
        <Link href="/live" className="btn min-h-11 bg-white text-crimson hover:bg-sand">
          Watch <ArrowRight size={16} className="btn-arrow" />
        </Link>
      </div>
    </section>
  );
}
