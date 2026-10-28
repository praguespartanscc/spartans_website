'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Availability, Match, Profile } from '@/types/supabase';
import { dateParts, formatTime } from '@/lib/format';

type LiveInfo = { live: { title: string } | null; next: { title: string; start: string | null } | null };
type NextMatch = Match & { selection_published_at?: string | null };

function Card({ title, href, cta, children, alert }: { title: string; href: string; cta: string; children: React.ReactNode; alert?: boolean }) {
  return (
    <section className={`flex flex-col rounded-lg bg-white p-5 shadow ${alert ? 'ring-2 ring-red-300' : ''}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-2 flex-1 text-gray-900">{children}</div>
      <Link href={href} className="mt-4 self-start rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800">
        {cta}
      </Link>
    </section>
  );
}

// Admin home: what needs doing, each card linking to where it gets done.
export default function Overview() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [pending, setPending] = useState<Profile[]>([]);
  const [applications, setApplications] = useState(0);
  const [next, setNext] = useState<NextMatch | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [picked, setPicked] = useState(0);
  const [missingResults, setMissingResults] = useState(0);
  const [live, setLive] = useState<LiveInfo | null>(null);

  useEffect(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());
    (async () => {
      const [p, a, upcoming, past] = await Promise.all([
        supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('team_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('matches').select('*').eq('result', 'will be played').gte('date', today).order('date').limit(1),
        supabase.from('matches').select('id', { count: 'exact', head: true }).eq('result', 'will be played').lt('date', today),
      ]);
      setPending((p.data ?? []) as Profile[]);
      setApplications(a.count ?? 0);
      setMissingResults(past.count ?? 0);
      const m = (upcoming.data?.[0] ?? null) as NextMatch | null;
      setNext(m);
      if (m) {
        const [av, sel] = await Promise.all([
          supabase.from('match_availability').select('*').eq('match_id', m.id),
          supabase.from('match_selection').select('id', { count: 'exact', head: true }).eq('match_id', m.id),
        ]);
        setAvailability((av.data ?? []) as Availability[]);
        setPicked(sel.count ?? 0);
      }
    })();
    fetch('/api/live')
      .then((r) => (r.ok ? r.json() : null))
      .then(setLive)
      .catch(() => setLive(null));
  }, [supabase]);

  const count = (s: string) => availability.filter((x) => x.status === s).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Members waiting" href="/admin/members" cta="Review members" alert={pending.length > 0}>
          <p className="text-3xl font-bold">{pending.length}</p>
          {pending.length > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              {pending
                .slice(0, 3)
                .map((p) => p.full_name || p.email)
                .join(', ')}
              {pending.length > 3 ? '…' : ''}
            </p>
          )}
        </Card>

        <Card title="Join requests" href="/admin/applications" cta="Review requests" alert={applications > 0}>
          <p className="text-3xl font-bold">{applications}</p>
          <p className="mt-1 text-sm text-gray-600">new applications from the website</p>
        </Card>

        <Card title="Next match" href={next ? `/admin/matches/${next.id}` : '/admin/matches'} cta={next ? 'Pick XI' : 'Add a match'}>
          {next ? (
            <>
              <p className="font-semibold">
                {next.team1} vs {next.team2}
              </p>
              <p className="text-sm text-gray-600">
                {dateParts(next.date).long}
                {next.time ? ` · ${formatTime(next.time)}` : ''}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-green-700">{count('yes')} available</span> · <span className="text-yellow-700">{count('maybe')} maybe</span> ·{' '}
                <span className="text-red-700">{count('no')} out</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {next.selection_published_at ? 'XI published' : picked ? 'XI picked, not published' : 'XI not picked yet'}
              </p>
            </>
          ) : (
            <p className="text-gray-600">No upcoming matches.</p>
          )}
        </Card>

        <Card title="Missing results" href="/admin/matches" cta="Enter results" alert={missingResults > 0}>
          <p className="text-3xl font-bold">{missingResults}</p>
          <p className="mt-1 text-sm text-gray-600">played matches still marked &quot;will be played&quot;</p>
        </Card>

        <Card title="YouTube live" href="/live" cta="Open Spartans TV">
          {live?.live ? (
            <p className="font-semibold text-red-700">Live now: {live.live.title}</p>
          ) : live?.next ? (
            <p>
              Next stream: <span className="font-semibold">{live.next.title}</span>
              {live.next.start && <> · {new Date(live.next.start).toLocaleString('en-GB', { timeZone: 'Europe/Prague' })}</>}
            </p>
          ) : (
            <p className="text-gray-600">Nothing live or scheduled.</p>
          )}
        </Card>

        <section className="rounded-lg bg-white p-5 shadow">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Quick actions</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ['/admin/matches', 'Add match'],
              ['/admin/practices', 'Add practice'],
              ['/admin/notices', 'Post notice'],
              ['/admin/players', 'Add player'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-center ring-1 ring-gray-300 hover:bg-gray-50">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
