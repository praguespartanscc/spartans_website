'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/members', label: 'Members', count: 'members' },
  { href: '/admin/applications', label: 'Join requests', count: 'applications' },
  { href: '/admin/matches', label: 'Matches & selection' },
  { href: '/admin/practices', label: 'Practices' },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/achievements', label: 'Achievements' },
  { href: '/admin/notices', label: 'Notices' },
  { href: '/admin/committee', label: 'Committee' },
  { href: '/admin/sponsors', label: 'Sponsors' },
  { href: '/admin/settings', label: 'Settings' },
] as const;

type Counts = { members: number; applications: number };

// Committee members who are not admins only write news and achievements.
const WRITER_SECTIONS = ['/admin/news', '/admin/achievements'];

// Admin chrome: brand-black sidebar on desktop, a section picker on phones,
// and a light panel for the data-entry screens. Access is enforced by middleware.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [counts, setCounts] = useState<Counts>({ members: 0, applications: 0 });
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAdmin(data.user?.app_metadata?.isAdmin === true));
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('team_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([m, a]) => setCounts({ members: m.count ?? 0, applications: a.count ?? 0 }));
  }, [supabase, pathname, isAdmin]);

  const sections = isAdmin ? SECTIONS : SECTIONS.filter((s) => WRITER_SECTIONS.includes(s.href));
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const current = sections.find((s) => active(s.href)) ?? sections[0];

  return (
    <div className="container-x py-8 sm:py-10 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
      <aside className="mb-6 lg:mb-0">
        <p className="eyebrow mb-2">{isAdmin ? 'Club admin' : 'Committee'}</p>
        <p className="h-sub mb-6 hidden text-[30px] lg:block">Dashboard</p>

        {/* Phones and tablets: one picker instead of a long list */}
        <label htmlFor="admin-section" className="sr-only">
          Admin section
        </label>
        <select id="admin-section" className="field lg:hidden" value={current.href} onChange={(e) => router.push(e.target.value)}>
          {sections.map((s) => (
            <option key={s.href} value={s.href}>
              {s.label}
              {'count' in s && counts[s.count] ? ` (${counts[s.count]})` : ''}
            </option>
          ))}
        </select>

        <nav aria-label="Admin sections" className="hidden lg:block">
          <ul className="flex flex-col border-l border-cream/12">
            {sections.map((s) => {
              const n = 'count' in s ? counts[s.count] : 0;
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={active(s.href) ? 'page' : undefined}
                    className={`-ml-px flex items-center justify-between border-l-[3px] py-2.5 pl-4 pr-2 font-display text-[17px] font-bold uppercase tracking-[0.05em] transition-colors ${
                      active(s.href) ? 'border-gold text-cream' : 'border-transparent text-faint hover:text-cream'
                    }`}
                  >
                    {s.label}
                    {n > 0 && <span className="min-w-6 bg-crimson px-1.5 text-center text-[13px] text-white">{n}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div key={pathname} className="page-enter min-w-0">
        <h1 className="display mb-6 text-[clamp(32px,4vw,48px)]">{current.label}</h1>
        <div className="rounded-lg bg-[#F5F5F5] p-3 text-gray-900 [color-scheme:light] sm:p-6">{children}</div>
      </div>
    </div>
  );
}
