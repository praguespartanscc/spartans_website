'use client';

import type { Photo } from '@/lib/drive';
import { photoCaption, photoSrcSet, photoUrl } from '@/lib/photos';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Play } from '@/components/ui/Icons';
import CountUp from '@/components/ui/CountUp';
import { FilmButton } from '@/components/FilmPlayer';
import { filmTime } from '@/lib/format';
import { FOUNDED, HERO_VIDEO, SEASON_FILM } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

const SLIDE_MS = 6500;

const MAX_SLIDES = 6;

type Slide = { id: string; alt: { en: string; cs: string } };

// Slides come from the Drive "Thumbnails" folder, in name order.
function toSlides(photos: Photo[]): Slide[] {
  return photos.slice(0, MAX_SLIDES).map((p) => {
    const caption = photoCaption(p.name);
    return {
      id: p.id,
      alt: caption
        ? { en: `${caption}, Prague Spartans Cricket Club`, cs: `${caption}, kriketový klub Prague Spartans` }
        : { en: 'Prague Spartans Cricket Club players', cs: 'Hráči kriketového klubu Prague Spartans' },
    };
  });
}

type Stat = { value: string; count?: { to: number; from: number }; label: { en: string; cs: string } };

// Numeric stats count up on load (from `from`); text stats stay as they are. The T10 stat
// shows the latest T10 title from the achievements list, so it never goes stale.
function statsFor(t10Year: number | null): Stat[] {
  return [
    { value: String(FOUNDED), count: { to: FOUNDED, from: FOUNDED - 30 }, label: { en: 'Founded', cs: 'Rok založení' } },
    { value: '3', count: { to: 3, from: 0 }, label: { en: 'Squads', cs: 'Týmy' } },
    ...(t10Year ? [{ value: 'T10', label: { en: `${t10Year} ČMKS winners`, cs: `Vítězové ČMKS ${t10Year}` } }] : []),
  ];
}

// pending: only the poster frame is up (what the server sends). video: the film loop plays over it.
// photos: the photo slideshow (no film set, reduced motion, data saving, or the film cannot play).
type Mode = 'pending' | 'video' | 'photos';

type Connection = { saveData?: boolean; effectiveType?: string };

// Progress bars for the film loop: one per shot, filling as it plays. A tap jumps to that shot.
function SceneBars({ video, lang }: { video: React.RefObject<HTMLVideoElement | null>; lang: Lang }) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const tick = () => setTime(v.currentTime);
    v.addEventListener('timeupdate', tick);
    return () => v.removeEventListener('timeupdate', tick);
  }, [video]);
  if (!HERO_VIDEO) return null;
  const { scenes, seconds } = HERO_VIDEO;
  return (
    <>
      {scenes.map((start, i) => {
        const end = scenes[i + 1] ?? seconds;
        const fill = Math.min(1, Math.max(0, (time - start) / (end - start)));
        return (
          <button
            key={start}
            type="button"
            onClick={() => {
              if (video.current) video.current.currentTime = start + 0.05;
            }}
            aria-label={tr(lang, { en: `Show scene ${i + 1} of ${scenes.length}`, cs: `Zobrazit scénu ${i + 1} z ${scenes.length}` })}
            aria-current={fill > 0 && fill < 1}
            className="flex h-11 min-w-8 max-w-56 flex-1 items-center"
          >
            <span className="relative h-[3px] w-full overflow-hidden bg-cream/25">
              <span className="absolute inset-0 origin-left bg-gold transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${fill})` }} />
            </span>
          </button>
        );
      })}
    </>
  );
}

