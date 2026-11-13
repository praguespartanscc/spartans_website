import type { ReactNode } from 'react';
import type { Photo } from '@/lib/drive';
import SitePhoto from '@/components/ui/SitePhoto';
import Reveal from '@/components/ui/Reveal';
import { tr, type Lang } from '@/lib/i18n';

type QuoteBandProps = {
  lang?: Lang;
  photo?: Photo | null;
  // Defaults to the club motto. Pass all three for another scene.
  label?: string;
  eyebrow?: string;
  lines?: [ReactNode, ReactNode];
};

// A full-bleed "scene": a brand line over a wide photo with the film look (grain, vignette,
// scroll drift). The black behind the text stays at 80% (brand manual rule) and eases off
// towards the top and bottom so more of the photo shows.
export default function QuoteBand({ lang = 'en', photo = null, label, eyebrow, lines }: QuoteBandProps) {
  const [first, second] = lines ?? [
    tr(lang, { en: 'Stand together.', cs: 'Držíme spolu.' }),
    tr(lang, { en: 'Strike harder.', cs: 'Hrajeme naplno.' }),
  ];
  return (
    <section
      aria-label={label ?? tr(lang, { en: 'Club motto', cs: 'Klubové motto' })}
      className="film relative isolate flex min-h-[420px] items-center overflow-clip [--film-z:-5] sm:min-h-[520px] lg:aspect-[21/9] lg:min-h-0"
    >
      <div className="parallax absolute inset-0 -z-20">
        <SitePhoto photo={photo} sizes="100vw" decorative className="object-[center_35%] grayscale" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 via-ink/80 to-ink/60" />
      <Reveal className="container-x flex w-full flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow">{eyebrow ?? tr(lang, { en: 'Matchday', cs: 'Den zápasu' })}</p>
        <p className="display mt-5 text-[clamp(40px,7.5vw,104px)]">
          <span className="mask-rise">
            <span>{first}</span>
          </span>
          <span className="mask-rise text-gold">
            <span style={{ transitionDelay: '200ms' }}>{second}</span>
          </span>
        </p>
      </Reveal>
    </section>
  );
}
