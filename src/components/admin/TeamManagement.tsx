'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Player, PlayerPrivate } from '@/types/supabase';
import PhotoUpload, { removeClubPhoto } from './PhotoUpload';

type Row = Player & { email: string | null; age: number | null };

const EMPTY = {
  name: '',
  email: '',
  age: '',
  player_type: 'batsman',
  role: 'player',
  team: 'Vanguards',
  photo_url: null as string | null,
  jersey_number: '',
  batting_style: '',
  bowling_style: '',
  joined_year: '',
  cricheroes_url: '',
  bio: '',
  is_active: true,
};

const input =
  'block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm';
const label = 'block text-xs sm:text-sm font-medium text-gray-700 mb-1';

const toInt = (v: string) => (v.trim() === '' ? null : Number.parseInt(v, 10));
const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

export default function TeamManagement() {
  const [players, setPlayers] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Row | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [squad, setSquad] = useState('all');
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

  const fetchPlayers = useCallback(async () => {
    try {
      const [{ data: rows, error }, { data: privateRows }, { data: profiles }] = await Promise.all([
        supabase.from('players').select('*').order('name', { ascending: true }),
        supabase.from('player_private').select('player_id, email, age'),
        supabase.from('profiles').select('player_id').eq('status', 'approved'),
      ]);
      setLinked(new Set(((profiles ?? []) as { player_id: string | null }[]).map((p) => String(p.player_id)).filter(Boolean)));
      if (error) throw error;
      const byId = new Map((privateRows as PlayerPrivate[] | null)?.map((p) => [p.player_id, p]) ?? []);
      setPlayers(
        (rows ?? []).map((p: Player & { email?: string; age?: number }) => ({
          ...p,
          email: byId.get(p.id)?.email ?? p.email ?? null,
          age: byId.get(p.id)?.age ?? p.age ?? null,
        })),
      );
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Could not load players');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  function startEdit(p: Row) {
    setEditing(p);
    setForm({
      name: p.name,
      email: p.email ?? '',
      age: p.age != null ? String(p.age) : '',
      player_type: p.player_type ?? 'batsman',
      role: p.role ?? 'player',
      team: p.team ?? 'Vanguards',
      photo_url: p.photo_url ?? null,
      jersey_number: p.jersey_number != null ? String(p.jersey_number) : '',
      batting_style: p.batting_style ?? '',
      bowling_style: p.bowling_style ?? '',
      joined_year: p.joined_year != null ? String(p.joined_year) : '',
      cricheroes_url: p.cricheroes_url ?? '',
      bio: p.bio ?? '',
      is_active: p.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function cancelEdit() {
    // A photo uploaded during an abandoned edit is not used anywhere.
    if (form.photo_url && form.photo_url !== (editing?.photo_url ?? null)) await removeClubPhoto(supabase, form.photo_url);
    setEditing(null);
    setForm(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.cricheroes_url && !/^https?:\/\//.test(form.cricheroes_url)) {
      toast.error('The CricHeroes link should start with https://');
      return;
    }
    setIsSubmitting(true);
    const loading = toast.loading(editing ? 'Saving player…' : 'Adding player…');
    try {
      const profile = {
        name: form.name.trim(),
        player_type: form.player_type,
        role: form.role,
        team: form.team,
        photo_url: form.photo_url,
        jersey_number: toInt(form.jersey_number),
        batting_style: orNull(form.batting_style),
        bowling_style: orNull(form.bowling_style),
        joined_year: toInt(form.joined_year),
        cricheroes_url: orNull(form.cricheroes_url),
        bio: orNull(form.bio),
        is_active: form.is_active,
      };
      const query = editing
        ? supabase.from('players').update(profile).eq('id', editing.id)
        : supabase.from('players').insert([profile]);
      const { data, error } = await query.select().single();
      if (error) throw error;

      const { error: privateError } = await supabase
        .from('player_private')
        .upsert({ player_id: data.id, email: orNull(form.email), age: toInt(form.age), updated_at: new Date().toISOString() });
      if (privateError) throw privateError;

      if (editing?.photo_url && editing.photo_url !== form.photo_url) await removeClubPhoto(supabase, editing.photo_url);

      toast.success(editing ? 'Player updated' : 'Player added');
      setEditing(null);
      setForm(EMPTY);
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error(`Could not save player: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      toast.dismiss(loading);
      setIsSubmitting(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('players').delete().eq('id', toDelete.id);
      if (error) throw error;
      await removeClubPhoto(supabase, toDelete.photo_url);
      setPlayers((list) => list.filter((p) => p.id !== toDelete.id));
      toast.success('Player removed');
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Could not remove player');
    } finally {
      setIsSubmitting(false);
      setToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <form onSubmit={save} className="rounded-lg bg-gray-50 p-4 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">{editing ? `Edit ${editing.name}` : 'Add new player'}</h3>

        <div className="mb-5">
          <PhotoUpload supabase={supabase} folder="players" value={form.photo_url} onChange={(url) => set({ photo_url: url })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="name" className={label}>Name</label>
            <input id="name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={input} required />
          </div>
          <div>
            <label htmlFor="team" className={label}>Squad</label>
            <select id="team" value={form.team} onChange={(e) => set({ team: e.target.value })} className={input}>
              <option value="Vanguards">Vanguards</option>
              <option value="Mobilizers">Mobilizers</option>
              <option value="Strikers">Strikers</option>
            </select>
          </div>
          <div>
            <label htmlFor="jersey" className={label}>Shirt number</label>
            <input id="jersey" type="number" min="0" max="999" value={form.jersey_number} onChange={(e) => set({ jersey_number: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="player_type" className={label}>Playing role</label>
            <select id="player_type" value={form.player_type} onChange={(e) => set({ player_type: e.target.value })} className={input}>
              <option value="batsman">Batter</option>
              <option value="bowler">Bowler</option>
              <option value="allrounder">All-rounder</option>
              <option value="wicketkeeper">Wicketkeeper</option>
            </select>
          </div>
          <div>
            <label htmlFor="role" className={label}>Team role</label>
            <select id="role" value={form.role} onChange={(e) => set({ role: e.target.value })} className={input}>
              <option value="player">Player</option>
              <option value="captain">Captain</option>
              <option value="vice-captain">Vice-captain</option>
            </select>
          </div>
          <div>
            <label htmlFor="joined" className={label}>Joined the club (year)</label>
            <input id="joined" type="number" min="2019" max="2100" value={form.joined_year} onChange={(e) => set({ joined_year: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="batting" className={label}>Batting style</label>
            <input id="batting" list="batting-styles" value={form.batting_style} onChange={(e) => set({ batting_style: e.target.value })} className={input} placeholder="Right-hand bat" />
            <datalist id="batting-styles">
              <option value="Right-hand bat" />
              <option value="Left-hand bat" />
            </datalist>
          </div>
          <div>
            <label htmlFor="bowling" className={label}>Bowling style</label>
            <input id="bowling" list="bowling-styles" value={form.bowling_style} onChange={(e) => set({ bowling_style: e.target.value })} className={input} placeholder="Right-arm medium" />
            <datalist id="bowling-styles">
              <option value="Right-arm fast" />
              <option value="Right-arm medium" />
              <option value="Right-arm off-spin" />
              <option value="Right-arm leg-spin" />
              <option value="Left-arm fast" />
              <option value="Left-arm medium" />
              <option value="Left-arm orthodox" />
              <option value="Left-arm wrist-spin" />
            </datalist>
          </div>
          <div>
            <label htmlFor="cricheroes" className={label}>CricHeroes profile link</label>
            <input id="cricheroes" type="url" value={form.cricheroes_url} onChange={(e) => set({ cricheroes_url: e.target.value })} className={input} placeholder="https://cricheroes.com/player-profile/…" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="bio" className={label}>Bio (shown on the public profile)</label>
            <textarea id="bio" rows={3} value={form.bio} onChange={(e) => set({ bio: e.target.value })} className={input} />
          </div>
        </div>

        <fieldset className="mt-5 rounded-md border border-gray-200 bg-white p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Private (admins only)</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={input} />
            </div>
            <div>
              <label htmlFor="age" className={label}>Age</label>
              <input id="age" type="number" min="8" max="90" value={form.age} onChange={(e) => set({ age: e.target.value })} className={input} />
            </div>
          </div>
        </fieldset>

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
          Show on the website (untick for players who have left)
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {isSubmitting ? 'Saving…' : editing ? 'Save player' : 'Add player'}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search players"
          aria-label="Search players"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border-gray-300 text-sm sm:w-64"
        />
        <select aria-label="Filter by squad" value={squad} onChange={(e) => setSquad(e.target.value)} className="rounded-md border-gray-300 text-sm">
          <option value="all">All squads</option>
          <option>Vanguards</option>
          <option>Mobilizers</option>
          <option>Strikers</option>
          <option value="hidden">Hidden players</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <ul className="divide-y divide-gray-200">
          {players
            .filter((p) => (squad === 'all' ? true : squad === 'hidden' ? p.is_active === false : p.team === squad))
            .filter((p) => p.name.toLowerCase().includes(search.toLowerCase().trim()))
            .map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {p.jersey_number ?? '–'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {p.name}
                  {p.role === 'captain' && <span className="ml-2 rounded bg-yellow-100 px-1.5 text-xs text-yellow-800">C</span>}
                  {p.role === 'vice-captain' && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">VC</span>}
                  {p.is_active === false && <span className="ml-2 rounded bg-gray-100 px-1.5 text-xs text-gray-600">hidden</span>}
                  {linked.has(String(p.id)) && <span className="ml-2 rounded bg-green-100 px-1.5 text-xs text-green-800">member account</span>}
                </p>
                <p className="text-sm capitalize text-gray-500">
                  {p.team ?? 'No squad'} · {p.player_type}
                  {p.email ? ` · ${p.email}` : ''}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <button onClick={() => startEdit(p)} disabled={isSubmitting} className="text-blue-600 hover:text-blue-900">
                  Edit
                </button>
                <button onClick={() => setToDelete(p)} disabled={isSubmitting} className="text-red-600 hover:text-red-900">
                  Remove
                </button>
              </div>
            </li>
          ))}
          {players.length === 0 && <li className="px-6 py-8 text-center text-gray-500">No players yet.</li>}
        </ul>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Remove {toDelete.name}?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This deletes the player and their photo. To keep them in the records but hide them from the website, edit them and untick
              &quot;Show on the website&quot; instead.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setToDelete(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={remove} disabled={isSubmitting} className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {isSubmitting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
