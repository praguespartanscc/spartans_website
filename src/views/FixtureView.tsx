import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMatch, getMatches, getSelection, pragueToday } from '@/lib/data';
import { CLUB_NAME, GOVERNING_BODY, GROUND, ORG_ID, SITE_URL, SQUADS, squadByName, squadId, MATCH_TYPE_LABEL } from '@/lib/club';
import { dateParts, formatDivision, formatTime, parseDate, pragueISO, titleCase, youTubeId } from '@/lib/format';
import { LOCALE, localePath, tr, type Lang } from '@/lib/i18n';
import { OG_IMAGE, pageMeta } from '@/lib/seo';
import { breadcrumbs, groundNode } from '@/lib/structured';
import { getLiveStatus } from '@/lib/youtube';
import type { Match } from '@/types/supabase';
import MatchRow, { ResultChip } from '@/components/MatchRow';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, ArrowUpRight, Calendar, Clock, MapPin } from '@/components/ui/Icons';

// Shared by /fixtures/[id] (English) and /cs/fixtures/[id] (Czech).

async function load(id: string) {
  const n = Number(id);
  return Number.isInteger(n) ? getMatch(n) : null;
}

// The club squad a team name refers to ("Vanguards", "Prague Spartans Mobilizers", ...).
function squadOf(team: string) {
  const name = SQUADS.map((s) => s.name).find((n) => team.toLowerCase().includes(n.toLowerCase()));
  return name ? squadByName(name) : null;
}

// "Vanguards" -> "Prague Spartans Vanguards"; opponents are left as they are.
function teamLabel(team: string) {
  return squadOf(team) && !/spartans/i.test(team) ? `Prague Spartans ${team}` : team;
}

const isVinor = (venue?: string | null) => !!venue && /vino[rř]/i.test(venue);

const vs = (lang: Lang) => tr(lang, { en: 'vs', cs: 'vs.' });

function matchName(m: Match, lang: Lang) {
  return `${teamLabel(m.team1)} ${vs(lang)} ${teamLabel(m.team2)}`;
}

function shortDate(value: string, lang: Lang) {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' });
}

// "Division 1 league match" / "zápas 1. divize".
function matchKind(m: Match, lang: Lang) {
  const division = formatDivision(m.division, lang);
  const type = m.type ?? '';
  if (lang === 'cs') {
    if (division) return `zápas ${division}`;
    return { league: 'ligový zápas', friendly: 'přátelský zápas', tournament: 'turnajový zápas' }[type] ?? 'kriketový zápas';
  }
  const typeWord = { league: 'league', friendly: 'friendly', tournament: 'tournament' }[type];
  return [division, typeWord ?? (division ? '' : 'cricket'), 'match'].filter(Boolean).join(' ');
}

function description(m: Match, lang: Lang) {
  const d = dateParts(m.date, lang);
  const sentence = tr(lang, {
    en: `${matchName(m, lang)}: ${matchKind(m, lang)} on ${d.long}${m.venue ? ` at ${m.venue}` : ''}.`,
    cs: `${matchName(m, lang)}: ${matchKind(m, lang)}, ${d.long}${m.venue ? `, ${m.venue}` : ''}.`,
  });
  const tail = tr(lang, {
    en: 'Scorecard, live stream and details from Prague Spartans Cricket Club.',
    cs: 'Výsledky, živý přenos a podrobnosti o zápase na webu kriketového klubu Prague Spartans.',
  });
  return [m.summary, sentence, tail].filter(Boolean).join(' ');
}

function matchImages(m: Match, alt: string) {
  return m.image_url && /^https?:\/\//.test(m.image_url) ? [{ url: m.image_url, alt }] : undefined;
}

export async function fixtureMeta(lang: Lang, id: string): Promise<Metadata> {
  const match = await load(id);
  if (!match) notFound();
  const title = `${matchName(match, lang)} – ${shortDate(match.date, lang)}`;
  const named = /prague spartans/i.test(title);
  return pageMeta({
    lang,
    path: `/fixtures/${match.id}`,
    ...(named ? { absoluteTitle: title } : { title }),
    description: description(match, lang),
    images: matchImages(match, title),
  });
}

function eventStatus(m: Match) {
  const text = `${m.result} ${m.summary ?? ''}`;
  if (/cancel|abandon/i.test(text)) return 'https://schema.org/EventCancelled';
  if (/postpon/i.test(text)) return 'https://schema.org/EventPostponed';
  return 'https://schema.org/EventScheduled';
}

