'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { MatchRecord } from '@/lib/indoor/store';
import { listLocal } from '@/lib/indoor/store';
import type { Member } from './MemberGate';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowRight } from '@/components/ui/Icons';

type Row = MatchRecord & { local: boolean; unsynced: boolean };

export default function MatchList({ member }: { member: Member }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const local = listLocal().map((lm) => ({ ...lm.match, local: true, unsynced: lm.pending.length > 0 || lm.matchPending }));
    setRows(local);
    const supabase = createClientComponentClient();
    supabase
      .from('indoor_matches')
      .select('id, team_a, team_b, setup, summary, status, share_slug, played_on, created_by, scorer_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(40)
      .then(({ data, error }) => {
        if (error || !data) return;
        const byId = new Map<string, Row>();
        for (const m of data as MatchRecord[]) byId.set(m.id, { ...m, local: false, unsynced: false });
        for (const l of local) {
          const server = byId.get(l.id);
          byId.set(l.id, server && !l.unsynced ? { ...server, local: true, unsynced: false } : l);
        }
        setRows([...byId.values()].sort((a, b) => (b.played_on ?? '').localeCompare(a.played_on ?? '') || (b.updated_at ?? '').localeCompare(a.updated_at ?? '')));
      });
  }, []);

  const mine = (r: Row) => r.local || r.created_by === member.user.id || r.scorer_id === member.user.id;
  const live = (rows ?? []).filter((r) => r.status === 'live');
  const rest = (rows ?? []).filter((r) => r.status !== 'live');

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <p className="eyebrow">Indoor cricket</p>
      <h1 className="display mt-3 text-[clamp(36px,10vw,56px)]">Scorer</h1>
      <p className="mt-3 text-sand">Score an indoor match ball by ball. Every rule can be set for the day, and the score saves on your phone as you go.</p>
      <Link href="/score/new" className="btn btn-gold btn-lg mt-6 w-full">
        New indoor match
        <ArrowRight size={18} className="btn-arrow" />
      </Link>

      {rows === null ? (
        <div className="mt-10 space-y-3" role="status" aria-label="Loading matches">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No matches yet">Start one and it shows up here.</EmptyState>
        </div>
      ) : (
        <>
          {live.length > 0 && <List title="Live now" rows={live} mine={mine} />}
          {rest.length > 0 && <List title="Recent" rows={rest} mine={mine} />}
        </>
      )}
    </div>
  );
}

function List({ title, rows, mine }: { title: string; rows: Row[]; mine: (r: Row) => boolean }) {
  return (
    <section className="mt-10">
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/score/${r.id}`} className="card card-hover block p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <span>{new Date(`${r.played_on}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex gap-2">
                  {r.status === 'live' && <span className="chip border-crimson-hi text-cream">Live</span>}
                  {mine(r) && <span className="chip">Yours</span>}
                </span>
              </div>
              <p className="h-sub mt-2 text-xl">
                {r.team_a} v {r.team_b}
              </p>
              {r.summary?.innings?.length ? (
                <ul className="mt-1 text-sm text-sand">
                  {r.summary.innings.map((i) => (
                    <li key={i.team} className="flex justify-between">
                      <span>{i.team}</span>
                      <span className="font-varsity">
                        {i.total}/{i.wickets} <span className="text-muted">({i.overs})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">Not started</p>
              )}
              {r.summary?.result && <p className="mt-2 text-sm text-gold">{r.summary.result}</p>}
              {r.unsynced && <p className="mt-2 text-xs text-muted">Saved on this phone, waiting to upload</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
