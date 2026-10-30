'use client';

import { refreshSite } from '@/lib/refresh';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast, { Toaster } from 'react-hot-toast';

const FIELDS = [
  { key: 'team_url_vanguards', label: 'Vanguards team page', hint: 'Leave empty to use the built-in 2026 link. Official page on czechcricket.cz, e.g. https://www.czechcricket.cz/team/…' },
  { key: 'team_url_mobilizers', label: 'Mobilizers team page', hint: '' },
  { key: 'team_url_strikers', label: 'Strikers team page', hint: '' },
  { key: 'welfare_officer_name', label: 'Welfare officer name', hint: 'Shown on the Safeguarding page. Leave empty to point people to the committee.' },
  { key: 'welfare_officer_email', label: 'Welfare officer email', hint: 'Leave empty to use the club email.' },
  { key: 'youtube_channel', label: 'YouTube channel', hint: 'Channel link or @handle. Used for the live player and Spartans TV.' },
  // Club email and social links are fixed in src/lib/club.ts: search engines need the same values everywhere.
  { key: 'gallery_folder', label: 'Photo gallery folder (Google Drive)', hint: 'Link to the main Drive folder, shared as "Anyone with the link can view". Sub-folders become gallery sections and albums.' },
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
    else {
      toast.success('Settings saved and published.');
      refreshSite();
    }
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
