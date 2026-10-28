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
  { href: '/live', label: 'Live' },
];

const Header = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLive, setIsLive] = useState(false);

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
        setIsAdmin(user?.app_metadata?.isAdmin === true);
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

  // Compact bar once the page scrolls. rAF-throttled and passive so it never blocks scrolling.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Red dot on "Live" while the club's YouTube channel is streaming (checked every two minutes).
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      fetch('/api/live')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !cancelled && setIsLive(!!d?.live))
        .catch(() => {});
    check();
    const timer = window.setInterval(check, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
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

  // Desktop opens with the full 120px club logo (the brand manual's minimum size).
  // Once scrolled, the bar condenses and shows the name as text instead of shrinking the logo.
  const showLogo = !scrolled && !menuOpen;

  return (
    <>
      {/* Reserves the header's resting height so the fixed bar never overlaps content */}
      <div aria-hidden="true" className="h-16 lg:h-[152px]" />
      <header
        className={`fixed inset-x-0 top-0 z-[100] border-b bg-ink transition-[height,border-color] duration-500 ease-[var(--ease-out-expo)] ${
          scrolled || menuOpen ? 'h-16 border-cream/12' : 'h-16 border-cream/12 lg:h-[152px]'
        }`}
      >
        <div className="container-x relative flex h-full items-center justify-between gap-6">
          <Link href="/" className="group relative flex h-full items-center" aria-label="Prague Spartans Cricket Club, home">
            <Image
              src="/brand/spartans-logo.png"
              alt=""
              width={99}
              height={120}
              priority
              className={`absolute left-0 top-1/2 hidden h-[120px] w-auto max-w-none -translate-y-1/2 transition-opacity duration-300 lg:block ${
                showLogo ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            />
            <span
              className={`font-varsity text-[19px] uppercase leading-none tracking-[0.02em] transition-opacity duration-300 sm:text-[22px] ${
                showLogo ? 'lg:opacity-0' : 'opacity-100'
              }`}
            >
              Prague <span className="text-gold">Spartans</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`group relative px-3 py-2 font-display text-[19px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                  isActive(link.href) ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                {link.label}
                {link.href === '/live' && isLive && (
                  <span aria-label="(live now)" className="live-dot ml-1.5 inline-block h-2 w-2 -translate-y-0.5 rounded-full bg-crimson-hi" />
                )}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-[3px] origin-left bg-gold transition-transform duration-500 ease-[var(--ease-out-expo)] ${
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
              className="flex h-11 w-11 items-center justify-center text-cream transition-colors hover:text-gold lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <Close size={26} /> : <Menu size={26} />}
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
                  className={`flex items-center justify-between py-4 font-varsity text-[34px] uppercase leading-none sm:text-[44px] ${
                    isActive(link.href) ? 'text-gold' : 'text-cream'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {link.label}
                    {link.href === '/live' && isLive && (
                      <span className="chip bg-crimson text-white">
                        <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> Live now
                      </span>
                    )}
                  </span>
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

          <div className="mt-10 flex justify-center">
            <Image src="/brand/spartans-logo.png" alt="Prague Spartans Cricket Club" width={99} height={120} className="h-[120px] w-auto" />
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
