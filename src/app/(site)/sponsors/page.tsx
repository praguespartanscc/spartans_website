import type { Metadata } from 'next';
import { getSponsors } from '@/lib/data';
import { CLUB_EMAIL } from '@/lib/club';
import type { Sponsor } from '@/types/supabase';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import SponsorLogo from '@/components/SponsorLogo';
import { ArrowUpRight, Mail } from '@/components/ui/Icons';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Sponsors & Partners',
  description:
    'The sponsors and partners behind Prague Spartans Cricket Club, and how your business can support cricket in Prague.',
  alternates: { canonical: '/sponsors' },
  openGraph: { url: '/sponsors', title: 'Prague Spartans sponsors & partners' },
};

const TIERS = [
  { key: 'principal', label: 'Principal partner' },
  { key: 'gold', label: 'Gold sponsors' },
  { key: 'partner', label: 'Club partners' },
];

function SponsorCard({ sponsor, large }: { sponsor: Sponsor; large?: boolean }) {
  const body = (
    <>
      <SponsorLogo sponsor={sponsor} height={large ? 160 : 112} />
      <div className="p-6">
        <h3 className="h-sub text-[26px] transition-colors group-hover:text-gold">{sponsor.name}</h3>
        {sponsor.description && <p className="mt-2 leading-relaxed text-muted">{sponsor.description}</p>}
        {sponsor.website_url && (
          <span className="mt-4 inline-flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.04em] text-gold">
            Visit website <ArrowUpRight size={15} />
          </span>
        )}
      </div>
    </>
  );
  const cls = 'card card-hover group flex h-full flex-col overflow-hidden';
  return sponsor.website_url ? (
    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer sponsored" className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <>
      <PageHero
        eyebrow="Partners"
        title={
          <>
            Our <span className="text-gold">sponsors</span>
          </>
        }
        intro="The businesses that keep the Spartans playing. Thank you for backing cricket in Prague."
      />

      <section className="py-14 sm:py-20">
        <div className="container-x">
          {sponsors.length === 0 && <p className="text-lg text-muted">Our sponsor line-up for the new season is coming soon.</p>}
          {TIERS.map((tier) => {
            const list = sponsors.filter((s) => (s.tier ?? 'partner') === tier.key);
            if (list.length === 0) return null;
            const large = tier.key === 'principal';
            return (
              <div key={tier.key} className="mb-14 last:mb-0">
                <h2 className="h-sub mb-6 border-b border-cream/12 pb-3 text-[30px]">{tier.label}</h2>
                <div className={`grid gap-4 ${large ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {list.map((s, i) => (
                    <Reveal key={s.id} delay={i * 60}>
                      <SponsorCard sponsor={s} large={large} />
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gold text-ink">
        <Reveal className="container-x flex flex-wrap items-end justify-between gap-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="h-sub text-[20px] tracking-[0.1em]">Partner with us</p>
            <h2 className="display mt-3 text-[clamp(36px,6vw,72px)]">Back the Spartans</h2>
            <p className="mt-4 text-lg leading-relaxed">
              Kit, match-day and digital sponsorship for a growing, diverse community club in Prague. We&apos;d love to talk.
            </p>
          </div>
          <a href={`mailto:${CLUB_EMAIL}?subject=Sponsoring%20Prague%20Spartans`} className="btn btn-dark btn-lg">
            <Mail size={18} /> Talk to us
          </a>
        </Reveal>
      </section>
    </>
  );
}
