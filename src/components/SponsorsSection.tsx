import Link from 'next/link';
import type { Sponsor } from '@/types/supabase';
import { CLUB_EMAIL } from '@/lib/club';
import Reveal from '@/components/ui/Reveal';
import SponsorLogo from '@/components/SponsorLogo';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { sponsorText } from '@/lib/sponsors';

const SponsorsSection = ({ sponsors, lang = 'en' }: { sponsors: Sponsor[]; lang?: Lang }) => {
  return (
    <section className="border-t border-cream/12 bg-ink-2 py-20 sm:py-24" aria-labelledby="sponsors-heading">
      <div className="container-x">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">{tr(lang, { en: 'Partners', cs: 'Partneři' })}</p>
          <h2 id="sponsors-heading" className="h-section">
            {tr(lang, { en: 'Our sponsors', cs: 'Naši sponzoři' })}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            {tr(lang, {
              en: 'The businesses that keep the Spartans playing. Please support them.',
              cs: 'Firmy, díky kterým mohou Spartans hrát. Podpořte je prosím.',
            })}
          </p>
        </Reveal>

        {sponsors.length === 0 ? (
          <Reveal className="text-center">
            <a
              href={`mailto:${CLUB_EMAIL}?subject=${encodeURIComponent(tr(lang, { en: 'Sponsoring Prague Spartans', cs: 'Sponzorství Prague Spartans' }))}`}
              className="link-arrow"
            >
              {tr(lang, { en: 'Become a club sponsor', cs: 'Staňte se sponzorem klubu' })} <ArrowRight size={18} />
            </a>
          </Reveal>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-4">
              {sponsors.slice(0, 8).map((sponsor, i) => (
                <Reveal key={sponsor.id} delay={i * 60} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
                  <a
                    href={sponsor.website_url || localePath(lang, '/sponsors')}
                    {...(sponsor.website_url ? { target: '_blank', rel: 'noopener noreferrer sponsored' } : {})}
                    className="card card-hover group flex h-full flex-col overflow-hidden text-center"
                  >
                    <SponsorLogo sponsor={sponsor} height={140} />
                    <span className="flex flex-1 flex-col items-center gap-2 p-5">
                      <span className="h-sub text-[24px] transition-colors group-hover:text-gold">{sponsor.name}</span>
                      {sponsorText(sponsor, lang) && <span className="text-[15px] leading-relaxed text-muted">{sponsorText(sponsor, lang)}</span>}
                      {sponsor.website_url && (
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-display text-[15px] font-extrabold uppercase tracking-[0.04em] text-gold">
                          {tr(lang, { en: 'Visit website', cs: 'Navštívit web' })} <ArrowUpRight size={14} />
                        </span>
                      )}
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-10 text-center">
              <Link href={localePath(lang, '/sponsors')} className="link-arrow">
                {tr(lang, { en: 'All sponsors & partners', cs: 'Všichni sponzoři a partneři' })} <ArrowRight size={18} />
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
};

export default SponsorsSection;