function eventLocation(venue: string | null) {
  if (isVinor(venue)) return groundNode();
  const inPrague = !venue || /prague|praha|praze/i.test(venue);
  return {
    '@type': 'Place',
    name: venue ?? 'Prague',
    address: { '@type': 'PostalAddress', ...(inPrague ? { addressLocality: 'Prague' } : {}), addressCountry: 'CZ' },
  };
}

function sportsEvent(m: Match, lang: Lang) {
  const { start, end } = pragueISO(m.date, m.time);
  const image = m.image_url && /^https?:\/\//.test(m.image_url) ? m.image_url : `${SITE_URL}${OG_IMAGE.url}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: matchName(m, lang),
    description: description(m, lang),
    sport: 'Cricket',
    url: `${SITE_URL}${localePath(lang, `/fixtures/${m.id}`)}`,
    startDate: start,
    ...(end ? { endDate: end } : {}),
    eventStatus: eventStatus(m),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: eventLocation(m.venue),
    image: [image],
    competitor: [m.team1, m.team2].map((name) => {
      const s = squadOf(name);
      return s
        ? { '@type': 'SportsTeam', '@id': squadId(s.slug), name: `Prague Spartans ${s.name}`, url: `${SITE_URL}/squads/${s.slug}` }
        : { '@type': 'SportsTeam', name };
    }),
    organizer:
      m.type === 'friendly'
        ? { '@type': 'SportsOrganization', '@id': ORG_ID, name: CLUB_NAME, url: `${SITE_URL}/` }
        : { '@type': 'SportsOrganization', name: GOVERNING_BODY.name, url: GOVERNING_BODY.url },
  };
}

