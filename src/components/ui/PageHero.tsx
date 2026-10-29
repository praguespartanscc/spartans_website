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
    <section className="relative isolate overflow-hidden border-b border-cream/12">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="kenburns -z-20 object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div className="absolute inset-0 -z-10 bg-ink/80" />
        </>
      )}
      <div className="container-x pb-14 pt-20 sm:pb-20 sm:pt-28">
        <p className="eyebrow rise mb-4" style={{ ['--d' as string]: '60ms' }}>
          {eyebrow}
        </p>
        <h1
          className={`display rise max-w-4xl ${compact ? 'text-[clamp(38px,5.5vw,72px)]' : 'text-[clamp(48px,9vw,112px)]'}`}
          style={{ ['--d' as string]: '140ms' }}
        >
          {title}
        </h1>
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
