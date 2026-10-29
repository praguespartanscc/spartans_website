'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';
import type { NewsPost } from '@/types/supabase';
import { slugify } from '@/lib/format';
import PhotoUpload, { removeClubPhoto } from './PhotoUpload';
import ConfirmDialog from './ConfirmDialog';
import { useWriter } from './useWriter';

const EMPTY = { title: '', title_cs: '', category: 'club' as NewsPost['category'], cover_url: null as string | null, body: '', body_cs: '' };

const input = 'block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-black focus:ring-black';
const label = 'mb-1 block text-xs font-medium text-gray-700 sm:text-sm';

// News posts for the public News page. Admins and committee members write, admins delete.
export default function NewsManagement() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const writer = useWriter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<NewsPost | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('news_posts').select('*').order('created_at', { ascending: false });
    if (error) setMissing(true);
    setPosts((data ?? []) as NewsPost[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  function edit(p: NewsPost) {
    setEditing(p);
    setForm({ title: p.title, title_cs: p.title_cs ?? '', category: p.category, cover_url: p.cover_url, body: p.body, body_cs: p.body_cs ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
  }

  // A readable, unique web address from the title, fixed once the post exists.
  function newSlug(title: string) {
    const base = slugify(title).slice(0, 70).replace(/-+$/, '') || 'post';
    const taken = new Set(posts.map((p) => p.slug));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    return slug;
  }

  async function save(status: NewsPost['status']) {
    if (form.title.trim().length < 3) return void toast.error('Give the post a title');
    if (!form.body.trim()) return void toast.error('Write the post first');
    setBusy(true);
    const row = {
      title: form.title.trim(),
      title_cs: form.title_cs.trim() || null,
      category: form.category,
      cover_url: form.cover_url,
      body: form.body.trim(),
      body_cs: form.body_cs.trim() || null,
      status,
    };
    const { error } = editing
      ? await supabase.from('news_posts').update(row).eq('id', editing.id)
      : await supabase.from('news_posts').insert([{ ...row, slug: newSlug(form.title) }]);
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (editing?.cover_url && editing.cover_url !== form.cover_url) await removeClubPhoto(supabase, editing.cover_url);
    toast.success(status === 'published' ? 'Published. It shows on the website within a minute.' : 'Saved as a draft');
    reset();
    load();
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await supabase.from('news_posts').delete().eq('id', toDelete.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    await removeClubPhoto(supabase, toDelete.cover_url);
    toast.success('Post deleted');
    setToDelete(null);
    load();
  }

  if (loading || writer.loading) return <div className="h-40 animate-pulse rounded bg-gray-200" />;
  if (!writer.canWrite) return <p className="text-gray-700">News can be written by admins and committee members.</p>;
  if (missing) return <p className="text-gray-700">News isn&apos;t switched on yet. Run <code>supabase/migrations/14_news_achievements.sql</code> in Supabase first.</p>;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <form onSubmit={(e) => (e.preventDefault(), save('published'))} className="rounded-lg bg-gray-50 p-4 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-black sm:text-lg">{editing ? `Edit "${editing.title}"` : 'Write a post'}</h3>
        <div className="mb-5">
          <PhotoUpload supabase={supabase} folder="news" label="Cover photo" value={form.cover_url} onChange={(url) => set({ cover_url: url })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div>
            <label htmlFor="n-title" className={label}>Title</label>
            <input id="n-title" className={input} value={form.title} maxLength={140} onChange={(e) => set({ title: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="n-cat" className={label}>Type</label>
            <select id="n-cat" className={input} value={form.category} onChange={(e) => set({ category: e.target.value as NewsPost['category'] })}>
              <option value="club">Club news</option>
              <option value="match_report">Match report</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="n-body" className={label}>Post (leave an empty line between paragraphs, links work as they are)</label>
            <textarea id="n-body" rows={10} className={input} value={form.body} onChange={(e) => set({ body: e.target.value })} required />
          </div>
        </div>
        <details className="mt-4 rounded-md border border-gray-200 bg-white p-4" open={!!(form.title_cs || form.body_cs)}>
          <summary className="cursor-pointer text-sm font-medium text-gray-800">Czech version (optional)</summary>
          <p className="mt-2 text-sm text-gray-600">Without it, the Czech page shows the English post with a short note.</p>
          <div className="mt-3 grid gap-4">
            <div>
              <label htmlFor="n-title-cs" className={label}>Czech title</label>
              <input id="n-title-cs" className={input} value={form.title_cs} maxLength={140} onChange={(e) => set({ title_cs: e.target.value })} />
            </div>
            <div>
              <label htmlFor="n-body-cs" className={label}>Czech post</label>
              <textarea id="n-body-cs" rows={8} className={input} value={form.body_cs} onChange={(e) => set({ body_cs: e.target.value })} />
            </div>
          </div>
        </details>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <button type="button" onClick={reset} disabled={busy} className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400">
              Cancel
            </button>
          )}
          <button type="button" onClick={() => save('draft')} disabled={busy} className="rounded-md px-4 py-2 text-sm text-gray-900 ring-1 ring-gray-300 hover:bg-white disabled:opacity-50">
            {editing?.status === 'published' ? 'Unpublish (back to draft)' : 'Save draft'}
          </button>
          <button type="submit" disabled={busy} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
            {busy ? 'Saving…' : editing?.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </form>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-md">
        {posts.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
            {p.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt="" className="h-12 w-20 rounded object-cover" />
            ) : (
              <span className="h-12 w-20 rounded bg-gray-200" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {p.title}
                <span className={`ml-2 rounded px-2 py-0.5 text-xs ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status === 'published' ? 'Published' : 'Draft'}</span>
              </p>
              <p className="text-sm text-gray-500">
                {p.category === 'match_report' ? 'Match report' : 'Club news'} · {new Date(p.published_at ?? p.created_at).toLocaleDateString('en-GB')}
                {p.title_cs ? ' · Czech version' : ''}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              {p.status === 'published' && (
                <a href={`/news/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-black">
                  View
                </a>
              )}
              <button onClick={() => edit(p)} disabled={busy} className="text-blue-600 hover:text-blue-900">
                Edit
              </button>
              {writer.isAdmin && (
                <button onClick={() => setToDelete(p)} disabled={busy} className="text-red-600 hover:text-red-900">
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
        {posts.length === 0 && <li className="px-6 py-8 text-center text-gray-500">No posts yet.</li>}
      </ul>

      {toDelete && (
        <ConfirmDialog
          title={`Delete "${toDelete.title}"?`}
          message="It disappears from the website. This cannot be undone."
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
