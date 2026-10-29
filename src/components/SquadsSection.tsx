import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';
import { SQUADS } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

export default function SquadsSection({ lang = 'en' }: { lang?: Lang }) {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="squads-heading">
      <div className="container-x">
        <SectionHeading
          id="squads-heading"
          eyebrow={tr(lang, { en: 'Our squads', cs: 'Naše týmy' })}
          title={tr(lang, {
            en: (
              <>
                Three squads.
                <br />
                <span className="text-gold">One club.</span>
              </>
            ),
            cs: (
              <>
                Tři týmy.
                <br />
                <span className="text-gold">Jeden klub.</span>
              </>
            ),
          })}
          intro={tr(lang, {
            en: 'Vanguards play Division 1, Mobilizers Division 2 and Strikers Division 3 of the Czech Cricket Union leagues.',
            cs: 'Vanguards hrají 1. divizi, Mobilizers 2. divizi a Strikers 3. divizi soutěží Českomoravského kriketového svazu.',
          })}
          action={
            <Link href={localePath(lang, '/players')} className="link-arrow">
              {tr(lang, { en: 'Meet the players', cs: 'Poznejte hráče' })} <ArrowRight size={18} />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {SQUADS.map((squad, i) => (
            <Reveal key={squad.name} delay={i * 90}>
              {/* Official squad logos always sit on solid black and are never altered (brand manual). */}
              <Link
                href={localePath(lang, `/squads/${squad.slug}`)}
                className="group flex h-full flex-col items-center border border-cream/12 bg-ink px-6 pb-8 pt-10 text-center transition-[transform,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-2 hover:border-gold"
              >
                <Image
                  src={squad.logo}
                  alt={tr(lang, { en: `${squad.name} squad logo`, cs: `Logo týmu ${squad.name}` })}
                  width={204}
                  height={240}
                  className="h-[180px] w-auto transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-rotate-3 group-hover:scale-105 sm:h-[240px]"
                />
                <h3 className="display mt-6 text-[34px] transition-colors duration-300 group-hover:text-gold sm:text-[40px]">
                  {squad.name}
                </h3>
                <span className="mt-2 font-display text-[15px] font-bold uppercase tracking-[0.14em] text-faint">
                  {tr(lang, { en: `Division ${squad.division}`, cs: `${squad.division}. divize` })}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 font-display text-[18px] font-extrabold uppercase tracking-[0.04em] text-muted transition-colors group-hover:text-gold">
                  {tr(lang, { en: 'View squad', cs: 'Zobrazit tým' })}
                  <ArrowRight size={16} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
