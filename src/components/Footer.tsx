import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail } from '@/components/ui/Icons';

const columns = [
  {
    title: 'Club',
    links: [
      { href: '/about', label: 'About' },
      { href: '/committee', label: 'Committee' },
      { href: '/contact', label: 'Join the club' },
    ],
  },
  {
    title: 'Cricket',
    links: [
      { href: '/players', label: 'Team' },
      { href: '/fixtures', label: 'Fixtures & results' },
      { href: '/practices', label: 'Practices' },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-cream/12 bg-ink">
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
