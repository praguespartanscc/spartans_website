import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';

export const SQUADS = [
  { name: 'Vanguards', accent: 'bg-gold' },
  { name: 'Mobilizers', accent: 'bg-crimson' },
  { name: 'Strikers', accent: 'bg-cream' },
];

export default function SquadsSection() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="squads-heading">
      <div className="container-x">
        <SectionHeading
          id="squads-heading"
          eyebrow="Our squads"
          title={
            <>
              Three teams.
              <br />
              One club.
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
              <Link
                href={`/players?team=${squad.name}`}
                className="card card-hover group relative flex min-h-[220px] flex-col justify-between overflow-hidden p-7 sm:min-h-[260px]"
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${squad.accent}`} />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -top-8 font-display text-[150px] font-bold leading-none text-cream/[0.04] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-x-2"
                >
                  0{i + 1}
                </span>
                <span className="font-display text-[13px] uppercase tracking-[0.2em] text-faint">Squad 0{i + 1}</span>
                <div>
                  <span className="block font-display text-[44px] font-semibold uppercase leading-none sm:text-[52px]">
                    {squad.name}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-muted transition-colors group-hover:text-gold">
                    View squad
                    <ArrowRight size={16} className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
