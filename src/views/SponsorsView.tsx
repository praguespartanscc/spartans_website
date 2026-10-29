import type { Metadata } from 'next';
import { getSponsors } from '@/lib/data';
import { CLUB_EMAIL, CLUB_NAME, ORG_ID } from '@/lib/club';
import type { Sponsor } from '@/types/supabase';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import SponsorLogo from '@/components/SponsorLogo';
import JsonLd from '@/components/JsonLd';
import { ArrowUpRight, Mail } from '@/components/ui/Icons';
import { tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /sponsors (English) and /cs/sponsors (Czech). Sponsor names and descriptions
// come from the database as entered.

const pageTitle = (lang: Lang) => tr(lang, { en: 'Sponsors & Partners', cs: 'Sponzoři a partneři' });

export function sponsorsMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/sponsors',
    title: pageTitle(lang),
    description: tr(lang, {
      en: 'The sponsors and partners who support Prague Spartans Cricket Club in Prague, and how your business can back cricket in the Czech Republic.',
      cs: 'Sponzoři a partneři, kteří podporují kriketový klub Prague Spartans v Praze, a jak může kriket v Česku podpořit i vaše firma.',
    }),
  });
}

const TIERS = [
  { key: 'principal', label: { en: 'Principal partner', cs: 'Hlavní partner' } },
  { key: 'gold', label: { en: 'Gold sponsors', cs: 'Zlatí sponzoři' } },
  { key: 'partner', label: { en: 'Club partners', cs: 'Partneři klubu' } },
];

function SponsorCard({ sponsor, large, lang }: { sponsor: Sponsor; large?: boolean; lang: Lang }) {
  const body = (
    <>
      <SponsorLogo sponsor={sponsor} height={large ? 160 : 112} />
      <div className="p-6">
        <h3 className="h-sub text-[26px] transition-colors group-hover:text-gold">{sponsor.name}</h3>
        {sponsor.description && <p className="mt-2 leading-relaxed text-muted">{sponsor.description}</p>}
        {sponsor.website_url && (
          <span className="mt-4 inline-flex items-center gap-2 font-display text-[16px] font-extrabold uppercase tracking-[0.04em] text-gold">
            {tr(lang, { en: 'Visit website', cs: 'Navštívit web' })} <ArrowUpRight size={15} />
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

export default async function SponsorsView({ lang }: { lang: Lang }) {
  const sponsors = await getSponsors();
  const subject = encodeURIComponent(tr(lang, { en: 'Sponsoring Prague Spartans', cs: 'Sponzorství Prague Spartans' }));

  // The club node (same @id as everywhere else) gains its sponsors.
  const sponsorLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': ORG_ID,
    name: CLUB_NAME,
    sponsor: sponsors.map((s) => ({
      '@type': 'Organization',
      name: s.name,
      ...(s.website_url ? { url: s.website_url } : {}),
      ...(s.logo_url && /^https?:\/\//.test(s.logo_url) ? { logo: s.logo_url } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[pageTitle(lang), '/sponsors']])} />
      {sponsors.length > 0 && <JsonLd data={sponsorLd} />}

      <PageHero
        eyebrow={tr(lang, { en: 'Partners', cs: 'Partneři' })}
        title={tr(lang, {
          en: (
            <>
              Prague Spartans <span className="text-gold">sponsors</span>
            </>
          ),
          cs: (
            <>
              Sponzoři klubu <span className="text-gold">Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'The businesses that keep Prague Spartans Cricket Club playing. Thank you for backing cricket in Prague.',
          cs: 'Firmy, díky kterým může kriketový klub Prague Spartans hrát. Děkujeme, že podporujete kriket v Praze.',
        })}
      />

      <section className="py-14 sm:py-20">
        <div className="container-x">
          {sponsors.length === 0 && (
            <p className="text-lg text-muted">
              {tr(lang, {
                en: 'Our sponsor line-up for the new season is coming soon.',
                cs: 'Sponzory pro novou sezónu brzy představíme.',
              })}
            </p>
          )}
          {TIERS.map((tier) => {
            const list = sponsors.filter((s) => (s.tier ?? 'partner') === tier.key);
            if (list.length === 0) return null;
            const large = tier.key === 'principal';
            return (
              <div key={tier.key} className="mb-14 last:mb-0">
                <h2 className="h-sub mb-6 border-b border-cream/12 pb-3 text-[30px]">{tr(lang, tier.label)}</h2>
                <div className={`grid gap-4 ${large ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {list.map((s, i) => (
                    <Reveal key={s.id} delay={i * 60}>
                      <SponsorCard sponsor={s} large={large} lang={lang} />
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
            <p className="h-sub text-[20px] tracking-[0.1em]">{tr(lang, { en: 'Partner with us', cs: 'Staňte se partnerem' })}</p>
            <h2 className="display mt-3 text-[clamp(36px,6vw,72px)]">{tr(lang, { en: 'Back the Spartans', cs: 'Podpořte Spartans' })}</h2>
            <p className="mt-4 text-lg leading-relaxed">
              {tr(lang, {
                en: 'Kit, match-day and digital sponsorship for a growing, international community cricket club in Prague. We would love to talk.',
                cs: 'Nabízíme reklamu na dresech, partnerství zápasových dnů i online propagaci v rostoucím mezinárodním kriketovém klubu v Praze. Rádi se s vámi domluvíme.',
              })}
            </p>
          </div>
          <a href={`mailto:${CLUB_EMAIL}?subject=${subject}`} className="btn btn-dark btn-lg">
            <Mail size={18} /> {tr(lang, { en: 'Talk to us', cs: 'Ozvěte se nám' })}
          </a>
        </Reveal>
      </section>
    </>
  );
}
