import Link from 'next/link';
import type { Sponsor } from '@/types/supabase';
import { CLUB_EMAIL } from '@/lib/club';
import Reveal from '@/components/ui/Reveal';
import SponsorLogo from '@/components/SponsorLogo';
import { ArrowRight } from '@/components/ui/Icons';

const SponsorsSection = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return (
    <section className="border-t border-cream/12 bg-ink-2 py-20 sm:py-24" aria-labelledby="sponsors-heading">
      <div className="container-x">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">Partners</p>
          <h2 id="sponsors-heading" className="h-section">
            Our sponsors
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">The partners who keep the Spartans playing.</p>
        </Reveal>

        {sponsors.length === 0 ? (
          <Reveal className="text-center">
            <a href={`mailto:${CLUB_EMAIL}?subject=Sponsoring%20Prague%20Spartans`} className="link-arrow">
              Become a club sponsor <ArrowRight size={18} />
            </a>
          </Reveal>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-4">
              {sponsors.slice(0, 8).map((sponsor, i) => (
                <Reveal key={sponsor.id} delay={i * 60} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
                  <Link href="/sponsors" className="card card-hover group flex h-full flex-col items-center gap-4 overflow-hidden pb-5 text-center">
                    <SponsorLogo sponsor={sponsor} />
                    <span className="font-semibold">{sponsor.name}</span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-10 text-center">
              <Link href="/sponsors" className="link-arrow">
                All sponsors & partners <ArrowRight size={18} />
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
};

export default SponsorsSection;
