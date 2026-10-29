'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from '@/components/ui/Icons';
import { FOUNDED } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

const SLIDE_MS = 6500;

const slides = [
  {
    src: '/spartan_team.PNG',
    alt: {
      en: 'Prague Spartans Cricket Club players in black and red kit',
      cs: 'Hráči kriketového klubu Prague Spartans v černo-červených dresech',
    },
    position: 'center 30%',
  },
  {
    src: '/home_carousel1.jpeg',
    alt: { en: 'Spartans players lined up on the outfield', cs: 'Hráči Spartans seřazení na hřišti' },
    position: 'center 35%',
  },
  {
    src: '/home_carousel.jpeg',
    alt: {
      en: 'Spartans celebrating with a trophy after an indoor tournament',
      cs: 'Hráči Spartans slaví s trofejí po halovém turnaji',
    },
    position: 'center 40%',
  },
];

const stats = [
  { value: String(FOUNDED), label: { en: 'Founded', cs: 'Rok založení' } },
  { value: '3', label: { en: 'Squads', cs: 'Týmy' } },
  { value: 'T10', label: { en: '2026 ČMKS winners', cs: 'Vítězové ČMKS 2026' } },
];

const HeroSection = ({ lang = 'en' }: { lang?: Lang }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  // Respect users who ask the OS for less motion: no auto-advance.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(query.matches);
  }, []);

  const goTo = useCallback((i: number) => setIndex(i), []);

  return (
    <>
    {/* On phones the header shows the name as text, so the full logo sits here on solid black (never over the photo). */}
    <div className="flex justify-center border-b border-cream/12 bg-ink py-6 lg:hidden">
      <Image src="/brand/spartans-logo.png" alt={tr(lang, { en: 'Prague Spartans Cricket Club logo', cs: 'Logo kriketového klubu Prague Spartans' })} width={99} height={120} priority className="h-[120px] w-auto" />
    </div>
    <section
      aria-label={tr(lang, { en: 'Welcome', cs: 'Úvod' })}
      className="relative isolate flex min-h-[78svh] items-end overflow-hidden lg:min-h-[calc(100svh-152px)]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-20 transition-opacity duration-[1400ms] ease-[var(--ease-out-quart)] ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            // Re-keyed when it becomes active so the slow zoom restarts each time.
            key={i === index ? `active-${index}` : 'idle'}
            src={slide.src}
            alt={slide.alt[lang]}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === index ? 'kenburns' : ''}`}
            style={{ objectPosition: slide.position }}
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
          <span className="rise block" style={{ ['--d' as string]: '180ms' }}>
            Prague
          </span>{' '}
          <span className="rise block text-gold" style={{ ['--d' as string]: '280ms' }}>
            Spartans
          </span>{' '}
          <span className="rise mt-2 block text-[0.3em] leading-none tracking-[0.04em]" style={{ ['--d' as string]: '320ms' }}>
            Cricket Club
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
                en: 'Prague Spartans Cricket Club is an amateur cricket club in Prague, Czech Republic, founded in 2019. Our three squads – Vanguards, Mobilizers and Strikers – play Divisions 1, 2 and 3 of the Czech Cricket Union leagues, plus ČMKS T10 and ECS Czechia, with home games at Vinoř Cricket Ground. Every level is welcome.',
                cs: 'Prague Spartans Cricket Club je amatérský kriketový klub v Praze, založený v roce 2019. Naše tři týmy – Vanguards, Mobilizers a Strikers – hrají 1., 2. a 3. divizi Českomoravského kriketového svazu a klub hraje také ČMKS T10 a ECS Czechia. Domácí zápasy hrajeme na kriketovém hřišti ve Vinoři. Vítáme hráče všech úrovní.',
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
                <dd className="font-varsity text-[30px] leading-none sm:text-[44px]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Slide controls double as progress bars */}
        <div className="mt-10 flex items-center gap-2" role="group" aria-label={tr(lang, { en: 'Choose photo', cs: 'Vyberte fotku' })}>
          {slides.map((slide, i) => (
            <button
              key={slide.src}
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
      </div>
    </section>
    </>
  );
};

export default HeroSection;
