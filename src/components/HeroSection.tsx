'use client';

import type { Photo } from '@/lib/drive';
import { photoCaption, photoSrcSet, photoUrl } from '@/lib/photos';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from '@/components/ui/Icons';
import CountUp from '@/components/ui/CountUp';
import { FOUNDED } from '@/lib/club';
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

const HeroSection = ({ lang = 'en', photos = [], t10Year = null }: { lang?: Lang; photos?: Photo[]; t10Year?: number | null }) => {
  const stats = statsFor(t10Year);
  const slides = useMemo(() => toSlides(photos), [photos]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // How many times each slide has been shown: re-keys its image so the slow zoom restarts,
  // while the outgoing slide keeps its zoom running as it fades out (no jump mid-crossfade).
  const [shown, setShown] = useState<number[]>(() => slides.map(() => 0));
  const firstSlide = useRef(true);

  useEffect(() => {
    if (firstSlide.current) {
      firstSlide.current = false;
      return;
    }
    setShown((s) => s.map((n, i) => (i === index ? n + 1 : n)));
  }, [index]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length]);

  // Respect users who ask the OS for less motion: no auto-advance.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(query.matches);
  }, []);

  const goTo = useCallback((i: number) => setIndex(i), []);

  return (
    <>
    {/* The crest sits in the header bar on solid black (never over the photo), so the photo starts at once. */}
    <section
      aria-label={tr(lang, { en: 'Welcome', cs: 'Úvod' })}
      className="relative isolate flex min-h-[78svh] items-end overflow-hidden lg:min-h-[calc(100svh-152px)]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-20 transition-opacity duration-[1400ms] ease-[var(--ease-out-quart)] ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- resized by Google's image CDN */}
          <img
            key={`${slide.id}-${shown[i]}`}
            src={photoUrl(slide.id, 1920)}
            srcSet={photoSrcSet(slide.id, [800, 1200, 1600, 1920, 2560])}
            sizes="100vw"
            alt={slide.alt[lang]}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="kenburns absolute inset-0 h-full w-full object-cover object-[center_35%]"
          />
        </div>
      ))}
      {/* Brand rule: text over photos needs ~80% black behind it. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/40 via-ink/80 to-ink lg:hidden" />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-ink/90 via-ink/80 to-ink/30 lg:block" />
      <div className="absolute inset-x-0 bottom-0 -z-10 hidden h-1/3 bg-gradient-to-t from-ink to-transparent lg:block" />

      <div className="container-x pb-12 pt-32 sm:pb-16">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '100ms' }}>
          {tr(lang, { en: `Est. ${FOUNDED} · Prague, Czech Republic`, cs: `Od roku ${FOUNDED} · Praha, Česká republika` })}
        </p>
        {/* Reads "Prague Spartans Cricket Club Prague, Czech Republic": the spaces between spans are real text. */}
        <h1 className="display text-[clamp(56px,11vw,160px)] leading-[0.92]">
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
            <p className="rise mt-4 text-lg leading-relaxed text-sand" style={{ ['--d' as string]: '440ms' }}>
              {tr(lang, {
                en: 'Prague Spartans Cricket Club is an amateur cricket club in Prague, Czech Republic, founded in 2019. Our three squads (Vanguards, Mobilizers and Strikers) play Divisions 1, 2 and 3 of the Czech Cricket Union leagues, plus ČMKS T10 and ECS Czechia, with home games at Vinoř Cricket Ground. Every level is welcome.',
                cs: 'Prague Spartans Cricket Club je amatérský kriketový klub v Praze, založený v roce 2019. Naše tři týmy (Vanguards, Mobilizers a Strikers) hrají 1., 2. a 3. divizi Českomoravského kriketového svazu a klub hraje také ČMKS T10 a ECS Czechia. Domácí zápasy hrajeme na kriketovém hřišti ve Vinoři. Vítáme hráče všech úrovní.',
              })}
            </p>
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ ['--d' as string]: '500ms' }}>
              <Link href={localePath(lang, '/join')} className="btn btn-gold btn-lg">
                {tr(lang, { en: 'Join the Spartan family', cs: 'Přidejte se ke Spartans' })}
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <Link href={localePath(lang, '/fixtures')} className="btn btn-outline btn-lg">
                {tr(lang, { en: 'Upcoming matches', cs: 'Nadcházející zápasy' })}
              </Link>
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

        {/* Slide controls double as progress bars */}
        {slides.length > 1 && (
        <div className="mt-10 flex items-center gap-2" role="group" aria-label={tr(lang, { en: 'Choose photo', cs: 'Vyberte fotku' })}>
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
        )}
      </div>
    </section>
    </>
  );
};

export default HeroSection;
