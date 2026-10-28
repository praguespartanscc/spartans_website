'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, Profile } from '@/types/supabase';

type Status = Profile['status'];
const TABS: { id: Status; label: string }[] = [
  { id: 'pending', label: 'Waiting for approval' },
  { id: 'approved', label: 'Members' },
  { id: 'rejected', label: 'Rejected' },
];

type LinkChoice = { mode: 'existing'; playerId: string } | { mode: 'new'; team: string; type: string } | { mode: 'none' };

const btn = 'rounded-md px-3 py-1.5 text-sm';
const input = 'block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-black focus:ring-black';

// Best guess at an existing player for a new member, by name.
function suggest(profile: Profile, players: Player[]) {
  const name = (profile.full_name ?? '').toLowerCase().trim();
  if (!name) return null;
  return players.find((p) => p.name.toLowerCase() === name) ?? players.find((p) => p.name.toLowerCase().includes(name.split(' ')[0])) ?? null;
}

export default function MembersManagement() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<Status>('pending');
  const [loading, setLoading] = useState(true);
  const [missingSetup, setMissingSetup] = useState(false);
  const [approving, setApproving] = useState<Profile | null>(null);
  const [choice, setChoice] = useState<LinkChoice>({ mode: 'none' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p, error }, { data: pl }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('players').select('*').order('name'),
    ]);
    if (error) setMissingSetup(true);
    setProfiles((p ?? []) as Profile[]);
    setPlayers((pl ?? []) as Player[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const linkedIds = new Set(profiles.map((p) => p.player_id).filter(Boolean));
  const freePlayers = players.filter((p) => !linkedIds.has(p.id));

  function openApprove(p: Profile) {
    const s = suggest(p, freePlayers);
    setChoice(s ? { mode: 'existing', playerId: s.id } : { mode: 'new', team: 'Vanguards', type: 'batsman' });
    setApproving(p);
  }

  async function approve() {
    if (!approving) return;
    setBusy(true);
    try {
      let playerId: string | null = null;
      if (choice.mode === 'existing') playerId = choice.playerId;
      if (choice.mode === 'new') {
        const { data, error } = await supabase
          .from('players')
          .insert([{ name: approving.full_name || approving.email, team: choice.team, player_type: choice.type, role: 'player', cricheroes_url: approving.cricheroes_url }])
          .select()
          .single();
        if (error) throw error;
        playerId = data.id;
      }
      const { error } = await supabase.from('profiles').update({ status: 'approved', player_id: playerId }).eq('id', approving.id);
      if (error) throw error;
      toast.success(`${approving.full_name || approving.email} approved`);
      setApproving(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(p: Profile, status: Status) {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === 'rejected' ? 'Membership removed' : 'Updated');
      load();
    }
  }

  async function relink(p: Profile, playerId: string) {
    const { error } = await supabase.from('profiles').update({ player_id: playerId || null }).eq('id', p.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Player link updated');
      load();
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded bg-gray-200" />;
  if (missingSetup)
    return <p className="text-gray-700">Member accounts aren&apos;t switched on yet. Run <code>supabase/migrations/002_members.sql</code> in Supabase first.</p>;

  const list = profiles.filter((p) => p.status === tab);
  const playerName = (id: string | null) => players.find((pl) => pl.id === id)?.name;

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = profiles.filter((p) => p.status === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`${btn} ${tab === t.id ? 'bg-black text-white' : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100'}`}
            >
              {t.label} ({n})
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-500">Nobody here.</p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
          {list.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{p.full_name || '(no name)'}</p>
                <p className="text-sm text-gray-500">
                  {p.email} · joined {new Date(p.created_at).toLocaleDateString('en-GB')}
                </p>
                <p className="text-sm">
                  {p.cricheroes_url ? (
                    <a href={p.cricheroes_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                      CricHeroes profile ↗
                    </a>
                  ) : (
                    <span className="text-red-700">No CricHeroes profile yet: they&apos;ll be asked to add it before approval</span>
                  )}
                </p>
                {tab === 'approved' && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <label htmlFor={`link-${p.id}`} className="text-gray-600">
                      Player:
                    </label>
                    <select id={`link-${p.id}`} value={p.player_id ?? ''} onChange={(e) => relink(p, e.target.value)} className="rounded-md border-gray-300 text-sm">
                      <option value="">Not linked (non-playing member)</option>
                      {p.player_id && <option value={p.player_id}>{playerName(p.player_id)}</option>}
                      {freePlayers.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} ({pl.team})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {tab !== 'approved' && (
                  <button
                    onClick={() => openApprove(p)}
                    disabled={!p.cricheroes_url}
                    title={p.cricheroes_url ? '' : 'Waiting for their CricHeroes profile'}
                    className={`${btn} bg-black text-white hover:bg-gray-800 disabled:opacity-40`}
                  >
                    Approve
                  </button>
                )}
                {tab !== 'rejected' && (
                  <button onClick={() => setStatus(p, 'rejected')} className={`${btn} text-red-700 ring-1 ring-red-200 hover:bg-red-50`}>
                    {tab === 'approved' ? 'Remove' : 'Reject'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="approve-title">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 id="approve-title" className="text-lg font-semibold text-gray-900">
              Approve {approving.full_name || approving.email}
            </h3>
            <p className="mt-1 text-sm text-gray-600">Link them to their player profile so they can edit it and set availability.</p>

            <fieldset className="mt-4 space-y-3 text-sm text-gray-800">
              <label className="flex items-start gap-2">
                <input type="radio" checked={choice.mode === 'existing'} onChange={() => setChoice({ mode: 'existing', playerId: freePlayers[0]?.id ?? '' })} disabled={!freePlayers.length} />
                <span className="flex-1">
                  Existing player
                  {choice.mode === 'existing' && (
                    <select className={`${input} mt-1`} value={choice.playerId} onChange={(e) => setChoice({ mode: 'existing', playerId: e.target.value })}>
                      {freePlayers.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} ({pl.team})
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" checked={choice.mode === 'new'} onChange={() => setChoice({ mode: 'new', team: 'Vanguards', type: 'batsman' })} />
                <span className="flex-1">
                  Create a new player
                  {choice.mode === 'new' && (
                    <span className="mt-1 grid grid-cols-2 gap-2">
                      <select className={input} value={choice.team} onChange={(e) => setChoice({ ...choice, team: e.target.value })}>
                        <option>Vanguards</option>
                        <option>Mobilizers</option>
                        <option>Strikers</option>
                      </select>
                      <select className={input} value={choice.type} onChange={(e) => setChoice({ ...choice, type: e.target.value })}>
                        <option value="batsman">Batter</option>
                        <option value="bowler">Bowler</option>
                        <option value="allrounder">All-rounder</option>
                        <option value="wicketkeeper">Wicketkeeper</option>
                      </select>
                    </span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={choice.mode === 'none'} onChange={() => setChoice({ mode: 'none' })} />
                Non-playing member (no player profile)
              </label>
            </fieldset>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setApproving(null)} className={`${btn} ring-1 ring-gray-300 hover:bg-gray-50`}>
                Cancel
              </button>
              <button onClick={approve} disabled={busy || (choice.mode === 'existing' && !choice.playerId)} className={`${btn} bg-black text-white hover:bg-gray-800 disabled:opacity-50`}>
                {busy ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
