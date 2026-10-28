import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';
import { SQUADS } from '@/lib/club';

export default function SquadsSection() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="squads-heading">
      <div className="container-x">
        <SectionHeading
          id="squads-heading"
          eyebrow="Our squads"
          title={
            <>
              Three squads.
              <br />
              <span className="text-gold">One club.</span>
            </>
          }
          action={
            <Link href="/players" className="link-arrow">
              Meet the players <ArrowRight size={18} />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {SQUADS.map((squad, i) => (
            <Reveal key={squad.name} delay={i * 90}>
              {/* Official squad logos always sit on solid black and are never altered (brand manual). */}
              <Link
                href={`/squads/${squad.slug}`}
                className="group flex h-full flex-col items-center border border-cream/12 bg-ink px-6 pb-8 pt-10 text-center transition-[transform,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-2 hover:border-gold"
              >
                <Image src={squad.logo} alt={`${squad.name} squad logo`} width={204} height={240} className="h-[180px] w-auto sm:h-[240px]" />
                <span className="display mt-6 text-[34px] transition-colors duration-300 group-hover:text-gold sm:text-[40px]">
                  {squad.name}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 font-display text-[18px] font-extrabold uppercase tracking-[0.04em] text-muted transition-colors group-hover:text-gold">
                  View squad
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
