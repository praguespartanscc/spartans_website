import Link from 'next/link';
import type { Video } from '@/lib/youtube';
import type { LiveNow } from '@/lib/data';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { ArrowRight } from '@/components/ui/Icons';

// Red bar at the top of the home page while something is on: the YouTube stream first, then
// an indoor match being scored, then a training session happening right now.
export default function LiveBar({ live, now, lang = 'en' }: { live: Video | null; now?: LiveNow; lang?: Lang }) {
  const indoor = now?.indoor[0];
  const session = now?.sessions.find((s) => s.status === 'now');
  if (!live && !indoor && !session) return null;

  const item = live
    ? { label: tr(lang, { en: 'Live now on YouTube', cs: 'Právě živě na YouTube' }), detail: live.title, href: '/live', action: tr(lang, { en: 'Watch', cs: 'Sledovat' }) }
    : indoor
      ? {
          label: tr(lang, { en: 'Live score', cs: 'Živé skóre' }),
          detail: `${indoor.team_a} v ${indoor.team_b}`,
          href: `/indoor/${indoor.share_slug}`,
          action: tr(lang, { en: 'Follow', cs: 'Sledovat' }),
        }
      : {
          label: tr(lang, { en: 'Training on now', cs: 'Právě trénujeme' }),
          detail: `${session!.start}–${session!.end}${session!.venue ? `, ${session!.venue}` : ''}`,
          href: '/live',
          action: tr(lang, { en: 'Details', cs: 'Podrobnosti' }),
        };

  return (
    <section aria-label={item.label} className="bg-crimson text-white">
      <div className="container-x flex flex-wrap items-center justify-between gap-4 py-4">
        <p className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.14em]">
            <span className="live-dot h-2 w-2 rounded-full bg-white" /> {item.label}
          </span>
          <span className="truncate">{item.detail}</span>
        </p>
        <Link href={localePath(lang, item.href)} className="btn min-h-11 bg-white text-crimson hover:bg-sand">
          {item.action} <ArrowRight size={16} className="btn-arrow" />
        </Link>
      </div>
    </section>
  );
}
