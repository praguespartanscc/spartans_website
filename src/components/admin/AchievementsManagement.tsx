'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Achievement } from '@/types/supabase';
import { SQUADS } from '@/lib/club';
import PhotoUpload, { removeClubPhoto } from './PhotoUpload';
import ConfirmDialog from './ConfirmDialog';
import { useWriter } from './useWriter';

const RESULTS: { value: Achievement['result']; label: string }[] = [
  { value: 'winners', label: 'Winners' },
  { value: 'runners_up', label: 'Runners-up' },
  { value: 'semi_finals', label: 'Semi-finals' },
  { value: 'award', label: 'Award' },
  { value: 'other', label: 'Other' },
];

const thisYear = () => Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric' }).format(new Date()));
const empty = () => ({ season: String(thisYear()), title: '', title_cs: '', team: '', result: 'winners' as Achievement['result'], photo_url: null as string | null, note: '', note_cs: '', sort_order: '100' });

const input = 'block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-black focus:ring-black';
const label = 'mb-1 block text-xs font-medium text-gray-700 sm:text-sm';

// Trophies and awards for the public Achievements page (and the honours lists around the site).
export default function AchievementsManagement() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const writer = useWriter();
  const [rows, setRows] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Achievement | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('achievements').select('*').order('season', { ascending: false }).order('sort_order');
    if (error) setMissing(true);
    setRows((data ?? []) as Achievement[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<ReturnType<typeof empty>>) => setForm((f) => ({ ...f, ...patch }));

  function edit(a: Achievement) {
    setEditing(a);
    setForm({ season: String(a.season), title: a.title, title_cs: a.title_cs ?? '', team: a.team ?? '', result: a.result, photo_url: a.photo_url, note: a.note ?? '', note_cs: a.note_cs ?? '', sort_order: String(a.sort_order) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditing(null);
    setForm(empty());
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const row = {
      season: Number.parseInt(form.season, 10),
      title: form.title.trim(),
      title_cs: form.title_cs.trim() || null,
      team: form.team || null,
      result: form.result,
      photo_url: form.photo_url,
      note: form.note.trim() || null,
      note_cs: form.note_cs.trim() || null,
      sort_order: Number.parseInt(form.sort_order, 10) || 100,
    };
    const { error } = editing ? await supabase.from('achievements').update(row).eq('id', editing.id) : await supabase.from('achievements').insert([row]);
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (editing?.photo_url && editing.photo_url !== form.photo_url) await removeClubPhoto(supabase, editing.photo_url);
    toast.success(editing ? 'Achievement updated' : 'Achievement added');
    reset();
    load();
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase.from('achievements').delete().eq('id', toDelete.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    await removeClubPhoto(supabase, toDelete.photo_url);
    toast.success('Achievement deleted');
    setToDelete(null);
    load();
  }

  if (loading || writer.loading) return <div className="h-40 animate-pulse rounded bg-gray-200" />;
  if (!writer.canWrite) return <p className="text-gray-700">Achievements can be edited by admins and committee members.</p>;
  if (missing) return <p className="text-gray-700">Achievements aren&apos;t switched on yet. Run <code>supabase/migrations/14_news_achievements.sql</code> in Supabase first.</p>;

  const seasons = [...new Set(rows.map((r) => r.season))];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <form onSubmit={save} className="rounded-lg bg-gray-50 p-4 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">{editing ? `Edit "${editing.title}"` : 'Add an achievement'}</h3>
        <div className="mb-5">
          <PhotoUpload supabase={supabase} folder="achievements" value={form.photo_url} onChange={(url) => set({ photo_url: url })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="a-season" className={label}>Season</label>
            <input id="a-season" type="number" min="2019" max="2100" className={input} value={form.season} onChange={(e) => set({ season: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="a-team" className={label}>Team</label>
            <select id="a-team" className={input} value={form.team} onChange={(e) => set({ team: e.target.value })}>
              <option value="">Whole club</option>
              {SQUADS.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a-result" className={label}>Result</label>
            <select id="a-result" className={input} value={form.result} onChange={(e) => set({ result: e.target.value as Achievement['result'] })}>
              {RESULTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a-order" className={label}>Order in the season (1 = first)</label>
            <input id="a-order" type="number" min="1" max="999" className={input} value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-title" className={label}>Title (e.g. Division 2 winners)</label>
            <input id="a-title" className={input} value={form.title} maxLength={160} onChange={(e) => set({ title: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-title-cs" className={label}>Czech title</label>
            <input id="a-title-cs" className={input} value={form.title_cs} maxLength={160} onChange={(e) => set({ title_cs: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-note" className={label}>Short note (optional)</label>
            <input id="a-note" className={input} value={form.note} maxLength={240} onChange={(e) => set({ note: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-note-cs" className={label}>Czech note</label>
            <input id="a-note-cs" className={input} value={form.note_cs} maxLength={240} onChange={(e) => set({ note_cs: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <button type="button" onClick={reset} disabled={busy} className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400">
              Cancel
            </button>
          )}
          <button type="submit" disabled={busy} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Saving…' : editing ? 'Save' : 'Add achievement'}
          </button>
        </div>
      </form>

      {seasons.map((season) => (
        <section key={season}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{season}</h3>
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-md">
            {rows
              .filter((r) => r.season === season)
              .map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500">
                      {a.team ?? 'Whole club'} · {RESULTS.find((r) => r.value === a.result)?.label}
                      {a.title_cs ? ' · Czech title' : ''}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <button onClick={() => edit(a)} disabled={busy} className="text-blue-600 hover:text-blue-900">
                      Edit
                    </button>
                    {writer.isAdmin && (
                      <button onClick={() => setToDelete(a)} disabled={busy} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
      {rows.length === 0 && <p className="rounded-lg bg-white p-6 text-center text-gray-500">No achievements yet.</p>}

      {toDelete && (
        <ConfirmDialog
          title={`Delete "${toDelete.title}"?`}
          message="It disappears from the Achievements page and the honours lists. This cannot be undone."
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
