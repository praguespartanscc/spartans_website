import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail } from '@/components/ui/Icons';
import { getSponsors } from '@/lib/data';
import SponsorLogo from '@/components/SponsorLogo';
import { CLUB_EMAIL, CLUB_NAME, FOUNDED, GROUND, SOCIAL } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

const columns = [
  {
    title: { en: 'Club', cs: 'Klub' },
    links: [
      { href: '/about', label: { en: 'About the club', cs: 'O klubu' } },
      { href: '/committee', label: { en: 'Committee', cs: 'Výbor' } },
      { href: '/sponsors', label: { en: 'Sponsors', cs: 'Sponzoři' } },
      { href: '/join', label: { en: 'Join the club', cs: 'Přidejte se' } },
      { href: '/safeguarding', label: { en: 'Safeguarding', cs: 'Bezpečí dětí' } },
      { href: '/privacy', label: { en: 'Privacy', cs: 'Ochrana údajů' } },
    ],
  },
  {
    title: { en: 'Cricket', cs: 'Kriket' },
    links: [
      { href: '/players', label: { en: 'Squads & players', cs: 'Týmy a hráči' } },
      { href: '/fixtures', label: { en: 'Fixtures & results', cs: 'Zápasy a výsledky' } },
      { href: '/practices', label: { en: 'Training', cs: 'Tréninky' } },
      { href: '/ground', label: { en: 'Vinoř Cricket Ground', cs: 'Kriketové hřiště Vinoř' } },
      { href: '/cricket-in-prague', label: { en: 'Cricket in Prague', cs: 'Kriket v Praze' } },
      { href: '/live', label: { en: 'Spartans TV', cs: 'Spartans TV' } },
      { href: '/gallery', label: { en: 'Photo gallery', cs: 'Fotogalerie' } },
    ],
  },
];

const Footer = async ({ lang }: { lang: Lang }) => {
  const L = (href: string) => localePath(lang, href);
  const sponsors = await getSponsors();
  return (
    <footer className="border-t border-cream/12 bg-ink">
      {sponsors.length > 0 && (
        <div className="border-b border-cream/12">
          <div className="container-x flex flex-col items-center gap-6 py-10 sm:py-12">
            <p className="eyebrow text-faint">{tr(lang, { en: 'Proudly supported by', cs: 'Hrdě nás podporují' })}</p>
            <ul className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
              {sponsors.map((sponsor) => (
                <li key={sponsor.id} className="w-[calc(50%-6px)] sm:w-48">
                  {sponsor.website_url ? (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      title={tr(lang, { en: `${sponsor.name} (opens their website)`, cs: `${sponsor.name} (otevře jejich web)` })}
                      className="group block overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_2px_var(--color-gold)]"
                    >
                      <SponsorLogo sponsor={sponsor} height={88} />
                    </a>
                  ) : (
                    <SponsorLogo sponsor={sponsor} height={88} />
                  )}
                </li>
              ))}
            </ul>
            <Link href={L('/sponsors')} className="text-[14px] text-muted transition-colors hover:text-gold">
              {tr(lang, { en: 'Our sponsors & how to support the club', cs: 'Naši sponzoři a jak klub podpořit' })}
            </Link>
          </div>
        </div>
      )}
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-8">
        <div className="flex items-start gap-6">
          <Image src="/brand/spartans-logo.png" alt="" width={99} height={120} className="h-[120px] w-auto" />
          <div>
            <p className="font-varsity text-[22px] uppercase leading-tight">Prague Spartans Cricket Club</p>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-faint">
              {tr(lang, { en: 'Spartan discipline, Prague heart.', cs: 'Spartánská disciplína, pražské srdce.' })}
            </p>
          </div>
        </div>

        {columns.map((column) => (
          <nav key={column.title.en} aria-label={tr(lang, column.title)}>
            <p className="eyebrow mb-4 text-faint">{tr(lang, column.title)}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={L(link.href)} className="text-[15px] text-muted transition-colors hover:text-cream">
                    {tr(lang, link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="eyebrow mb-4 text-faint">{tr(lang, { en: 'Get in touch', cs: 'Kontakt' })}</p>
          <p className="text-[15px] text-muted">
            {tr(lang, { en: 'Home ground', cs: 'Domácí hřiště' })}:{' '}
            <Link href={L('/ground')} className="text-cream hover:text-gold">
              {lang === 'cs' ? GROUND.localName : GROUND.name}
            </Link>
            <br />
            {GROUND.streetAddress}, {GROUND.postalCode} {GROUND.locality}
            <br />
            {tr(lang, { en: 'Prague, Czech Republic', cs: 'Praha, Česká republika' })}
          </p>
          <a href={`mailto:${CLUB_EMAIL}`} className="mt-3 inline-flex items-center gap-2 text-[15px] text-gold transition-colors hover:text-gold-hi">
            <Mail size={16} />
            {CLUB_EMAIL}
          </a>
          <div className="mt-5 flex gap-2">
            <a
              href={SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tr(lang, { en: 'Prague Spartans on Facebook', cs: 'Prague Spartans na Facebooku' })}
              className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              <Facebook size={18} />
            </a>
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tr(lang, { en: 'Prague Spartans on Instagram', cs: 'Prague Spartans na Instagramu' })}
              className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              <Instagram size={18} />
            </a>
            <a
              href={SOCIAL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center border border-cream/20 px-3 font-display text-[14px] font-bold uppercase tracking-[0.06em] text-cream transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/[0.07]">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-6 text-[13px] text-dim">
          <p>
            © {new Date().getFullYear()} {CLUB_NAME} · {tr(lang, { en: `Founded ${FOUNDED}`, cs: `Založen v roce ${FOUNDED}` })}
          </p>
          <Link href="/login" className="transition-colors hover:text-cream">
            {tr(lang, { en: 'Member sign in', cs: 'Přihlášení pro členy' })}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
