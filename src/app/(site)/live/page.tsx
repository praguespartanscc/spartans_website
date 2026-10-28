import type { Metadata } from 'next';
import Image from 'next/image';
import { getLiveStatus, type Video } from '@/lib/youtube';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import { ArrowUpRight } from '@/components/ui/Icons';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Live · Spartans TV',
  description: 'Watch Prague Spartans Cricket Club matches live on YouTube, plus replays and highlights.',
  alternates: { canonical: '/live' },
  openGraph: { url: '/live', title: 'Spartans TV · Live cricket from Prague' },
};

const when = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Prague',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '';

function VideoCard({ video }: { video: Video }) {
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
          {new Date(video.published).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </span>
    </a>
  );
}

export default async function LivePage() {
  const status = await getLiveStatus();
  const next = status.upcoming[0];

  return (
    <>
      <section className="border-b border-cream/12">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow rise">Spartans TV</p>
          <h1 className="display rise mt-3 text-[clamp(48px,8vw,104px)]" style={{ ['--d' as string]: '80ms' }}>
            {status.live ? (
              <>
                Live <span className="text-gold">now</span>
              </>
            ) : (
              <>
                Watch <span className="text-gold">live</span>
              </>
            )}
          </h1>

          <div className="rise mt-10" style={{ ['--d' as string]: '160ms' }}>
            {status.live ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="chip bg-crimson text-white">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> Live
                  </span>
                  <h2 className="h-sub text-[clamp(22px,2.6vw,32px)]">{status.live.title}</h2>
                </div>
                <YouTubeEmbed id={status.live.id} title={status.live.title} autoplay />
                <a
                  href={`https://www.youtube.com/watch?v=${status.live.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold mt-6"
                >
                  Watch on YouTube <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <div className="card flex flex-col gap-4 p-8 sm:p-12">
                <p className="h-sub text-[clamp(26px,3vw,40px)]">Nothing live at the moment</p>
                {next ? (
                  <p className="text-lg text-sand">
                    Next stream: <span className="font-semibold text-cream">{next.title}</span>
                    {next.scheduledStart && <> · {when(next.scheduledStart)}</>}
                  </p>
                ) : (
                  <p className="text-lg text-muted">
                    Matches are streamed here when they&apos;re on. Check the fixtures for the next game.
                  </p>
                )}
                {status.channelUrl && (
                  <div className="flex flex-wrap gap-3">
                    <a href={`${status.channelUrl}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                      Subscribe on YouTube <ArrowUpRight size={16} />
                    </a>
                    {next && (
                      <a
                        href={`https://www.youtube.com/watch?v=${next.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        Set a reminder <ArrowUpRight size={16} />
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
              Replays &amp; highlights
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {status.recent.map((v) => (
                <li key={v.id}>
                  <VideoCard video={v} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
