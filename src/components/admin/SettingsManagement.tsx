'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

const FIELDS = [
  { key: 'cricheroes_vanguards', label: 'Vanguards on CricHeroes', hint: 'Team page link, e.g. https://cricheroes.com/team-profile/…' },
  { key: 'cricheroes_mobilizers', label: 'Mobilizers on CricHeroes', hint: '' },
  { key: 'cricheroes_strikers', label: 'Strikers on CricHeroes', hint: '' },
  { key: 'youtube_channel', label: 'YouTube channel', hint: 'Channel link or @handle. Used for the live player and Spartans TV.' },
  { key: 'gallery_folder', label: 'Photo gallery folder (Google Drive)', hint: 'Link to the main Drive folder, shared as "Anyone with the link can view". Sub-folders become gallery sections and albums.' },
  { key: 'club_email', label: 'Club email', hint: '' },
  { key: 'instagram_url', label: 'Instagram', hint: '' },
  { key: 'facebook_url', label: 'Facebook', hint: '' },
];

const input = 'block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-black focus:ring-black';

export default function SettingsManagement() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .then(({ data, error }) => {
        if (error) setMissing(true);
        setValues(Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ''])));
        setLoading(false);
      });
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const rows = FIELDS.map((f) => ({ key: f.key, value: values[f.key]?.trim() || null, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('site_settings').upsert(rows);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success('Settings saved. The website updates within a minute.');
  }

  if (loading) return <div className="h-40 animate-pulse rounded bg-gray-200" />;
  if (missing) return <p className="text-gray-700">Run <code>supabase/migrations/003_admin.sql</code> in Supabase to enable settings.</p>;

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg bg-white p-4 shadow sm:p-6">
      <Toaster position="top-right" />
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="mb-1 block text-sm font-medium text-gray-700">
            {f.label}
          </label>
          <input id={f.key} value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} className={input} />
          {f.hint && <p className="mt-1 text-xs text-gray-500">{f.hint}</p>}
        </div>
      ))}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
