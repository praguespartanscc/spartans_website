import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLiveStatus, type Video } from '@/lib/youtube';
import { SITE_URL } from '@/lib/club';
import { LOCALE, localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubRef } from '@/lib/structured';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import JsonLd from '@/components/JsonLd';
import { ArrowUpRight } from '@/components/ui/Icons';

// Shared by /live (English) and /cs/live (Czech).

export function liveMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/live',
    title: tr(lang, { en: 'Spartans TV | Live Cricket from Prague', cs: 'Spartans TV | Kriket živě z Prahy' }),
    description: tr(lang, {
      en: 'Watch Prague Spartans Cricket Club matches live on YouTube with Spartans TV, plus replays and highlights of our cricket in Prague.',
      cs: 'Sledujte zápasy kriketového klubu Prague Spartans živě na YouTube na kanálu Spartans TV. Najdete tu i záznamy a sestřihy z pražského kriketu.',
    }),
  });
}

const when = (lang: Lang, iso?: string) =>
  iso
    ? new Intl.DateTimeFormat(LOCALE[lang], {
        timeZone: 'Europe/Prague',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '';

// VideoObject with a live BroadcastEvent, only while a stream is on air.
function liveVideoLd(video: Video, lang: Lang) {
  const start = video.scheduledStart ?? video.published;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: tr(lang, {
      en: `Live cricket from Prague: ${video.title}, streamed by Prague Spartans Cricket Club on Spartans TV`,
      cs: `Kriket živě z Prahy: ${video.title}. Vysílá Prague Spartans Cricket Club na Spartans TV`,
    }),
    thumbnailUrl: [video.thumbnail || `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`],
    uploadDate: video.published,
    embedUrl: `https://www.youtube.com/embed/${video.id}`,
    url: `${SITE_URL}${localePath(lang, '/live')}`,
    inLanguage: lang,
    creator: clubRef,
    publisher: clubRef,
    publication: { '@type': 'BroadcastEvent', isLiveBroadcast: true, startDate: start },
  };
}

function VideoCard({ video, lang }: { video: Video; lang: Lang }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      <span className="relative block aspect-video overflow-hidden bg-panel-2">
        <Image
          src={video.thumbnail}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
        />
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="font-semibold leading-snug group-hover:text-gold">{video.title}</span>
        <span className="mt-1 text-[14px] text-faint">
          {new Date(video.published).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </span>
    </a>
  );
}

export default async function LiveView({ lang }: { lang: Lang }) {
  const status = await getLiveStatus();
  const next = status.upcoming[0];

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [['Spartans TV', '/live']])} />
      {status.live && <JsonLd data={liveVideoLd(status.live, lang)} />}

      <section className="border-b border-cream/12">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow rise">
            {status.live ? tr(lang, { en: 'Live now', cs: 'Právě živě' }) : tr(lang, { en: 'Watch live', cs: 'Sledujte živě' })}
          </p>
          <h1 className="display mt-3 text-[clamp(48px,8vw,104px)]">
            <span className="mask-line"><span style={{ ['--d' as string]: '80ms' }}>
            Spartans <span className="text-gold">TV</span>{' '}
            <span className="mt-3 block font-display text-[0.3em] font-extrabold italic tracking-wide text-sand">
              {tr(lang, { en: 'Live cricket from Prague', cs: 'Kriket živě z Prahy' })}
            </span>
            </span></span>
          </h1>
          <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-sand" style={{ ['--d' as string]: '120ms' }}>
            {tr(lang, {
              en: 'Spartans TV is the YouTube channel of Prague Spartans Cricket Club. Our matches are streamed here live when they are on, and replays and highlights stay below.',
              cs: 'Spartans TV je kanál kriketového klubu Prague Spartans na YouTube. Když se hraje, vysíláme zápasy živě právě tady. Záznamy a sestřihy najdete níže.',
            })}
          </p>

          <div className="rise mt-10" style={{ ['--d' as string]: '160ms' }}>
            {status.live ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="chip bg-crimson text-white">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> {tr(lang, { en: 'Live', cs: 'Živě' })}
                  </span>
                  <h2 className="h-sub text-[clamp(22px,2.6vw,32px)]">{status.live.title}</h2>
                </div>
                <YouTubeEmbed id={status.live.id} title={status.live.title} autoplay lang={lang} />
                <a
                  href={`https://www.youtube.com/watch?v=${status.live.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold mt-6"
                >
                  {tr(lang, { en: 'Watch on YouTube', cs: 'Sledovat na YouTube' })} <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <div className="card flex flex-col gap-4 p-8 sm:p-12">
                <p className="h-sub text-[clamp(26px,3vw,40px)]">
                  {tr(lang, { en: 'Nothing live at the moment', cs: 'Momentálně nic nevysíláme' })}
                </p>
                {next ? (
                  <p className="text-lg text-sand">
                    {tr(lang, { en: 'Next stream:', cs: 'Další přenos:' })} <span className="font-semibold text-cream">{next.title}</span>
                    {next.scheduledStart && <> · {when(lang, next.scheduledStart)}</>}
                  </p>
                ) : (
                  <p className="text-lg text-muted">
                    {tr(lang, {
                      en: (
                        <>
                          Matches are streamed here when they&apos;re on. Check the{' '}
                          <Link href={localePath(lang, '/fixtures')} className="text-gold hover:text-gold-hi">
                            fixtures
                          </Link>{' '}
                          for the next game.
                        </>
                      ),
                      cs: (
                        <>
                          Zápasy tu vysíláme živě, když se hrají. Kdy je další zápas, zjistíte v{' '}
                          <Link href={localePath(lang, '/fixtures')} className="text-gold hover:text-gold-hi">
                            přehledu zápasů
                          </Link>
                          .
                        </>
                      ),
                    })}
                  </p>
                )}
                {status.channelUrl && (
                  <div className="flex flex-wrap gap-3">
                    <a href={`${status.channelUrl}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                      {tr(lang, { en: 'Subscribe on YouTube', cs: 'Odebírat na YouTube' })} <ArrowUpRight size={16} />
                    </a>
                    {next && (
                      <a
                        href={`https://www.youtube.com/watch?v=${next.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        {tr(lang, { en: 'Set a reminder', cs: 'Nastavit připomenutí' })} <ArrowUpRight size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {status.recent.length > 0 && (
        <section aria-labelledby="replays" className="py-14 sm:py-20">
          <div className="container-x">
            <h2 id="replays" className="h-section mb-8">
              {tr(lang, { en: 'Replays & highlights', cs: 'Záznamy a sestřihy' })}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {status.recent.map((v) => (
                <li key={v.id}>
                  <VideoCard video={v} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
