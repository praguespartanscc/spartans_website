import Image from 'next/image';
import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
  imagePosition?: string;
  children?: ReactNode;
  // Smaller type for long headings.
  compact?: boolean;
};

// Shared top-of-page banner for every inner page, so each one opens the same way.
export default function PageHero({ eyebrow, title, intro, image, imagePosition = 'center 35%', children, compact }: PageHeroProps) {
  return (
    <section
      className={`relative isolate overflow-clip border-b border-cream/12 ${image ? 'film [--film-z:-5] lg:flex lg:min-h-[46svh] lg:items-end' : ''}`}
    >
      {image && (
        <>
          {/* The wrapper drifts with the scroll while the photo inside runs its slow zoom. */}
          <div className="parallax absolute inset-0 -z-20">
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="kenburns film-grade object-cover"
              style={{ objectPosition: imagePosition }}
            />
          </div>
          {/* Brand rule: text over photos needs ~80% black behind it. Desktop keeps that behind
              the copy on the left and lets more of the photo show on the right. */}
          <div className="absolute inset-0 -z-10 bg-ink/80 lg:hidden" />
          <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-ink/90 via-ink/80 via-65% to-ink/50 lg:block" />
        </>
      )}
      <div className="container-x w-full pb-14 pt-20 sm:pb-20 sm:pt-28">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '60ms' }}>
          {eyebrow}
        </p>
        <h1 className={`display max-w-4xl ${compact ? 'text-[clamp(38px,5.5vw,72px)]' : 'text-[clamp(48px,9vw,112px)]'}`}>
          <span className="mask-line">
            <span style={{ ['--d' as string]: '120ms' }}>{title}</span>
          </span>
        </h1>
        <span aria-hidden="true" className="heading-rule draw mt-6" style={{ ['--d' as string]: '420ms' }} />
        {intro && (
          <p
            className="rise mt-6 max-w-2xl text-lg leading-relaxed text-sand sm:text-xl"
            style={{ ['--d' as string]: '240ms' }}
          >
            {intro}
          </p>
        )}
        {children && (
          <div className="rise mt-8" style={{ ['--d' as string]: '320ms' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
