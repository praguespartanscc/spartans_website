'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, Profile } from '@/types/supabase';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

type Status = Profile['status'];
type Tab = Status | 'admins';
const TABS: { id: Status; label: string }[] = [
  { id: 'pending', label: 'Waiting for approval' },
  { id: 'approved', label: 'Members' },
  { id: 'rejected', label: 'Rejected' },
];

// From public.admin_list() (supabase/migrations/08_admin_roles.sql)
type Admin = { email: string; user_id: string | null; full_name: string | null; signed_up: boolean };

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
  const [tab, setTab] = useState<Tab>('pending');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [myEmail, setMyEmail] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingSetup, setMissingSetup] = useState(false);
  const [approving, setApproving] = useState<Profile | null>(null);
  const [choice, setChoice] = useState<LinkChoice>({ mode: 'none' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p, error }, { data: pl }, { data: a }, { data: me }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('players').select('*').order('name'),
      supabase.rpc('admin_list'),
      supabase.auth.getUser(),
    ]);
    if (error) setMissingSetup(true);
    setProfiles((p ?? []) as Profile[]);
    setPlayers((pl ?? []) as Player[]);
    setAdmins((a ?? []) as Admin[]);
    setMyEmail(me.user?.email?.toLowerCase() ?? '');
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

  async function setAdmin(email: string, makeAdmin: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc('set_admin', { target_email: email, make_admin: makeAdmin });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(makeAdmin ? `${email} is now an admin` : `${email} is no longer an admin`);
      setNewAdmin('');
      setRemovingAdmin(null);
      load();
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded bg-gray-200" />;
  if (missingSetup)
    return <p className="text-gray-700">Member accounts aren&apos;t switched on yet. Run <code>supabase/migrations/002_members.sql</code> in Supabase first.</p>;

  const list = profiles.filter((p) => p.status === tab);
  const adminEmails = new Set(admins.map((a) => a.email.toLowerCase()));
  const isAdminEmail = (email: string | null) => !!email && adminEmails.has(email.toLowerCase());
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
        <button
          onClick={() => setTab('admins')}
          className={`${btn} ${tab === 'admins' ? 'bg-black text-white' : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100'}`}
        >
          Admins ({admins.length})
        </button>
      </div>

      {tab === 'admins' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Admins can manage everything on the website. Someone who hasn&apos;t signed up yet becomes an admin as soon as they sign up with that email and confirm it.
          </p>
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
            {admins.map((a) => {
              const isMe = a.email.toLowerCase() === myEmail;
              return (
                <li key={a.email} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {a.full_name || a.email}
                      {isMe && <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">You</span>}
                      {!a.signed_up && <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Not signed up yet</span>}
                    </p>
                    {a.full_name && <p className="text-sm text-gray-500">{a.email}</p>}
                  </div>
                  {!isMe && (
                    <button onClick={() => setRemovingAdmin(a.email)} disabled={busy} className={`${btn} text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50`}>
                      Remove admin
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newAdmin.trim()) setAdmin(newAdmin.trim(), true);
            }}
            className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-4 shadow sm:p-6"
          >
            <label className="min-w-[16rem] flex-1 text-sm text-gray-700">
              Add an admin by email
              <input type="email" required value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} placeholder="name@example.com" className={`${input} mt-1`} />
            </label>
            <button type="submit" disabled={busy} className={`${btn} bg-black text-white hover:bg-gray-800 disabled:opacity-50`}>
              Make admin
            </button>
          </form>
          <p className="text-sm text-gray-500">You can&apos;t remove your own admin rights, so the club always has at least one admin.</p>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-500">Nobody here.</p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
          {list.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
              <div className="min-w-[15rem] flex-1">
                <p className="font-medium text-gray-900">
                  {p.full_name || '(no name)'}
                  {isAdminEmail(p.email) && <span className="ml-2 rounded bg-black px-2 py-0.5 text-xs text-white">Admin</span>}
                </p>
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
              <div className="flex flex-wrap gap-2">
                {tab === 'approved' && p.email && !isAdminEmail(p.email) && (
                  <button onClick={() => setAdmin(p.email!, true)} disabled={busy} className={`${btn} ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50`}>
                    Make admin
                  </button>
                )}
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
                {tab !== 'rejected' && p.email?.toLowerCase() !== myEmail && (
                  <button onClick={() => setStatus(p, 'rejected')} className={`${btn} text-red-700 ring-1 ring-red-200 hover:bg-red-50`}>
                    {tab === 'approved' ? 'Remove' : 'Reject'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {removingAdmin && (
        <ConfirmDialog
          title={`Remove admin rights from ${removingAdmin}?`}
          message="They stay a member and can still use their member dashboard."
          confirmLabel="Remove admin"
          danger
          busy={busy}
          onConfirm={() => setAdmin(removingAdmin, false)}
          onCancel={() => setRemovingAdmin(null)}
        />
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