// Google Calendar "add event" link; matches are given a four-hour slot.
function calendarLink(m: Match) {
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

// A team name in the H1, linked to its squad page when it is one of ours.
function TeamName({ team, lang }: { team: string; lang: Lang }) {
  const s = squadOf(team);
  if (!s) return <>{team}</>;
  return (
    <Link href={localePath(lang, `/squads/${s.slug}`)} className="transition-colors hover:text-gold">
      {teamLabel(team)}
    </Link>
  );
}

export default async function FixtureView({ lang, id }: { lang: Lang; id: string }) {
  const match = await load(id);
  if (!match) notFound();

  const today = pragueToday();
  const d = dateParts(match.date, lang);
  const upcoming = match.result === 'will be played' && match.date >= today;
  // The match's own stream link wins; on match day, fall back to whatever the club channel has live.
  const channelLive = match.date === today && !youTubeId(match.stream_url) ? (await getLiveStatus()).live : null;
  const videoId = youTubeId(match.stream_url) ?? channelLive?.id ?? null;
  const live = match.date === today && (!!match.stream_url || !!channelLive);
  const type = MATCH_TYPE_LABEL[match.type ?? '']?.[lang] ?? titleCase(match.type);
  const details = [type, formatDivision(match.division, lang)].filter(Boolean).join(' · ');
  const selection = await getSelection(match.id);
  const others = (await getMatches())
    .filter((m) => m.id !== match.id && m.result === 'will be played' && m.date >= today)
    .slice(0, 3);

  const time = formatTime(match.time);
  const name = matchName(match, lang);
  const linkClass = 'underline decoration-cream/30 underline-offset-4 hover:decoration-gold';

  return (
    <>
      <JsonLd data={sportsEvent(match, lang)} />
      <JsonLd
        data={breadcrumbs(lang, [
          [tr(lang, { en: 'Fixtures & results', cs: 'Zápasy a výsledky' }), '/fixtures'],
          [`${name} – ${shortDate(match.date, lang)}`, `/fixtures/${match.id}`],
        ])}
      />

      <section className="border-b border-cream/12">
        <div className="container-x py-12 sm:py-16">
          <Link href={localePath(lang, '/fixtures')} className="link-arrow mb-8 text-[16px]">
            <ArrowRight size={16} className="rotate-180" /> {tr(lang, { en: 'All fixtures', cs: 'Všechny zápasy' })}
          </Link>
          <div className="rise flex flex-wrap items-center gap-3">
            <ResultChip result={match.result} live={live} lang={lang} />
            {details && <span className="eyebrow">{details}</span>}
          </div>
          <h1 className="display mt-5 text-[clamp(40px,7vw,96px)] leading-[0.95]">
            <span className="mask-line"><span style={{ ['--d' as string]: '80ms' }}>
            <TeamName team={match.team1} lang={lang} />{' '}
            <span className="block font-display text-[0.38em] font-extrabold italic text-gold">{vs(lang)}</span>{' '}
            <TeamName team={match.team2} lang={lang} />
            </span></span>
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
                {isVinor(match.venue) ? (
                  <Link href={localePath(lang, '/ground')} className={linkClass} title={GROUND.name}>
                    {match.venue}
                  </Link>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {match.venue}
                  </a>
                )}
              </li>
            )}
          </ul>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '260ms' }}>
            {match.url && (
              <a href={match.url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                {upcoming
                  ? tr(lang, { en: 'Match on CricHeroes', cs: 'Zápas na CricHeroes' })
                  : tr(lang, { en: 'Scorecard on CricHeroes', cs: 'Podrobné výsledky na CricHeroes' })}{' '}
                <ArrowUpRight size={16} />
              </a>
            )}
            {match.stream_url && !videoId && (
              <a href={match.stream_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                {tr(lang, { en: 'Watch the stream', cs: 'Sledovat přenos' })} <ArrowUpRight size={16} />
              </a>
            )}
            {upcoming && (
              <a href={calendarLink(match)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                {tr(lang, { en: 'Add to calendar', cs: 'Přidat do kalendáře' })}
              </a>
            )}
          </div>
        </div>
      </section>

      {videoId && (
        <section
          aria-label={live ? tr(lang, { en: 'Live stream', cs: 'Živý přenos' }) : tr(lang, { en: 'Match video', cs: 'Video ze zápasu' })}
          className="py-12 sm:py-16"
        >
          <div className="container-x">
            <h2 className="h-sub mb-5 text-[30px]">
              {live
                ? tr(lang, { en: 'Watch live', cs: 'Sledujte živě' })
                : upcoming
                  ? tr(lang, { en: 'Live stream', cs: 'Živý přenos' })
                  : tr(lang, { en: 'Match replay', cs: 'Záznam zápasu' })}
            </h2>
            <YouTubeEmbed id={videoId} title={tr(lang, { en: `${name} video`, cs: `Video: ${name}` })} lang={lang} />
          </div>
        </section>
      )}

      {selection.length > 0 && (
        <section aria-labelledby="xi" className="border-t border-cream/12 py-12 sm:py-16">
          <div className="container-x">
            <h2 id="xi" className="h-section mb-6">
              {tr(lang, { en: 'Playing XI', cs: 'Základní jedenáctka' })}
            </h2>
            <ol className="grid gap-px border border-cream/12 bg-cream/12 sm:grid-cols-2 lg:grid-cols-3">
              {selection.map(({ player, slot, is_captain, is_keeper }, i) => (
                <li key={player.id} className="flex items-center gap-4 bg-ink p-4">
                  <span className="w-8 font-varsity text-[24px] text-gold">{slot === 'twelfth' ? '12' : i + 1}</span>
                  <Link href={localePath(lang, `/players/${player.slug}`)} className="min-w-0 flex-1 font-semibold hover:text-gold">
                    {player.name}
                    {is_captain && (
                      <abbr
                        title={tr(lang, { en: 'Captain', cs: 'Kapitán' })}
                        className="ml-2 bg-gold px-1.5 font-display text-[13px] font-extrabold text-ink no-underline"
                      >
                        C
                      </abbr>
                    )}
                    {is_keeper && (
                      <abbr
                        title={tr(lang, { en: 'Wicketkeeper', cs: 'Brankář' })}
                        className="ml-2 border border-cream/40 px-1.5 font-display text-[13px] font-extrabold no-underline"
                      >
                        {tr(lang, { en: 'WK', cs: 'B' })}
                      </abbr>
                    )}
                  </Link>
                  {slot === 'twelfth' && <span className="text-[13px] text-faint">{tr(lang, { en: '12th', cs: '12. hráč' })}</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="next-up" className="border-t border-cream/12 bg-ink-2 py-14 sm:py-20">
          <div className="container-x">
            <h2 id="next-up" className="h-section mb-6">
              {tr(lang, { en: 'Next up', cs: 'Další zápasy' })}
            </h2>
            <div className="border-t border-cream/12">
              {others.map((m) => (
                <MatchRow key={m.id} match={m} live={m.date === today && !!m.stream_url} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
