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
    <>
    {/* On phones the header shows the name as text, so the full logo sits here on solid black (never over the photo). */}
    <div className="flex justify-center border-b border-cream/12 bg-ink py-6 lg:hidden">
      <Image src="/brand/spartans-logo.png" alt="Prague Spartans Cricket Club logo" width={99} height={120} priority className="h-[120px] w-auto" />
    </div>
    <section
      aria-label="Welcome"
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
            alt={slide.alt}
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
          Est. 2019 · Prague, Czech Republic
        </p>
        <h1 className="display text-[clamp(56px,11vw,160px)] leading-[0.92]">
          <span className="rise block" style={{ ['--d' as string]: '180ms' }}>
            Prague
          </span>
          <span className="rise block text-gold" style={{ ['--d' as string]: '280ms' }}>
            Spartans
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div className="max-w-xl">
            <p className="rise h-sub text-[clamp(26px,3.4vw,46px)]" style={{ ['--d' as string]: '380ms' }}>
              Spartan discipline, Prague heart.
            </p>
            <p className="rise mt-4 text-lg leading-relaxed text-sand" style={{ ['--d' as string]: '440ms' }}>
              Competing fearlessly while growing cricket in Prague. Three squads, one club, every level welcome.
            </p>
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ ['--d' as string]: '500ms' }}>
              <Link href="/contact" className="btn btn-gold btn-lg">
                Join the Spartan family
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <Link href="/fixtures" className="btn btn-outline btn-lg">
                Upcoming matches
              </Link>
            </div>
          </div>

          <dl className="rise flex uppercase" style={{ ['--d' as string]: '620ms' }}>
            {stats.map((stat, i) => (
              <div key={stat.label} className={`flex flex-col-reverse border-cream/15 ${i ? 'border-l pl-6 sm:pl-8' : ''} ${i < stats.length - 1 ? 'pr-6 sm:pr-8' : ''}`}>
                <dt className="mt-2 font-display text-[13px] font-extrabold tracking-[0.2em] text-muted">{stat.label}</dt>
                <dd className="font-varsity text-[30px] leading-none sm:text-[44px]">{stat.value}</dd>
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
            {paused ? 'Play' : 'Pause'}
          </button>
        </div>
      </div>
    </section>
    </>
  );
};

export default HeroSection;