const HeroSection = ({ lang = 'en', photos = [], t10Year = null }: { lang?: Lang; photos?: Photo[]; t10Year?: number | null }) => {
  const stats = statsFor(t10Year);
  const slides = useMemo(() => toSlides(photos), [photos]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<Mode>(HERO_VIDEO ? 'pending' : 'photos');
  const showPhotos = mode === 'photos';
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const userPaused = useRef(false);

  // The film loads only once the page itself is ready, and not at all for visitors who asked
  // for less motion or less data, or who are on a very slow connection. Phones get the small file.
  useEffect(() => {
    const film = HERO_VIDEO;
    if (!film) return;
    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) {
      setMode('photos');
      return;
    }
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => {
        setVideoSrc(window.matchMedia('(max-width: 767px)').matches ? film.small : film.wide);
        setMode('video');
      }, 500);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      window.clearTimeout(timer);
    };
  }, []);

  // Play, and rest while the hero is off screen or the tab is hidden (battery and data).
  useEffect(() => {
    const v = videoRef.current;
    const el = sectionRef.current;
    if (mode !== 'video' || !v || !el) return;
    let inView = true;
    const sync = () => {
      if (inView && !document.hidden && !userPaused.current) {
        // A browser that refuses to autoplay (low power mode) gets the photos instead.
        v.play().catch((e: unknown) => (e as { name?: string })?.name === 'NotAllowedError' && setMode('photos'));
      } else v.pause();
    };
    v.muted = true;
    sync();
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [mode, videoSrc]);

  const toggleFilm = () => {
    const v = videoRef.current;
    if (!v) return;
    userPaused.current = !userPaused.current;
    setPaused(userPaused.current);
    if (userPaused.current) v.pause();
    else v.play().catch(() => {});
  };
  // How many times each slide has been shown: re-keys its image so the slow zoom restarts,
  // while the outgoing slide keeps its zoom running as it fades out (no jump mid-crossfade).
  const [shown, setShown] = useState<number[]>(() => slides.map(() => 0));
  const firstSlide = useRef(true);
  // Only the photo on screen, the one fading out and the next one are in the page, so a phone
  // downloads one or two photos on load instead of all six.
  const [mounted, setMounted] = useState<number[]>([0]);
  const lastIndex = useRef(0);
  useEffect(() => {
    const n = slides.length;
    if (n < 2 || !showPhotos) return;
    const next = (index + 1) % n;
    if (lastIndex.current === index) {
      // First render: fetch the second photo once the first has had a head start.
      const t = window.setTimeout(() => setMounted([index, next]), 2500);
      return () => window.clearTimeout(t);
    }
    const prev = lastIndex.current;
    lastIndex.current = index;
    setMounted([prev, index, next]);
    // The crossfade takes 1.4s, then the old photo can go.
    const t = window.setTimeout(() => setMounted([index, next]), 1600);
    return () => window.clearTimeout(t);
  }, [index, slides.length, showPhotos]);

  useEffect(() => {
    if (firstSlide.current) {
      firstSlide.current = false;
      return;
    }
    setShown((s) => s.map((n, i) => (i === index ? n + 1 : n)));
  }, [index]);

  useEffect(() => {
    if (paused || slides.length < 2 || !showPhotos) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length, showPhotos]);

  // Respect users who ask the OS for less motion: no auto-advance.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.matches) setPaused(true);
  }, []);

  const goTo = useCallback((i: number) => setIndex(i), []);

  return (
    <>
    {/* The crest sits in the header bar on solid black (never over the photo), so the film starts at once. */}
    <section
      ref={sectionRef}
      aria-label={tr(lang, { en: 'Welcome', cs: 'Úvod' })}
      className="film relative isolate flex min-h-[calc(100svh-64px)] items-end overflow-clip [--film-z:-5] lg:min-h-[calc(100svh-152px)]"
    >
      {/* The wrapper drifts with the scroll while what is inside plays or zooms. */}
      <div className="parallax absolute inset-0 -z-20">
        {HERO_VIDEO && (
          // The film's first frame: what everyone sees first, and all some visitors need.
          // eslint-disable-next-line @next/next/no-img-element -- a small local file, shown as it is
          <img
            src={HERO_VIDEO.poster}
            alt={tr(lang, { en: 'Prague Spartans Cricket Club players on the field', cs: 'Hráči kriketového klubu Prague Spartans na hřišti' })}
            fetchPriority="high"
            decoding="async"
            className="kenburns film-grade-rich absolute inset-0 h-full w-full object-cover"
          />
        )}
        {mode === 'video' && videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setMode('photos')}
            className={`film-grade-rich absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out-quart ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      {showPhotos && slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[var(--ease-out-quart)] ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {mounted.includes(i) && (
          /* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */
          <img
            key={`${slide.id}-${shown[i]}`}
            src={photoUrl(slide.id, 1920)}
            srcSet={photoSrcSet(slide.id, [800, 1200, 1600, 1920, 2560])}
            sizes="100vw"
            alt={slide.alt[lang]}
            fetchPriority={i === 0 && !HERO_VIDEO ? 'high' : 'auto'}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="kenburns film-grade absolute inset-0 h-full w-full object-cover object-[center_35%]"
          />
          )}
        </div>
      ))}
      </div>
      {/* Brand rule: text over photos needs ~80% black behind it. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/40 via-ink/80 to-ink lg:hidden" />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-ink/90 via-ink/80 to-ink/30 lg:block" />
      <div className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-gradient-to-t from-ink to-transparent lg:block" />
      {/* Opening: the photo starts in a wide cinema frame and the bars slide away. */}
      <div aria-hidden="true" className="letterbox-bar top -z-[4]" />
      <div aria-hidden="true" className="letterbox-bar bottom -z-[4]" />

      {/* Like a recording light: says the moving picture is the club's own film. */}
      {mode === 'video' && videoReady && (
        <p className="page-enter container-x absolute inset-x-0 top-5 flex items-center gap-2.5 font-display text-[13px] font-extrabold uppercase italic tracking-[0.22em] text-cream lg:top-8 lg:justify-end">
          <span className={`h-2 w-2 rounded-full bg-crimson-hi ${paused ? '' : 'live-dot'}`} aria-hidden="true" />
          {tr(lang, { en: `${SEASON_FILM.season} season film`, cs: `Film o sezóně ${SEASON_FILM.season}` })}
        </p>
      )}

      <div className="container-x w-full pb-8 pt-24 sm:pb-12 lg:pt-32">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '100ms' }}>
          {tr(lang, { en: `Est. ${FOUNDED} · Prague, Czech Republic`, cs: `Od roku ${FOUNDED} · Praha, Česká republika` })}
        </p>
        {/* Reads "Prague Spartans Cricket Club Prague, Czech Republic": the spaces between spans are real text. */}
        <h1 className="display text-[clamp(56px,11.6vw,168px)] leading-[0.92]">
          <span className="mask-line">
            <span style={{ ['--d' as string]: '150ms' }}>Prague</span>
          </span>{' '}
          <span className="mask-line text-gold">
            <span style={{ ['--d' as string]: '260ms' }}>Spartans</span>
          </span>{' '}
          <span className="mask-line mt-2 text-[0.3em] leading-none tracking-[0.04em]">
            <span style={{ ['--d' as string]: '380ms' }}>Cricket Club</span>
          </span>{' '}
          <span
            className="rise mt-3 block font-display text-[clamp(18px,2.2vw,26px)] font-extrabold uppercase leading-tight tracking-[0.14em] text-sand"
            style={{ ['--d' as string]: '340ms' }}
          >
            {tr(lang, { en: 'Prague, Czech Republic', cs: 'Kriketový klub v Praze' })}
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div className="max-w-xl">
            <p className="rise h-sub text-[clamp(26px,3.4vw,46px)]" style={{ ['--d' as string]: '380ms' }}>
              {tr(lang, { en: 'Spartan discipline, Prague heart.', cs: 'Spartánská disciplína, pražské srdce.' })}
            </p>
            <div className="rise mt-7 flex flex-col gap-x-7 gap-y-4 sm:flex-row sm:items-center" style={{ ['--d' as string]: '460ms' }}>
              <Link href={localePath(lang, '/join')} className="btn btn-gold btn-lg">
                {tr(lang, { en: 'Join the Spartan family', cs: 'Přidejte se ke Spartans' })}
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <FilmButton lang={lang} className="group flex min-h-14 items-center gap-3.5 text-left font-display text-[18px] font-extrabold uppercase italic tracking-[0.06em] text-cream">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-gold text-gold transition-colors duration-200 group-hover:bg-gold group-hover:text-ink group-active:bg-gold group-active:text-ink">
                  <Play size={22} className="ml-0.5" />
                </span>
                <span>
                  {tr(lang, { en: 'Watch the film', cs: 'Přehrát film' })} <span className="text-muted">· {filmTime(SEASON_FILM.seconds)}</span>
                </span>
              </FilmButton>
            </div>
          </div>

          <dl className="rise flex uppercase" style={{ ['--d' as string]: '620ms' }}>
            {stats.map((stat, i) => (
              <div key={stat.value} className={`flex flex-col-reverse border-cream/15 ${i ? 'border-l pl-6 sm:pl-8' : ''} ${i < stats.length - 1 ? 'pr-6 sm:pr-8' : ''}`}>
                <dt className="mt-2 font-display text-[13px] font-extrabold tracking-[0.2em] text-muted">{stat.label[lang]}</dt>
                <dd className="font-varsity text-[30px] leading-none sm:text-[44px]">
                  {stat.count ? <CountUp to={stat.count.to} from={stat.count.from} delay={700 + i * 120} /> : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Film: one bar per shot. Photos: one bar per photo. Either way with Pause and Play. */}
        {mode === 'video' && videoReady ? (
          <div className="mt-8 flex items-center gap-2" role="group" aria-label={tr(lang, { en: 'Film scenes', cs: 'Scény filmu' })}>
            <SceneBars video={videoRef} lang={lang} />
            <button
              type="button"
              onClick={toggleFilm}
              className="ml-3 min-h-11 font-display text-[15px] font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-cream"
            >
              {paused ? tr(lang, { en: 'Play', cs: 'Přehrát' }) : tr(lang, { en: 'Pause', cs: 'Pozastavit' })}
            </button>
          </div>
        ) : showPhotos && slides.length > 1 ? (
        <div className="mt-8 flex items-center gap-2" role="group" aria-label={tr(lang, { en: 'Choose photo', cs: 'Vyberte fotku' })}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={tr(lang, { en: `Show photo ${i + 1} of ${slides.length}`, cs: `Zobrazit fotku ${i + 1} z ${slides.length}` })}
              aria-current={i === index}
              className="group flex h-11 w-14 items-center sm:w-20"
            >
              <span className="relative h-[3px] w-full overflow-hidden bg-cream/25">
                {i === index && (
                  <span
                    key={`progress-${index}-${paused}`}
                    className={`absolute inset-0 bg-gold ${paused ? '' : 'slide-progress'}`}
                    style={{ ['--dur' as string]: `${SLIDE_MS}ms` }}
                  />
                )}
                {i < index && <span className="absolute inset-0 bg-cream/70" />}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="ml-3 font-display text-[15px] font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-cream"
          >
            {paused ? tr(lang, { en: 'Play', cs: 'Přehrát' }) : tr(lang, { en: 'Pause', cs: 'Pozastavit' })}
          </button>
        </div>
        ) : (
          // Keeps the height steady while the film or the photos get ready.
          <div className="mt-8 h-11" aria-hidden="true" />
        )}
      </div>
    </section>
    </>
  );
};

export default HeroSection;
