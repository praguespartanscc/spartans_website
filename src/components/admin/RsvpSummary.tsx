'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { DirectoryEntry, Practice, PracticeRsvp } from '@/types/supabase';
import { dateParts, formatTime } from '@/lib/format';

// Who's coming to the next practice sessions (from members' RSVPs).
export default function RsvpSummary() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [rsvps, setRsvps] = useState<PracticeRsvp[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());
    Promise.all([
      supabase.from('practices').select('*').gte('date', today).order('date').limit(6),
      supabase.from('practice_rsvps').select('*'),
      supabase.rpc('member_directory'),
    ]).then(([p, r, d]) => {
      setPractices((p.data ?? []) as Practice[]);
      setRsvps((r.data ?? []) as PracticeRsvp[]);
      setNames(new Map(((d.data ?? []) as DirectoryEntry[]).map((x) => [x.id, x.full_name])));
    });
  }, [supabase]);

  if (practices.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow">
      <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 sm:px-6">Who&apos;s coming</h3>
      <ul className="divide-y divide-gray-200">
        {practices.map((p) => {
          const d = dateParts(p.date);
          const yes = rsvps.filter((r) => r.practice_id === p.id && r.status === 'yes');
          const no = rsvps.filter((r) => r.practice_id === p.id && r.status === 'no');
          return (
            <li key={p.id} className="px-4 py-3 text-sm sm:px-6">
              <p className="font-medium text-gray-900">
                {d.weekday} {d.day} {d.month} {formatTime(p.time)} · {p.venue}{' '}
                <span className="ml-2 rounded bg-green-100 px-1.5 text-green-800">{yes.length} coming</span>
                {no.length > 0 && <span className="ml-1 rounded bg-gray-100 px-1.5 text-gray-600">{no.length} can&apos;t</span>}
              </p>
              {yes.length > 0 && <p className="mt-1 text-gray-600">{yes.map((r) => names.get(r.user_id) ?? 'Member').join(', ')}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
