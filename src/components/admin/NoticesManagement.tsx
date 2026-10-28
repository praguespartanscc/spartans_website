'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { Notice } from '@/types/supabase';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const EMPTY = { title: '', body: '', pinned: false, email: false };
const input = 'block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-black focus:ring-black';

export default function NoticesManagement() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Notice | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('notices').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
    setNotices((data ?? []) as Notice[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const row = { title: form.title.trim(), body: form.body.trim(), pinned: form.pinned };
      const { data, error } = editing
        ? await supabase.from('notices').update(row).eq('id', editing.id).select().single()
        : await supabase.from('notices').insert([row]).select().single();
      if (error) throw error;
      toast.success(editing ? 'Notice updated' : 'Notice posted to members');

      if (form.email) {
        const res = await fetch('/api/admin/notices/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noticeId: data.id }),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok) toast.success(`Emailed to ${result.sent} members`);
        else toast.error(`Not emailed: ${result.error ?? res.status}`);
      }
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save notice');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase.from('notices').delete().eq('id', toDelete.id);
    setBusy(false);
    if (error) toast.error(`Not deleted: ${error.message}`);
    else {
      toast.success('Notice deleted');
      if (editing?.id === toDelete.id) {
        setEditing(null);
        setForm(EMPTY);
      }
      load();
    }
    setToDelete(null);
  }

  function startEdit(n: Notice) {
    setEditing(n);
    setForm({ title: n.title, body: n.body, pinned: n.pinned, email: false });
    // The form sits above the list: bring it into view so the change is obvious, then focus it.
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 300);
  }

  async function togglePin(n: Notice) {
    const { error } = await supabase.from('notices').update({ pinned: !n.pinned }).eq('id', n.id);
    if (error) toast.error(error.message);
    else load();
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <form ref={formRef} onSubmit={save} className={`scroll-mt-24 rounded-lg bg-white p-4 shadow sm:p-6 ${editing ? 'ring-2 ring-yellow-400' : ''}`}>
        <h3 className="mb-4 font-semibold text-gray-900">{editing ? `Editing: ${editing.title}` : 'Post a notice to members'}</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="n-title" className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input id="n-title" ref={titleRef} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="n-body" className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea id="n-body" required rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={input} />
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to the top
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.email} onChange={(e) => setForm({ ...form, email: e.target.checked })} /> Also email all members
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-md px-4 py-2 text-sm ring-1 ring-gray-300">
              Cancel
            </button>
          )}
          <button type="submit" disabled={busy} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Saving…' : editing ? 'Save notice' : 'Post notice'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="h-32 animate-pulse rounded bg-gray-200" />
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
          {notices.map((n) => (
            <li key={n.id} className="px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {n.pinned && <span className="mr-2 rounded bg-yellow-100 px-1.5 text-xs text-yellow-800">Pinned</span>}
                    {n.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString('en-GB')}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button type="button" onClick={() => togglePin(n)} className="text-gray-700 hover:text-black">{n.pinned ? 'Unpin' : 'Pin'}</button>
                  <button type="button" onClick={() => startEdit(n)} className="text-blue-600 hover:text-blue-900">
                    Edit
                  </button>
                  <button type="button" onClick={() => setToDelete(n)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {notices.length === 0 && <li className="px-6 py-8 text-center text-gray-500">No notices yet.</li>}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Delete "${toDelete.title}"?`}
          message="Members won't see it any more. Emails already sent stay in their inboxes."
          confirmLabel="Delete notice"
          danger
          busy={busy}
          onConfirm={remove}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
