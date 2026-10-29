import Link from 'next/link';
import type { LiveNow } from '@/lib/data';
import { ArrowRight, Clock, MapPin } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

// Indoor matches being scored and today's training, shown on the Live page above the stream.
export default function LiveNowCards({ now, lang }: { now: LiveNow; lang: Lang }) {
  const sessions = now.sessions.filter((s) => s.status !== 'done');
  if (!now.indoor.length && !sessions.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {now.indoor.map((m) => {
        const last = m.summary?.innings?.[m.summary.innings.length - 1];
        return (
          <Link key={m.share_slug} href={localePath(lang, `/indoor/${m.share_slug}`)} className="card card-hover group flex flex-col gap-3 border-crimson-hi p-6">
            <span className="flex flex-wrap items-center gap-3">
              <span className="chip bg-crimson text-white">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> {tr(lang, { en: 'Live score', cs: 'Živé skóre' })}
              </span>
              <span className="text-sm text-muted">{tr(lang, { en: 'Indoor match', cs: 'Halový zápas' })}</span>
            </span>
            <span className="h-sub text-[26px] leading-tight">
              {m.team_a} <span className="text-muted">v</span> {m.team_b}
            </span>
            {last && (
              <span className="text-sand">
                {last.team} <span className="font-varsity text-xl text-cream">{last.total}/{last.wickets}</span> <span className="text-muted">({last.overs})</span>
              </span>
            )}
            <span className="link-arrow mt-auto">
              {tr(lang, { en: 'Follow ball by ball', cs: 'Sledovat míček po míčku' })} <ArrowRight size={18} />
            </span>
          </Link>
        );
      })}
      {sessions.map((s) => (
        <Link key={`${s.start}-${s.title}`} href={localePath(lang, '/practices')} className={`card card-hover flex flex-col gap-3 p-6 ${s.status === 'now' ? 'border-gold' : ''}`}>
          <span className="flex flex-wrap items-center gap-3">
            <span className={`chip ${s.status === 'now' ? 'bg-gold text-ink' : 'border-gold text-gold'}`}>
              {s.status === 'now' && <span className="live-dot h-1.5 w-1.5 rounded-full bg-ink" />}
              {s.status === 'now' ? tr(lang, { en: 'Training on now', cs: 'Právě trénujeme' }) : tr(lang, { en: 'Training today', cs: 'Dnes trénujeme' })}
            </span>
          </span>
          <span className="h-sub text-[26px] leading-tight">{s.weekly ? tr(lang, { en: 'Weekly nets', cs: 'Pravidelný trénink v sítích' }) : s.title}</span>
          <span className="flex flex-col gap-1 text-sand">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-gold" /> {s.start}–{s.end}
            </span>
            {s.venue && (
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-gold" /> {s.venue}
              </span>
            )}
          </span>
          <span className="link-arrow mt-auto">
            {tr(lang, { en: 'Training details', cs: 'Podrobnosti o tréninku' })} <ArrowRight size={18} />
          </span>
        </Link>
      ))}
    </div>
  );
}
