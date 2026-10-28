'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { ArrowRight, Close, Facebook, Instagram, Menu } from '@/components/ui/Icons';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/players', label: 'Team' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/practices', label: 'Practices' },
  { href: '/about', label: 'About' },
  { href: '/committee', label: 'Committee' },
];

const Header = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Error getting user:', error);
          }
          setUser(null);
          setIsAdmin(false);
          return;
        }
        setUser(user);
        setIsAdmin(user?.user_metadata?.isAdmin === true);
      } catch (error) {
        console.error('Error in Header auth check:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // Solid, compact bar once the page scrolls. rAF-throttled and passive so it never blocks scrolling.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 12);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Close the menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // While the menu is open: lock page scroll and close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  return (
    <>
      <header
        className={`sticky top-0 z-[100] border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || menuOpen
            ? 'border-cream/10 bg-ink/85 backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-ink'
        }`}
      >
        <div
          className={`container-x flex items-center justify-between gap-6 transition-[height] duration-500 ease-[var(--ease-out-expo)] ${
            scrolled ? 'h-[64px]' : 'h-[72px]'
          }`}
        >
          <Link href="/" className="group flex items-center gap-3" aria-label="Prague Spartans Cricket Club, home">
            <Image
              src="/crest.png"
              alt=""
              width={36}
              height={44}
              priority
              className="h-11 w-9 object-contain transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-3 group-hover:scale-105"
            />
            <span className="font-display text-[18px] font-semibold uppercase leading-none tracking-[0.06em] sm:text-[20px]">
              Prague Spartans
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`group relative px-3 py-2 text-[15px] font-medium transition-colors duration-200 ${
                  isActive(link.href) ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-[2px] origin-left bg-gold transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && user && (
              <div className="hidden items-center gap-1 lg:flex">
                {isAdmin && (
                  <Link href="/admin" className="px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:text-cream">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:text-cream"
                >
                  Sign out
                </button>
              </div>
            )}
            <Link href="/contact" className="btn btn-gold hidden sm:inline-flex">
              Join the club
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-cream transition-colors hover:bg-cream/10 lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <Close size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile and tablet menu */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`fixed inset-x-0 bottom-0 top-[64px] z-[90] overflow-y-auto bg-ink transition-[opacity,visibility] duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="container-x flex min-h-full flex-col pb-10 pt-6">
          <ul className="flex flex-col">
            {[...navLinks, { href: '/contact', label: 'Contact' }].map((link, i) => (
              <li
                key={link.href}
                className={`border-b border-cream/10 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: menuOpen ? `${80 + i * 45}ms` : '0ms' }}
              >
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between py-4 font-display text-[34px] font-semibold uppercase leading-none sm:text-[44px] ${
                    isActive(link.href) ? 'text-gold' : 'text-cream'
                  }`}
                >
                  {link.label}
                  <ArrowRight size={26} className="text-dim" />
                </Link>
              </li>
            ))}
          </ul>

          <div
            className={`mt-8 flex flex-col gap-3 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] sm:flex-row ${
              menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: menuOpen ? '420ms' : '0ms' }}
          >
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="btn btn-gold btn-lg">
              Join the club
              <ArrowRight size={18} className="btn-arrow" />
            </Link>
            {!loading &&
              (user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                      Admin dashboard
                    </Link>
                  )}
                  <button type="button" onClick={handleSignOut} className="btn btn-outline btn-lg">
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                  Member sign in
                </Link>
              ))}
          </div>

          <div className="mt-auto flex items-center gap-3 pt-10 text-muted">
            <a href="https://www.facebook.com/praguespartans" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/praguespartanscc_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
              <Instagram size={18} />
            </a>
            <a href="mailto:praguespartanscc@gmail.com" className="ml-2 text-[15px] hover:text-cream">
              praguespartanscc@gmail.com
            </a>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
