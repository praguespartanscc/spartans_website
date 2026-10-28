'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Availability, Match, Player, Profile } from '@/types/supabase';
import { dateParts, formatTime } from '@/lib/format';

type Choice = { slot: 'xi' | 'twelfth'; is_captain: boolean; is_keeper: boolean };
type Row = { id: number; player_id: string } & Choice & { sort_order: number };

const GROUPS = [
  { key: 'yes', label: 'Available', tone: 'bg-green-50 ring-green-200' },
  { key: 'maybe', label: 'Maybe', tone: 'bg-yellow-50 ring-yellow-200' },
  { key: 'none', label: 'No reply', tone: 'bg-white ring-gray-200' },
  { key: 'no', label: 'Not available', tone: 'bg-red-50 ring-red-200' },
] as const;

export default function TeamSelection({ matchId }: { matchId: number }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [match, setMatch] = useState<Match & { selection_published_at?: string | null }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusByPlayer, setStatusByPlayer] = useState<Map<string, { status: Availability['status']; note: string | null }>>(new Map());
  const [picks, setPicks] = useState<Map<string, Choice>>(new Map());
  const [order, setOrder] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [m, pl, pr, av, sel] = await Promise.all([
      supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
      supabase.from('players').select('*').order('name'),
      supabase.from('profiles').select('id, player_id').eq('status', 'approved'),
      supabase.from('match_availability').select('*').eq('match_id', matchId),
      supabase.from('match_selection').select('*').eq('match_id', matchId).order('sort_order'),
    ]);
    setMatch(m.data ?? undefined);
    setPlayers(((pl.data ?? []) as Player[]).filter((p) => p.is_active !== false));
    const playerOfUser = new Map(((pr.data ?? []) as Pick<Profile, 'id' | 'player_id'>[]).map((p) => [p.id, p.player_id]));
    const byPlayer = new Map<string, { status: Availability['status']; note: string | null }>();
    ((av.data ?? []) as Availability[]).forEach((a) => {
      const pid = playerOfUser.get(a.user_id);
      if (pid) byPlayer.set(String(pid), { status: a.status, note: a.note });
    });
    setStatusByPlayer(byPlayer);
    const rows = (sel.data ?? []) as Row[];
    setPicks(new Map(rows.map((r) => [String(r.player_id), { slot: r.slot, is_captain: r.is_captain, is_keeper: r.is_keeper }])));
    setOrder(rows.map((r) => String(r.player_id)));
    setLoading(false);
  }, [supabase, matchId]);

  useEffect(() => {
    load();
  }, [load]);

  const xiCount = [...picks.values()].filter((p) => p.slot === 'xi').length;

  function toggle(id: string) {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        setOrder((o) => o.filter((x) => x !== id));
      } else {
        const slot = [...next.values()].filter((p) => p.slot === 'xi').length >= 11 ? 'twelfth' : 'xi';
        next.set(id, { slot, is_captain: false, is_keeper: false });
        setOrder((o) => [...o, id]);
      }
      return next;
    });
  }

  function update(id: string, patch: Partial<Choice>) {
    setPicks((prev) => {
      const next = new Map(prev);
      // Only one captain per match.
      if (patch.is_captain) next.forEach((v, k) => k !== id && next.set(k, { ...v, is_captain: false }));
      next.set(id, { ...next.get(id)!, ...patch });
      return next;
    });
  }

  async function save(publish?: boolean) {
    setBusy(true);
    try {
      const sorted = [...order].sort((a, b) => Number(picks.get(a)?.slot === 'twelfth') - Number(picks.get(b)?.slot === 'twelfth'));
      const { error: delError } = await supabase.from('match_selection').delete().eq('match_id', matchId);
      if (delError) throw delError;
      if (sorted.length) {
        const { error } = await supabase
          .from('match_selection')
          .insert(sorted.map((pid, i) => ({ match_id: matchId, player_id: pid, sort_order: i, ...picks.get(pid)! })));
        if (error) throw error;
      }
      if (publish !== undefined) {
        const { error } = await supabase.from('matches').update({ selection_published_at: publish ? new Date().toISOString() : null }).eq('id', matchId);
        if (error) throw error;
      }
      toast.success(publish ? 'XI published on the website' : publish === false ? 'XI taken off the website' : 'Selection saved');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save selection');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="h-60 animate-pulse rounded bg-gray-200" />;
  if (!match) return <p>Match not found. <Link href="/admin/matches" className="text-blue-700">Back to matches</Link></p>;

  const d = dateParts(match.date);
  const published = !!match.selection_published_at;
  const groupOf = (p: Player) => statusByPlayer.get(String(p.id))?.status ?? 'none';

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow sm:p-6">
        <div>
          <Link href="/admin/matches" className="text-sm text-blue-700 hover:underline">← All matches</Link>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {match.team1} vs {match.team2}
          </p>
          <p className="text-sm text-gray-600">
            {d.long}
            {match.time ? ` · ${formatTime(match.time)}` : ''}
            {match.venue ? ` · ${match.venue}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${xiCount === 11 ? 'text-green-700' : 'text-gray-900'}`}>{xiCount}/11</p>
          <p className={`text-sm ${published ? 'text-green-700' : 'text-gray-500'}`}>{published ? 'Published on the website' : 'Not published'}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const list = players.filter((p) => groupOf(p) === g.key);
          return (
            <section key={g.key} className={`rounded-lg p-4 ring-1 ${g.tone}`}>
              <h3 className="mb-3 font-semibold text-gray-900">
                {g.label} <span className="text-gray-500">({list.length})</span>
              </h3>
              <ul className="space-y-1.5">
                {list.map((p) => {
                  const pick = picks.get(String(p.id));
                  const note = statusByPlayer.get(String(p.id))?.note;
                  return (
                    <li key={p.id} className={`rounded-md px-3 py-2 text-sm ${pick ? 'bg-black text-white' : 'bg-white ring-1 ring-gray-200'}`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex flex-1 cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={!!pick} onChange={() => toggle(String(p.id))} />
                          <span className="font-medium">{p.name}</span>
                          <span className={pick ? 'text-gray-300' : 'text-gray-500'}>{p.team}</span>
                        </label>
                        {pick && (
                          <span className="flex items-center gap-3 text-xs">
                            <select value={pick.slot} onChange={(e) => update(String(p.id), { slot: e.target.value as Choice['slot'] })} className="rounded border-0 bg-white py-0.5 text-xs text-black">
                              <option value="xi">XI</option>
                              <option value="twelfth">12th</option>
                            </select>
                            <label className="flex items-center gap-1">
                              <input type="checkbox" checked={pick.is_captain} onChange={(e) => update(String(p.id), { is_captain: e.target.checked })} /> C
                            </label>
                            <label className="flex items-center gap-1">
                              <input type="checkbox" checked={pick.is_keeper} onChange={(e) => update(String(p.id), { is_keeper: e.target.checked })} /> WK
                            </label>
                          </span>
                        )}
                      </div>
                      {note && <p className={`mt-1 text-xs ${pick ? 'text-gray-300' : 'text-gray-500'}`}>“{note}”</p>}
                    </li>
                  );
                })}
                {list.length === 0 && <li className="text-sm text-gray-500">Nobody</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-3 flex flex-wrap justify-end gap-2 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur">
        <button onClick={() => save()} disabled={busy} className="rounded-md px-4 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50">
          Save draft
        </button>
        {published ? (
          <button onClick={() => save(false)} disabled={busy} className="rounded-md px-4 py-2 text-sm text-red-700 ring-1 ring-red-200 hover:bg-red-50">
            Unpublish
          </button>
        ) : null}
        <button onClick={() => save(true)} disabled={busy || xiCount === 0} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
          {published ? 'Save & keep published' : 'Publish XI'}
        </button>
      </div>
    </div>
  );
}
