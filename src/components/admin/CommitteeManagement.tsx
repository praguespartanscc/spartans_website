'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { CommitteeMember } from '@/types/supabase';
import PhotoUpload, { removeClubPhoto } from './PhotoUpload';

const POSITIONS = ['President', 'Chairman', 'Vice-President', 'Secretary', 'Treasurer', 'Manager', 'Team Manager'];

const EMPTY = { name: '', position: 'President', photo_url: null as string | null, bio: '', contact_email: '', sort_order: '100' };

const input = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm';
const label = 'block text-xs sm:text-sm font-medium text-gray-700 mb-1';

export default function CommitteeManagement() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<CommitteeMember | null>(null);
  const [toDelete, setToDelete] = useState<CommitteeMember | null>(null);
  const supabase = createClientComponentClient();

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase.from('committee').select('*');
    if (error) {
      console.error('Error fetching committee members:', error);
      toast.error('Could not load committee members');
    } else {
      setMembers(
        ((data ?? []) as CommitteeMember[]).sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100) || a.name.localeCompare(b.name)),
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  function startEdit(m: CommitteeMember) {
    setEditing(m);
    setForm({
      name: m.name,
      position: m.position,
      photo_url: m.photo_url ?? null,
      bio: m.bio ?? '',
      contact_email: m.contact_email ?? '',
      sort_order: String(m.sort_order ?? 100),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function cancelEdit() {
    if (form.photo_url && form.photo_url !== (editing?.photo_url ?? null)) await removeClubPhoto(supabase, form.photo_url);
    setEditing(null);
    setForm(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.position.trim()) {
      toast.error('Please enter a name and position');
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading(editing ? 'Saving…' : 'Adding committee member…');
    try {
      const row = {
        name: form.name.trim(),
        position: form.position.trim(),
        photo_url: form.photo_url,
        bio: form.bio.trim() || null,
        contact_email: form.contact_email.trim() || null,
        sort_order: Number.parseInt(form.sort_order, 10) || 100,
      };
      const { error } = editing
        ? await supabase.from('committee').update(row).eq('id', editing.id)
        : await supabase.from('committee').insert([row]);
      if (error) throw error;
      if (editing?.photo_url && editing.photo_url !== form.photo_url) await removeClubPhoto(supabase, editing.photo_url);
      toast.success(editing ? 'Committee member updated' : 'Committee member added');
      setEditing(null);
      setForm(EMPTY);
      fetchMembers();
    } catch (error) {
      console.error('Error saving committee member:', error);
      toast.error(`Could not save: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('committee').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Could not remove committee member');
    } else {
      await removeClubPhoto(supabase, toDelete.photo_url);
      setMembers((list) => list.filter((m) => m.id !== toDelete.id));
      toast.success('Committee member removed');
    }
    setIsSubmitting(false);
    setToDelete(null);
  }

  if (loading) {
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
        <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">{editing ? `Edit ${editing.name}` : 'Add committee member'}</h3>
        <div className="mb-5">
          <PhotoUpload supabase={supabase} folder="committee" value={form.photo_url} onChange={(url) => set({ photo_url: url })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="c-name" className={label}>Name</label>
            <input id="c-name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={input} required />
          </div>
          <div>
            <label htmlFor="c-position" className={label}>Position</label>
            <input id="c-position" list="c-positions" value={form.position} onChange={(e) => set({ position: e.target.value })} className={input} required />
            <datalist id="c-positions">
              {POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="c-email" className={label}>Public contact email (optional)</label>
            <input id="c-email" type="email" value={form.contact_email} onChange={(e) => set({ contact_email: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="c-order" className={label}>Order on page (1 = first)</label>
            <input id="c-order" type="number" min="1" max="999" value={form.sort_order} onChange={(e) => set({ sort_order: e.target.value })} className={input} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="c-bio" className={label}>Short bio (leave empty to show the standard role description)</label>
            <textarea id="c-bio" rows={3} value={form.bio} onChange={(e) => set({ bio: e.target.value })} className={input} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <button type="button" onClick={cancelEdit} disabled={isSubmitting} className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {isSubmitting ? 'Saving…' : editing ? 'Save' : 'Add member'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <ul className="divide-y divide-gray-200">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
              {m.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">{m.sort_order ?? ''}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{m.name}</p>
                <p className="text-sm text-gray-500">
                  {m.position}
                  {m.contact_email ? ` · ${m.contact_email}` : ''}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <button onClick={() => startEdit(m)} disabled={isSubmitting} className="text-blue-600 hover:text-blue-900">
                  Edit
                </button>
                <button onClick={() => setToDelete(m)} disabled={isSubmitting} className="text-red-600 hover:text-red-900">
                  Remove
                </button>
              </div>
            </li>
          ))}
          {members.length === 0 && <li className="px-6 py-8 text-center text-gray-500">No committee members yet.</li>}
        </ul>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Remove {toDelete.name}?</h3>
            <p className="mt-2 text-sm text-gray-600">They will no longer appear on the committee page.</p>
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
