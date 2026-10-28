'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from '@/components/ui/Icons';

const SLIDE_MS = 6500;

const slides = [
  { src: '/spartan_team.PNG', alt: 'The Prague Spartans squad in black and red kit', position: 'center 30%' },
  { src: '/home_carousel1.jpeg', alt: 'Spartans players lined up on the outfield', position: 'center 35%' },
  { src: '/home_carousel.jpeg', alt: 'Spartans celebrating with a trophy after an indoor tournament', position: 'center 40%' },
];

const stats = [
  { value: '2019', label: 'Founded' },
  { value: '3', label: 'Squads' },
  { value: 'Div 1–3', label: 'Leagues' },
];

const HeroSection = () => {
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
    <section
      aria-label="Welcome"
      className="relative isolate flex min-h-[calc(100svh-72px)] items-end overflow-hidden"
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
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === index ? 'kenburns' : ''}`}
            style={{ objectPosition: slide.position }}
          />
        </div>
      ))}
      {/* Readability scrim: darker at the bottom where the copy sits */}
      <div className="absolute inset-0 -z-10 bg-ink/45" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-ink via-ink/70 to-transparent" />

      <div className="container-x pb-12 pt-32 sm:pb-16">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '100ms' }}>
          Est. 2019 · Prague, Czech Republic
        </p>
        <h1 className="display text-[clamp(64px,14vw,196px)] font-bold leading-[0.84] tracking-[-0.01em]">
          <span className="rise block" style={{ ['--d' as string]: '180ms' }}>
            Prague
          </span>
          <span className="rise block text-gold" style={{ ['--d' as string]: '280ms' }}>
            Spartans
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div className="max-w-xl">
            <p className="rise text-lg leading-relaxed text-sand sm:text-[21px]" style={{ ['--d' as string]: '400ms' }}>
              Join us in bringing the spirit of cricket to the heart of Prague.
            </p>
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ ['--d' as string]: '500ms' }}>
              <Link href="/contact" className="btn btn-gold btn-lg">
                Join our club
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <Link href="/fixtures" className="btn btn-outline btn-lg">
                Upcoming matches
              </Link>
            </div>
          </div>

          <dl className="rise flex gap-8 font-display uppercase sm:gap-12" style={{ ['--d' as string]: '620ms' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[12px] tracking-[0.18em] text-muted">{stat.label}</dt>
                <dd className="text-[34px] font-semibold leading-none sm:text-[44px]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Slide controls double as progress bars */}
        <div className="mt-10 flex items-center gap-2" role="group" aria-label="Choose photo">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className="group flex h-11 w-14 items-center sm:w-20"
            >
              <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-cream/25">
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
            className="ml-3 text-[13px] font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-cream"
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
