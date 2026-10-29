'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { ArrowRight, Close, Facebook, Instagram, Menu } from '@/components/ui/Icons';
import { hasCzech, localePath, splitLangPath, tr, type Lang } from '@/lib/i18n';
import { CLUB_EMAIL, SOCIAL } from '@/lib/club';

// English paths; the Czech section uses the same paths under /cs.
const navLinks = [
  { href: '/', label: { en: 'Home', cs: 'Úvod' } },
  { href: '/players', label: { en: 'Team', cs: 'Tým' } },
  { href: '/fixtures', label: { en: 'Fixtures', cs: 'Zápasy' } },
  { href: '/practices', label: { en: 'Training', cs: 'Tréninky' } },
  { href: '/about', label: { en: 'About', cs: 'O klubu' } },
  { href: '/committee', label: { en: 'Committee', cs: 'Výbor' } },
  { href: '/gallery', label: { en: 'Gallery', cs: 'Galerie' } },
  { href: '/live', label: { en: 'Live', cs: 'Živě' } },
];

// EN | CS switch: goes to the same page in the other language (or that language's home page).
function LangSwitch({ lang, path, className = '' }: { lang: Lang; path: string; className?: string }) {
  const target = (to: Lang) => (to === 'en' ? path : hasCzech(path) ? localePath('cs', path) : '/cs');
  return (
    <span className={`flex items-center font-display font-bold uppercase tracking-[0.06em] ${className}`} aria-label={tr(lang, { en: 'Language', cs: 'Jazyk' })}>
      {(['en', 'cs'] as const).map((to, i) => (
        <span key={to} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="px-1 text-dim">|</span>}
          {to === lang ? (
            <span aria-current="true" className="px-1 text-gold">
              {to.toUpperCase()}
            </span>
          ) : (
            <Link href={target(to)} hrefLang={to} lang={to} prefetch={false} className="px-1 text-muted transition-colors hover:text-cream" title={to === 'cs' ? 'Česky' : 'English'}>
              {to.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </span>
  );
}

const Header = () => {
  const pathname = usePathname() ?? '/';
  const { lang, path } = splitLangPath(pathname);
  const L = (href: string) => localePath(lang, href);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

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

  // Close the menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Account dropdown closes on Escape or a click elsewhere.
  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as Element).closest('[data-account-menu]')) setAccountOpen(false);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, [accountOpen]);

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
      window.location.href = L('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

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
          <Link href={L('/')} className="group relative flex h-full items-center" aria-label={tr(lang, { en: 'Prague Spartans Cricket Club, home', cs: 'Prague Spartans Cricket Club, úvodní stránka' })}>
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

          <nav aria-label={tr(lang, { en: 'Main', cs: 'Hlavní menu' })} className="hidden items-center gap-0 lg:flex xl:gap-1">
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={L(link.href)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`group relative whitespace-nowrap px-2 py-2 font-display text-[17px] font-bold uppercase tracking-[0.04em] transition-colors xl:px-3 xl:text-[19px] xl:tracking-[0.06em] duration-200 ${
                  isActive(link.href) ? 'text-cream' : 'text-muted hover:text-cream'
                }`}
              >
                {tr(lang, link.label)}
                {link.href === '/live' && isLive && (
                  <span aria-label={tr(lang, { en: '(live now)', cs: '(právě živě)' })} className="live-dot ml-1.5 inline-block h-2 w-2 -translate-y-0.5 rounded-full bg-crimson-hi" />
                )}
                <span
                  className={`absolute inset-x-2 -bottom-0.5 h-[3px] origin-left xl:inset-x-3 bg-gold transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                    isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitch lang={lang} path={path} className="hidden text-[15px] lg:flex" />
            {!loading && (
              <div className="hidden items-center gap-1 font-display text-[16px] font-bold uppercase tracking-[0.06em] lg:flex">
                {user ? (
                  <div className="relative" data-account-menu>
                    <button
                      type="button"
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                      onClick={() => setAccountOpen((o) => !o)}
                      className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 uppercase text-muted transition-colors hover:text-cream"
                    >
                      {tr(lang, { en: 'Account', cs: 'Účet' })} <span aria-hidden="true" className={`text-[12px] transition-transform ${accountOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {accountOpen && (
                      <div role="menu" className="absolute right-0 top-full z-10 mt-2 flex min-w-52 flex-col border border-cream/15 bg-ink py-2 shadow-2xl">
                        <Link role="menuitem" href="/dashboard" className="px-4 py-2.5 text-cream hover:bg-cream/10">
                          {tr(lang, { en: 'My dashboard', cs: 'Můj přehled' })}
                        </Link>
                        {isAdmin && (
                          <Link role="menuitem" href="/admin" className="px-4 py-2.5 text-cream hover:bg-cream/10">
                            {tr(lang, { en: 'Admin dashboard', cs: 'Administrace' })}
                          </Link>
                        )}
                        <button role="menuitem" type="button" onClick={handleSignOut} className="px-4 py-2.5 text-left uppercase text-muted hover:bg-cream/10 hover:text-cream">
                          {tr(lang, { en: 'Sign out', cs: 'Odhlásit se' })}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="whitespace-nowrap px-3 py-2 text-muted transition-colors hover:text-cream">
                    {tr(lang, { en: 'Sign in', cs: 'Přihlásit se' })}
                  </Link>
                )}
              </div>
            )}
            <Link href={L('/join')} className="btn btn-gold hidden sm:inline-flex">
              {tr(lang, { en: 'Join the club', cs: 'Přidejte se' })}
            </Link>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center text-cream transition-colors hover:text-gold lg:hidden"
              aria-label={menuOpen ? tr(lang, { en: 'Close menu', cs: 'Zavřít menu' }) : tr(lang, { en: 'Open menu', cs: 'Otevřít menu' })}
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
        aria-label={tr(lang, { en: 'Menu', cs: 'Menu' })}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`fixed inset-x-0 bottom-0 top-[64px] z-[90] overflow-y-auto bg-ink transition-[opacity,visibility] duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav aria-label={tr(lang, { en: 'Mobile', cs: 'Mobilní menu' })} className="container-x flex min-h-full flex-col pb-10 pt-6">
          <LangSwitch lang={lang} path={path} className="mb-4 text-[18px]" />
          <ul className="flex flex-col">
            {navLinks.map((link, i) => (
              <li
                key={link.href}
                className={`border-b border-cream/10 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: menuOpen ? `${80 + i * 45}ms` : '0ms' }}
              >
                <Link
                  href={L(link.href)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between py-4 font-varsity text-[34px] uppercase leading-none sm:text-[44px] ${
                    isActive(link.href) ? 'text-gold' : 'text-cream'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {tr(lang, link.label)}
                    {link.href === '/live' && isLive && (
                      <span className="chip bg-crimson text-white">
                        <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> {tr(lang, { en: 'Live now', cs: 'Právě živě' })}
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
            <Link href={L('/join')} onClick={() => setMenuOpen(false)} className="btn btn-gold btn-lg">
              {tr(lang, { en: 'Join the club', cs: 'Přidejte se' })}
              <ArrowRight size={18} className="btn-arrow" />
            </Link>
            {!loading &&
              (user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                    {tr(lang, { en: 'My dashboard', cs: 'Můj přehled' })}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                      {tr(lang, { en: 'Admin dashboard', cs: 'Administrace' })}
                    </Link>
                  )}
                  <button type="button" onClick={handleSignOut} className="btn btn-outline btn-lg">
                    {tr(lang, { en: 'Sign out', cs: 'Odhlásit se' })}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                  {tr(lang, { en: 'Member sign in', cs: 'Přihlášení pro členy' })}
                </Link>
              ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Image src="/brand/spartans-logo.png" alt="Prague Spartans Cricket Club" width={99} height={120} className="h-[120px] w-auto" />
          </div>

          <div className="mt-auto flex items-center gap-3 pt-10 text-muted">
            <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
              <Facebook size={18} />
            </a>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold hover:text-gold">
              <Instagram size={18} />
            </a>
            <a href={`mailto:${CLUB_EMAIL}`} className="ml-2 text-[15px] hover:text-cream">
              {CLUB_EMAIL}
            </a>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
