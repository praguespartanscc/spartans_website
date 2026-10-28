'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Availability, Match } from '@/types/supabase';
import { dateParts, formatTime } from '@/lib/format';

type Row = Match & { selection_published_at?: string | null };
const todayInPrague = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());

// Upcoming matches with availability counts and XI status, plus past matches still missing a result.
export default function MatchBoard() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [matches, setMatches] = useState<Row[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      supabase.from('matches').select('*').eq('result', 'will be played').order('date'),
      supabase.from('match_availability').select('match_id, status'),
      supabase.from('match_selection').select('match_id'),
    ]).then(([m, a, s]) => {
      setMatches((m.data ?? []) as Row[]);
      setAvailability((a.data ?? []) as Availability[]);
      setPicked(new Set(((s.data ?? []) as { match_id: number }[]).map((r) => r.match_id)));
    });
  }, [supabase]);

  const today = todayInPrague();
  const upcoming = matches.filter((m) => m.date >= today);
  const needResult = matches.filter((m) => m.date < today);

  const Item = ({ m, past }: { m: Row; past?: boolean }) => {
    const d = dateParts(m.date);
    const a = availability.filter((x) => x.match_id === m.id);
    const count = (s: string) => a.filter((x) => x.status === s).length;
    const status = m.selection_published_at ? 'XI published' : picked.has(m.id) ? 'XI picked (not published)' : 'XI not picked';
    return (
      <li className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <div className="w-16 text-center">
          <p className="text-xl font-bold text-gray-900">{d.day}</p>
          <p className="text-xs uppercase text-gray-500">{d.month}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">
            {m.team1} vs {m.team2}
          </p>
          <p className="text-sm text-gray-500">
            {[formatTime(m.time), m.venue].filter(Boolean).join(' · ')}
            {!past && ` · ${count('yes')} available, ${count('maybe')} maybe, ${count('no')} out · ${status}`}
          </p>
        </div>
        {past ? (
          <span className="text-sm text-red-700">Needs a result: edit it below</span>
        ) : (
          <Link href={`/admin/matches/${m.id}`} className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800">
            Availability & XI
          </Link>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg bg-white shadow">
        <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 sm:px-6">Upcoming: availability & team selection</h3>
        <ul className="divide-y divide-gray-200">
          {upcoming.map((m) => (
            <Item key={m.id} m={m} />
          ))}
          {upcoming.length === 0 && <li className="px-6 py-6 text-gray-500">No upcoming matches.</li>}
        </ul>
      </section>
      {needResult.length > 0 && (
        <section className="overflow-hidden rounded-lg bg-white shadow ring-1 ring-red-200">
          <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-red-800 sm:px-6">Played but no result entered</h3>
          <ul className="divide-y divide-gray-200">
            {needResult.map((m) => (
              <Item key={m.id} m={m} past />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
