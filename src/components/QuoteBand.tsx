import type { Photo } from '@/lib/drive';
import SitePhoto from '@/components/ui/SitePhoto';
import Reveal from '@/components/ui/Reveal';
import { tr, type Lang } from '@/lib/i18n';

// Full-bleed brand line over a photo held back by an 80% black overlay (brand manual rule).
export default function QuoteBand({ lang = 'en', photo = null }: { lang?: Lang; photo?: Photo | null }) {
  return (
    <section aria-label={tr(lang, { en: 'Club motto', cs: 'Klubové motto' })} className="relative isolate overflow-hidden">
      <SitePhoto photo={photo} sizes="100vw" decorative className="-z-20 object-[center_35%] grayscale" />
      <div className="absolute inset-0 -z-10 bg-ink/80" />
      <Reveal className="container-x flex min-h-[380px] flex-col items-center justify-center py-20 text-center sm:min-h-[520px]">
        <p className="eyebrow">{tr(lang, { en: 'Matchday', cs: 'Den zápasu' })}</p>
        <p className="display mt-5 text-[clamp(40px,7.5vw,104px)]">
          {tr(lang, { en: 'Stand together.', cs: 'Držíme spolu.' })}
          <br />
          <span className="text-gold">{tr(lang, { en: 'Strike harder.', cs: 'Hrajeme naplno.' })}</span>
        </p>
      </Reveal>
    </section>
  );
}
