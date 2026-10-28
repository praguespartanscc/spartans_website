import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMatch, getMatches, pragueToday } from '@/lib/data';
import { CLUB_NAME, SITE_URL } from '@/lib/club';
import { dateParts, formatDivision, formatTime, titleCase, youTubeId } from '@/lib/format';
import MatchRow, { ResultChip } from '@/components/MatchRow';
import { ArrowRight, ArrowUpRight, Calendar, Clock, MapPin } from '@/components/ui/Icons';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getMatches()).map((m) => ({ id: String(m.id) }));
}

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getMatch(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await load(params);
  if (!match) return {};
  const d = dateParts(match.date);
  const title = `${match.team1} vs ${match.team2}, ${d.day} ${d.month} ${d.year}`;
  return {
    title,
    description: [
      match.summary,
      `${titleCase(match.type) || 'Cricket'} match on ${d.long}${match.venue ? ` at ${match.venue}` : ''}.`,
      'Scorecard, live stream and details from Prague Spartans Cricket Club.',
    ]
      .filter(Boolean)
      .join(' '),
    alternates: { canonical: `/fixtures/${match.id}` },
    openGraph: { url: `/fixtures/${match.id}`, title },
  };
}

// Google Calendar "add event" link; matches are given a four-hour slot.
function calendarLink(m: { team1: string; team2: string; date: string; time: string | null; venue: string | null }) {
  const day = m.date.replaceAll('-', '');
  let dates: string;
  const t = /^(\d{1,2}):(\d{2})/.exec(m.time ?? '');
  if (t) {
    const start = `${day}T${t[1].padStart(2, '0')}${t[2]}00`;
    const endHour = Math.min(Number(t[1]) + 4, 23);
    dates = `${start}/${day}T${String(endHour).padStart(2, '0')}${t[2]}00`;
  } else {
    const next = new Date(`${m.date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    dates = `${day}/${next.toISOString().slice(0, 10).replaceAll('-', '')}`;
  }
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${m.team1} vs ${m.team2} (Prague Spartans)`,
    dates,
    ctz: 'Europe/Prague',
    ...(m.venue ? { location: m.venue } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export default async function MatchPage({ params }: Props) {
  const match = await load(params);
  if (!match) notFound();

  const today = pragueToday();
  const d = dateParts(match.date);
  const upcoming = match.result === 'will be played' && match.date >= today;
  const live = match.date === today && !!match.stream_url;
  const videoId = youTubeId(match.stream_url);
  const details = [titleCase(match.type), formatDivision(match.division)].filter(Boolean).join(' · ');
  const others = (await getMatches())
    .filter((m) => m.id !== match.id && m.result === 'will be played' && m.date >= today)
    .slice(0, 3);

  const time = formatTime(match.time);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.team1} vs ${match.team2}`,
    sport: 'Cricket',
    startDate: time ? `${match.date}T${time}` : match.date,
    eventStatus: 'https://schema.org/EventScheduled',
    url: `${SITE_URL}/fixtures/${match.id}`,
    ...(match.venue ? { location: { '@type': 'Place', name: match.venue, address: match.venue } } : {}),
    competitor: [match.team1, match.team2].map((name) => ({ '@type': 'SportsTeam', name })),
    organizer: { '@type': 'SportsOrganization', name: CLUB_NAME, url: SITE_URL },
    ...(match.summary ? { description: match.summary } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-cream/12">
        <div className="container-x py-12 sm:py-16">
          <Link href="/fixtures" className="link-arrow mb-8 text-[16px]">
            <ArrowRight size={16} className="rotate-180" /> All fixtures
          </Link>
          <div className="rise flex flex-wrap items-center gap-3">
            <ResultChip result={match.result} live={live} />
            {details && <span className="eyebrow">{details}</span>}
          </div>
          <h1 className="display rise mt-5 text-[clamp(40px,7vw,96px)] leading-[0.95]" style={{ ['--d' as string]: '80ms' }}>
            {match.team1}
            <span className="block font-display text-[0.38em] font-extrabold italic text-gold">vs</span>
            {match.team2}
          </h1>
          {match.summary && (
            <p className="rise h-sub mt-6 text-[clamp(24px,3vw,36px)] text-gold" style={{ ['--d' as string]: '140ms' }}>
              {match.summary}
            </p>
          )}
          <ul className="rise mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[17px] text-sand" style={{ ['--d' as string]: '200ms' }}>
            <li className="inline-flex items-center gap-2">
              <Calendar size={18} className="text-gold" /> {d.long}
            </li>
            {time && (
              <li className="inline-flex items-center gap-2">
                <Clock size={18} className="text-gold" /> {time}
              </li>
            )}
            {match.venue && (
              <li className="inline-flex items-center gap-2">
                <MapPin size={18} className="text-gold" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-cream/30 underline-offset-4 hover:decoration-gold"
                >
                  {match.venue}
                </a>
              </li>
            )}
          </ul>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '260ms' }}>
            {match.url && (
              <a href={match.url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                {upcoming ? 'Match on CricHeroes' : 'Scorecard on CricHeroes'} <ArrowUpRight size={16} />
              </a>
            )}
            {match.stream_url && !videoId && (
              <a href={match.stream_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Watch the stream <ArrowUpRight size={16} />
              </a>
            )}
            {upcoming && (
              <a href={calendarLink(match)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Add to calendar
              </a>
            )}
          </div>
        </div>
      </section>

      {videoId && (
        <section aria-label={live ? 'Live stream' : 'Match video'} className="py-12 sm:py-16">
          <div className="container-x">
            <h2 className="h-sub mb-5 text-[30px]">{live ? 'Watch live' : upcoming ? 'Live stream' : 'Match replay'}</h2>
            <div className="relative aspect-video w-full overflow-hidden border border-cream/12 bg-panel">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                title={`${match.team1} vs ${match.team2} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="next-up" className="border-t border-cream/12 bg-ink-2 py-14 sm:py-20">
          <div className="container-x">
            <h2 id="next-up" className="h-section mb-6">
              Next up
            </h2>
            <div className="border-t border-cream/12">
              {others.map((m) => (
                <MatchRow key={m.id} match={m} live={m.date === today && !!m.stream_url} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
