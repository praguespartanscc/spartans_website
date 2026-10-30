'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { ArrowRight, Facebook, Instagram } from '@/components/ui/Icons';
import { hasCzech, localePath, splitLangPath, tr, type Lang } from '@/lib/i18n';
import { CLUB_EMAIL, SOCIAL } from '@/lib/club';

// Five groups instead of a long row of links. English paths: the Czech section uses the same
// paths under /cs. A group's first page is where its name leads.
type Label = { en: string; cs: string };
type NavGroup = { label: Label; href: string; items: { href: string; label: Label; hint: Label }[] };

const navGroups: NavGroup[] = [
  {
    label: { en: 'Matches', cs: 'Zápasy' },
    href: '/fixtures',
    items: [
      { href: '/fixtures', label: { en: 'Fixtures and results', cs: 'Zápasy a výsledky' }, hint: { en: 'All three squads this season', cs: 'Všechny tři týmy v této sezóně' } },
      { href: '/live', label: { en: 'Live', cs: 'Živě' }, hint: { en: 'Stream, indoor scores and training today', cs: 'Přenosy, halové skóre a dnešní trénink' } },
      { href: '/ground', label: { en: 'Vinoř ground', cs: 'Hřiště Vinoř' }, hint: { en: 'Our home ground and how to get there', cs: 'Naše domácí hřiště a jak se k němu dostat' } },
    ],
  },
  { label: { en: 'Training', cs: 'Tréninky' }, href: '/practices', items: [] },
  {
    label: { en: 'Team', cs: 'Tým' },
    href: '/players',
    items: [
      { href: '/players', label: { en: 'Squads and players', cs: 'Týmy a hráči' }, hint: { en: 'Vanguards, Mobilizers and Strikers', cs: 'Vanguards, Mobilizers a Strikers' } },
      { href: '/achievements', label: { en: 'Achievements', cs: 'Úspěchy' }, hint: { en: 'Titles and awards by season', cs: 'Tituly a ocenění po sezónách' } },
      { href: '/committee', label: { en: 'Committee', cs: 'Výbor' }, hint: { en: 'The people who run the club', cs: 'Lidé, kteří vedou klub' } },
    ],
  },
  {
    label: { en: 'News', cs: 'Novinky' },
    href: '/news',
    items: [
      { href: '/news', label: { en: 'News and reports', cs: 'Novinky a zprávy' }, hint: { en: 'Results and club life', cs: 'Výsledky a život v klubu' } },
      { href: '/gallery', label: { en: 'Photo gallery', cs: 'Fotogalerie' }, hint: { en: 'Match days and club events', cs: 'Zápasy a klubové akce' } },
    ],
  },
  {
    label: { en: 'Club', cs: 'Klub' },
    href: '/about',
    items: [
      { href: '/about', label: { en: 'About the club', cs: 'O klubu' }, hint: { en: 'Our story since 2019', cs: 'Náš příběh od roku 2019' } },
      { href: '/cricket-in-prague', label: { en: 'Cricket in Prague', cs: 'Kriket v Praze' }, hint: { en: 'A guide for newcomers', cs: 'Průvodce pro nováčky' } },
      { href: '/sponsors', label: { en: 'Sponsors', cs: 'Sponzoři' }, hint: { en: 'Partners who support us', cs: 'Partneři, kteří nás podporují' } },
      { href: '/safeguarding', label: { en: 'Safeguarding', cs: 'Bezpečí dětí' }, hint: { en: 'Code of conduct and welfare', cs: 'Pravidla chování a ochrana' } },
    ],
  },
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
  const [hidden, setHidden] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

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

  // Compact bar once the page scrolls; tucks away while scrolling down and comes back
  // as soon as the reader scrolls up. rAF-throttled and passive so it never blocks scrolling.
  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setScrolled(y > 24);
        if (Math.abs(y - lastY) > 6) {
          setHidden(y > lastY && y > 480);
          lastY = y;
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Red dot on "Live" while the club streams, scores an indoor match, or trains (checked every two minutes).
  useEffect(() => {
    let cancelled = false;
    const check = () =>
      fetch('/api/live')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !cancelled && setIsLive(!!(d?.live || d?.indoor?.length || d?.session)))
        .catch(() => {});
    check();
    const timer = window.setInterval(check, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (hidden) setAccountOpen(false);
  }, [hidden]);

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

  // Sliding underline: measure the hovered link (or the current page's link) inside the nav.
  const navRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [bar, setBar] = useState({ x: 0, w: 0, ready: false });
  const groupActive = (g: NavGroup) => isActive(g.href) || g.items.some((i) => isActive(i.href));
  const activeHref = navGroups.find(groupActive)?.href ?? null;
  const target = hovered ?? activeHref;

  const measure = useCallback(() => {
    const nav = navRef.current;
    const el = target ? nav?.querySelector<HTMLElement>(`[data-nav="${target}"]`) : null;
    if (!nav || !el || !el.offsetWidth) {
      setBar((b) => ({ ...b, w: 0 }));
      return;
    }
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    // Position relative to the nav itself (each link sits in its own wrapper, so offsetLeft is useless).
    const x = el.getBoundingClientRect().left - nav.getBoundingClientRect().left + pad;
    setBar((b) => ({ x, w: Math.max(0, el.offsetWidth - pad * 2), ready: b.ready || b.w > 0 }));
  }, [target]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [measure, lang, scrolled]);

  // Desktop opens with the full 120px club logo (the brand manual's minimum size).
  // Once scrolled, the bar condenses and shows the name as text instead of shrinking the logo.
  const showLogo = !scrolled && !menuOpen;

  return (
    <>
      {/* Reserves the header's resting height so the fixed bar never overlaps content */}
      <div aria-hidden="true" className="h-16 lg:h-[152px]" />
      <header
        className={`fixed inset-x-0 top-0 z-[100] border-b bg-ink transition-[height,border-color,transform] duration-500 ease-[var(--ease-out-expo)] ${
          scrolled || menuOpen ? 'h-16 border-cream/12' : 'h-16 border-cream/12 lg:h-[152px]'
        } ${hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0'}`}
        onFocusCapture={() => setHidden(false)}
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
            {/* Phones and tablets: the crest sits in the bar, on solid black, beside the name */}
            <Image src="/brand/spartans-logo.png" alt="" width={99} height={120} priority className="mr-2.5 h-11 w-auto lg:hidden" />
            <span
              className={`font-varsity text-[18px] uppercase leading-none tracking-[0.02em] transition-opacity duration-300 min-[380px]:text-[19px] sm:text-[22px] ${
                showLogo ? 'lg:opacity-0' : 'opacity-100'
              }`}
            >
              Prague <span className="text-gold">Spartans</span>
            </span>
          </Link>

          <nav
            ref={navRef}
            aria-label={tr(lang, { en: 'Main', cs: 'Hlavní menu' })}
            className="relative hidden items-center gap-0 lg:flex xl:gap-1"
            onMouseLeave={() => setHovered(null)}
          >
            {navGroups.map((g) => {
              const open = openGroup === g.href && g.items.length > 0;
              return (
                <div
                  key={g.href}
                  className="relative"
                  onMouseEnter={() => (setHovered(g.href), setOpenGroup(g.href))}
                  onMouseLeave={() => setOpenGroup(null)}
                  onFocus={() => (setHovered(g.href), setOpenGroup(g.href))}
                  onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && (setOpenGroup(null), setHovered(null))}
                  onKeyDown={(e) => e.key === 'Escape' && setOpenGroup(null)}
                >
                  <Link
                    href={L(g.href)}
                    data-nav={g.href}
                    aria-current={groupActive(g) ? 'page' : undefined}
                    aria-haspopup={g.items.length ? 'true' : undefined}
                    aria-expanded={g.items.length ? open : undefined}
                    className={`group relative flex items-center gap-1 whitespace-nowrap px-3 py-2 font-display text-[18px] font-bold uppercase tracking-[0.05em] transition-colors duration-200 xl:px-4 xl:text-[20px] ${
                      groupActive(g) ? 'text-cream' : 'text-muted hover:text-cream'
                    }`}
                  >
                    {tr(lang, g.label)}
                    {g.items.length > 0 && <span aria-hidden="true" className={`text-[11px] text-dim transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>}
                  </Link>
                  {g.items.length > 0 && (
                    <div
                      className={`absolute left-1/2 top-full z-20 w-[min(560px,80vw)] -translate-x-1/2 pt-3 transition-[opacity,transform] duration-200 ease-out-expo ${
                        open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
                      }`}
                    >
                      <ul className={`grid gap-2 border border-cream/12 bg-ink-2 p-3 shadow-2xl ${g.items.length > 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {g.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={L(item.href)}
                              onClick={() => setOpenGroup(null)}
                              aria-current={isActive(item.href) ? 'page' : undefined}
                              className={`flex h-full flex-col gap-1 border p-3 transition-colors duration-200 ${isActive(item.href) ? 'border-gold bg-panel' : 'border-cream/10 bg-panel hover:border-gold'}`}
                            >
                              <span className="flex items-center gap-2 font-display text-[18px] font-extrabold uppercase italic text-cream">
                                {tr(lang, item.label)}
                                {item.href === '/live' && isLive && <span className="live-dot inline-block h-2 w-2 rounded-full bg-crimson-hi" />}
                              </span>
                              <span className="text-[14px] normal-case text-muted">{tr(lang, item.hint)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
            {/* One gold bar that glides to the hovered link and settles back under the current page */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0.5 left-0 h-[3px] w-px origin-left bg-gold transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]"
              style={{
                transform: `translateX(${bar.x}px) scaleX(${bar.w})`,
                opacity: bar.w ? 1 : 0,
                transitionDuration: bar.ready ? undefined : '0ms',
              }}
            />
          </nav>

          <div className="flex items-center gap-2">
            {isLive && (
              <Link href={L('/live')} className="chip shrink-0 border-crimson-hi bg-crimson text-white" aria-label={tr(lang, { en: 'Live now', cs: 'Právě živě' })}>
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> {tr(lang, { en: 'Live', cs: 'Živě' })}
              </Link>
            )}
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
                        <Link role="menuitem" href="/score" className="px-4 py-2.5 text-cream hover:bg-cream/10">
                          {tr(lang, { en: 'Indoor scorer', cs: 'Halové skórování' })}
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
            <Link href={L('/join')} className="btn btn-gold hidden lg:inline-flex">
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
              <span aria-hidden="true" className="relative block h-[18px] w-[26px]">
                {[0, 1, 2].map((n) => (
                  <span
                    key={n}
                    className={`absolute left-0 h-[2px] w-full rounded-full bg-current transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] ${
                      n === 0 ? 'top-0' : n === 1 ? 'top-[8px]' : 'top-[16px]'
                    } ${
                      menuOpen
                        ? n === 0
                          ? 'translate-y-[8px] rotate-45'
                          : n === 1
                            ? 'scale-x-0 opacity-0'
                            : '-translate-y-[8px] -rotate-45'
                        : ''
                    }`}
                  />
                ))}
              </span>
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
          <ul className="flex flex-col gap-2">
            {isLive && (
              <li className={`transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Link
                  href={L('/live')}
                  onClick={() => setMenuOpen(false)}
                  className="card flex items-center justify-between gap-3 border-crimson-hi bg-gradient-to-r from-brown to-panel p-4"
                >
                  <span className="font-display text-[26px] font-extrabold uppercase italic leading-none">{tr(lang, { en: 'Live', cs: 'Živě' })}</span>
                  <span className="chip bg-crimson text-white">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> {tr(lang, { en: 'On now', cs: 'Právě teď' })}
                  </span>
                </Link>
              </li>
            )}
            {navGroups.map((g, i) => (
              <li
                key={g.href}
                className={`card transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${groupActive(g) ? 'border-gold' : ''} ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: menuOpen ? `${60 + i * 45}ms` : '0ms' }}
              >
                <Link
                  href={L(g.href)}
                  aria-current={groupActive(g) ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 pt-3.5 pb-1 font-display text-[26px] font-extrabold uppercase italic leading-none text-cream"
                >
                  {tr(lang, g.label)}
                  <ArrowRight size={20} className="text-gold" />
                </Link>
                <span className="flex flex-wrap gap-x-1 px-3 pb-3 text-[15px]">
                  {(g.items.length ? g.items : [{ href: g.href, label: { en: 'Thursday nets and winter halls', cs: 'Čtvrteční sítě a zimní haly' } }]).map((item) => (
                    <Link
                      key={item.href}
                      href={L(item.href)}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`inline-flex min-h-9 items-center px-1 ${isActive(item.href) ? 'text-gold' : 'text-muted'}`}
                    >
                      {tr(lang, item.label)}
                    </Link>
                  ))}
                </span>
              </li>
            ))}
          </ul>

          <div
            className={`mt-5 grid grid-cols-2 gap-2 transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${
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
                  <Link href="/score" onClick={() => setMenuOpen(false)} className="btn btn-outline btn-lg">
                    {tr(lang, { en: 'Indoor scorer', cs: 'Halové skórování' })}
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
