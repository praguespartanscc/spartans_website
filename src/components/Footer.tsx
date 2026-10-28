import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail } from '@/components/ui/Icons';
import { getSponsors } from '@/lib/data';
import SponsorLogo from '@/components/SponsorLogo';

const columns = [
  {
    title: 'Club',
    links: [
      { href: '/about', label: 'About' },
      { href: '/committee', label: 'Committee' },
      { href: '/sponsors', label: 'Sponsors' },
      { href: '/contact', label: 'Join the club' },
    ],
  },
  {
    title: 'Cricket',
    links: [
      { href: '/players', label: 'Team' },
      { href: '/fixtures', label: 'Fixtures & results' },
      { href: '/practices', label: 'Practices' },
      { href: '/live', label: 'Spartans TV' },
      { href: '/gallery', label: 'Photo gallery' },
    ],
  },
];

const Footer = async () => {
  const sponsors = await getSponsors();
  return (
    <footer className="border-t border-cream/12 bg-ink">
      {sponsors.length > 0 && (
        <div className="border-b border-cream/12">
          <div className="container-x flex flex-col items-center gap-6 py-10 sm:py-12">
            <p className="eyebrow text-faint">Proudly supported by</p>
            <ul className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
              {sponsors.map((sponsor) => (
                <li key={sponsor.id} className="w-[calc(50%-6px)] sm:w-48">
                  {sponsor.website_url ? (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      title={`${sponsor.name} (opens their website)`}
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
            <Link href="/sponsors" className="text-[14px] text-muted transition-colors hover:text-gold">
              Our sponsors &amp; how to support the club
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
              Spartan discipline, Prague heart.
            </p>
          </div>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="eyebrow mb-4 text-faint">{column.title}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[15px] text-muted transition-colors hover:text-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="eyebrow mb-4 text-faint">Get in touch</p>
          <p className="text-[15px] text-muted">Prague, Czech Republic</p>
          <a
            href="mailto:praguespartanscc@gmail.com"
            className="mt-1 inline-flex items-center gap-2 text-[15px] text-gold transition-colors hover:text-gold-hi"
          >
            <Mail size={16} />
            praguespartanscc@gmail.com
          </a>
          <div className="mt-5 flex gap-2">
            <a
              href="https://www.facebook.com/praguespartans"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Prague Spartans on Facebook"
              className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.instagram.com/praguespartanscc_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Prague Spartans on Instagram"
              className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/[0.07]">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-6 text-[13px] text-dim">
          <p>© {new Date().getFullYear()} Prague Spartans Cricket Club</p>
          <Link href="/login" className="transition-colors hover:text-cream">
            Member sign in
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
