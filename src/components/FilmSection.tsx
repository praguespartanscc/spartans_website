import Image from 'next/image';
import { FilmButton } from '@/components/FilmPlayer';
import { filmTime } from '@/lib/format';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { Play } from '@/components/ui/Icons';
import { SEASON_FILM } from '@/lib/club';
import { tr, type Lang } from '@/lib/i18n';

// The season film on the home page: a large poster that opens the player, and its chapters.
export default function FilmSection({ lang = 'en' }: { lang?: Lang }) {
  const minutes = Math.round(SEASON_FILM.seconds / 60);
  return (
    <section className="border-t border-cream/12 py-16 sm:py-24" aria-labelledby="film-title">
      <div className="container-x">
        <SectionHeading
          id="film-title"
          eyebrow={tr(lang, { en: 'On film', cs: 'Na filmu' })}
          title={tr(lang, { en: `The ${SEASON_FILM.season} season`, cs: `Sezóna ${SEASON_FILM.season}` })}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-12">
          <Reveal className="wipe">
            <FilmButton
              lang={lang}
              label={tr(lang, { en: `Play the ${SEASON_FILM.season} season film, ${minutes} minutes`, cs: `Přehrát film o sezóně ${SEASON_FILM.season}, ${minutes} minuty` })}
              className="film group relative block aspect-[908/512] w-full overflow-hidden text-left"
            >
              <Image src={SEASON_FILM.poster} alt="" fill sizes="(min-width: 1024px) 65vw, 100vw" className="film-grade object-cover" />
              <span className="absolute inset-0 bg-ink/45 transition-opacity duration-300 group-hover:opacity-70" />
              <span className="absolute inset-0 z-[2] grid place-items-center">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-gold text-ink transition-transform duration-300 ease-out-expo group-hover:scale-110 group-active:scale-95 sm:h-24 sm:w-24">
                  <Play size={34} className="ml-1" />
                </span>
              </span>
              <span className="display absolute bottom-5 left-5 z-[2] text-[clamp(26px,3.4vw,44px)] sm:bottom-7 sm:left-8">{tr(lang, { en: 'Champions', cs: 'Šampioni' })}</span>
              <span className="eyebrow absolute bottom-6 right-5 z-[2] text-cream sm:bottom-9 sm:right-8">
                {minutes} {tr(lang, { en: 'minutes', cs: 'minuty' })}
              </span>
            </FilmButton>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-lg leading-relaxed text-sand">
              {tr(lang, {
                en: `The ${SEASON_FILM.season} season in three minutes: the huddles, the trophies and the people behind them.`,
                cs: `Sezóna ${SEASON_FILM.season} ve třech minutách: společné pokřiky, trofeje a lidé, kteří za nimi stojí.`,
              })}
            </p>
            <ul className="mt-6 border-t border-cream/12">
              {SEASON_FILM.chapters.map((c) => (
                <li key={c.at} className="border-b border-cream/12">
                  <FilmButton lang={lang} at={c.at} className="group flex min-h-14 w-full items-center gap-4 py-3 text-left">
                    <span className="eyebrow w-12 shrink-0">{filmTime(c.at)}</span>
                    <span className="h-sub text-[22px] leading-tight transition-colors group-hover:text-gold">{c[lang]}</span>
                  </FilmButton>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
