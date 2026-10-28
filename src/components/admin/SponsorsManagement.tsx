'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Sponsor } from '@/types/supabase';
import PhotoUpload, { removeClubPhoto } from './PhotoUpload';

const TIERS = [
  { value: 'principal', label: 'Principal partner' },
  { value: 'gold', label: 'Gold sponsor' },
  { value: 'partner', label: 'Club partner' },
];

const EMPTY = { name: '', website_url: '', description: '', logo_url: null as string | null, tier: 'partner', sort_order: '100' };

const input = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm';
const label = 'block text-xs sm:text-sm font-medium text-gray-700 mb-1';

export default function SponsorsManagement() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [toDelete, setToDelete] = useState<Sponsor | null>(null);
  const supabase = createClientComponentClient();

  const fetchSponsors = useCallback(async () => {
    const { data, error } = await supabase.from('sponsors').select('*');
    if (error) {
      console.error('Error fetching sponsors:', error);
      toast.error('Could not load sponsors');
    } else {
      setSponsors(((data ?? []) as Sponsor[]).sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100) || a.name.localeCompare(b.name)));
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  function startEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      website_url: s.website_url ?? '',
      description: s.description ?? '',
      logo_url: s.logo_url ?? null,
      tier: s.tier ?? 'partner',
      sort_order: String(s.sort_order ?? 100),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function cancelEdit() {
    if (form.logo_url && form.logo_url !== (editing?.logo_url ?? null)) await removeClubPhoto(supabase, form.logo_url);
    setEditing(null);
    setForm(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.logo_url) {
      toast.error('Please upload a logo');
      return;
    }
    if (form.website_url && !/^https?:\/\//.test(form.website_url)) {
      toast.error('The website should start with https://');
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading(editing ? 'Saving sponsor…' : 'Adding sponsor…');
    try {
      const row = {
        name: form.name.trim(),
        website_url: form.website_url.trim() || null,
        description: form.description.trim() || null,
        logo_url: form.logo_url,
        tier: form.tier,
        sort_order: Number.parseInt(form.sort_order, 10) || 100,
      };
      // Database policies only let admins write, so no server-side workaround is needed.
      const { error } = editing
        ? await supabase.from('sponsors').update(row).eq('id', editing.id)
        : await supabase.from('sponsors').insert([row]);
      if (error) throw error;
      if (editing?.logo_url && editing.logo_url !== form.logo_url) await removeClubPhoto(supabase, editing.logo_url);
      toast.success(editing ? 'Sponsor updated' : 'Sponsor added');
      setEditing(null);
      setForm(EMPTY);
      fetchSponsors();
    } catch (error) {
      console.error('Error saving sponsor:', error);
      toast.error(`Could not save sponsor: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('sponsors').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Could not remove sponsor');
    } else {
      await removeClubPhoto(supabase, toDelete.logo_url);
      setSponsors((list) => list.filter((s) => s.id !== toDelete.id));
      toast.success('Sponsor removed');
    }
    setIsSubmitting(false);
    setToDelete(null);
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
        <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">{editing ? `Edit ${editing.name}` : 'Add sponsor'}</h3>
        <div className="mb-5">
          <PhotoUpload
            supabase={supabase}
            bucket="sponsor-logos"
            folder="logos"
            kind="logo"
            label="Logo"
            value={form.logo_url}
            onChange={(url) => set({ logo_url: url })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="s-name" className={label}>Name</label>
            <input id="s-name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={input} required />
          </div>
          <div>
            <label htmlFor="s-web" className={label}>Website</label>
            <input id="s-web" type="url" value={form.website_url} onChange={(e) => set({ website_url: e.target.value })} className={input} placeholder="https://" />
          </div>
          <div>
            <label htmlFor="s-tier" className={label}>Tier</label>
            <select id="s-tier" value={form.tier} onChange={(e) => set({ tier: e.target.value })} className={input}>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="s-order" className={label}>Order within tier (1 = first)</label>
            <input id="s-order" type="number" min="1" max="999" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} className={input} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="s-desc" className={label}>Description (shown on the sponsors page)</label>
            <textarea id="s-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={input} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {isSubmitting ? 'Saving…' : editing ? 'Save sponsor' : 'Add sponsor'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <ul className="divide-y divide-gray-200">
          {sponsors.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
              {s.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo_url} alt="" className="h-12 w-20 rounded bg-white object-contain ring-1 ring-gray-200" />
              ) : (
                <span className="h-12 w-20 rounded bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">
                  {TIERS.find((t) => t.value === (s.tier ?? 'partner'))?.label}
                  {s.website_url ? ` · ${s.website_url}` : ''}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <button onClick={() => startEdit(s)} disabled={isSubmitting} className="text-blue-600 hover:text-blue-900">
                  Edit
                </button>
                <button onClick={() => setToDelete(s)} disabled={isSubmitting} className="text-red-600 hover:text-red-900">
                  Remove
                </button>
              </div>
            </li>
          ))}
          {sponsors.length === 0 && <li className="px-6 py-8 text-center text-gray-500">No sponsors yet.</li>}
        </ul>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Remove {toDelete.name}?</h3>
            <p className="mt-2 text-sm text-gray-600">This deletes the sponsor and their logo from the website.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setToDelete(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={remove} disabled={isSubmitting} className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
