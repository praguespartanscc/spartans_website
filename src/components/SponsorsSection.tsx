import Link from 'next/link';
import type { Sponsor } from '@/types/supabase';
import { CLUB_EMAIL } from '@/lib/club';
import Reveal from '@/components/ui/Reveal';
import SponsorLogo from '@/components/SponsorLogo';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';

const SponsorsSection = ({ sponsors }: { sponsors: Sponsor[] }) => {
  return (
    <section className="border-t border-cream/12 bg-ink-2 py-20 sm:py-24" aria-labelledby="sponsors-heading">
      <div className="container-x">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">Partners</p>
          <h2 id="sponsors-heading" className="h-section">
            Our sponsors
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">The businesses that keep the Spartans playing. Please support them.</p>
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
                <Reveal key={sponsor.id} delay={i * 60} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
                  <a
                    href={sponsor.website_url || '/sponsors'}
                    {...(sponsor.website_url ? { target: '_blank', rel: 'noopener noreferrer sponsored' } : {})}
                    className="card card-hover group flex h-full flex-col overflow-hidden text-center"
                  >
                    <SponsorLogo sponsor={sponsor} height={140} />
                    <span className="flex flex-1 flex-col items-center gap-2 p-5">
                      <span className="h-sub text-[24px] transition-colors group-hover:text-gold">{sponsor.name}</span>
                      {sponsor.description && <span className="text-[15px] leading-relaxed text-muted">{sponsor.description}</span>}
                      {sponsor.website_url && (
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-gold">
                          Visit website <ArrowUpRight size={14} />
                        </span>
                      )}
                    </span>
                  </a>
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
