'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import type { Availability, DirectoryEntry, Match, Notice, Player, Practice, PracticeRsvp, Profile } from '@/types/supabase';
import { dateParts, formatDivision, formatTime, slugify, titleCase } from '@/lib/format';
import { CRICHEROES_HELP, isCricHeroesProfile } from '@/lib/auth';
import { uploadImage } from '@/components/admin/PhotoUpload';
import Avatar from '@/components/ui/Avatar';
import { ArrowRight, ArrowUpRight, Check } from '@/components/ui/Icons';

type Tab = 'matches' | 'practices' | 'notices' | 'profile';
const TABS: { id: Tab; label: string }[] = [
  { id: 'matches', label: 'Matches' },
  { id: 'practices', label: 'Practices' },
  { id: 'notices', label: 'Notices' },
  { id: 'profile', label: 'My profile' },
];

const todayInPrague = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());

function Shell({ title, eyebrow, children }: { title: React.ReactNode; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="py-12 sm:py-16">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', borderRadius: 0 } }} />
      <div className="container-x">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-3 text-[clamp(40px,6vw,72px)]">{title}</h1>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

// CricHeroes link form: shown before anything else when a member hasn't given one.
function CricHeroesForm({ current, onSaved }: { current: string | null; onSaved: (url: string) => void }) {
  const supabase = createClientComponentClient();
  const [url, setUrl] = useState(current ?? '');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isCricHeroesProfile(url)) {
      toast.error('That doesn’t look like a CricHeroes player profile link');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('update_my_cricheroes', { p_url: url.trim() });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success('CricHeroes profile saved');
      onSaved(url.trim());
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="ch-url" className="field-label">
          CricHeroes profile link
        </label>
        <input
          id="ch-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://cricheroes.com/player-profile/…"
          className="field"
        />
        <p className="mt-2 text-[14px] text-faint">{CRICHEROES_HELP}</p>
      </div>
      <button type="submit" disabled={busy} className="btn btn-gold sm:mb-7">
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export default function MemberDashboard() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState(false);
  const [tab, setTab] = useState<Tab>('matches');

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (error) setSetupError(true);
        setProfile(data as Profile | null);
      }
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container-x py-16" role="status" aria-label="Loading your dashboard">
        <div className="skeleton mb-6 h-14 w-80" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || 'Spartan').split(' ')[0];

  if (setupError || !profile) {
    return (
      <Shell eyebrow="Member area" title="Almost ready">
        <div className="card max-w-2xl p-8 text-muted">
          Member accounts are being switched on. Please check back soon, or contact the committee if this persists.
        </div>
      </Shell>
    );
  }

  if (!profile.cricheroes_url) {
    return (
      <Shell eyebrow="One more step" title={<>Add your CricHeroes</>}>
        <div className="card max-w-2xl p-6 sm:p-8">
          <p className="mb-6 text-sand">
            We use CricHeroes for scoring and stats, so every member needs their CricHeroes player profile on file. It also lets us show
            your stats on your player page.
          </p>
          <CricHeroesForm current={null} onSaved={(url) => setProfile({ ...profile, cricheroes_url: url })} />
        </div>
      </Shell>
    );
  }

  if (profile.status !== 'approved') {
    return (
      <Shell eyebrow="Member area" title={<>Hi {firstName}</>}>
        <div className="card max-w-2xl p-6 sm:p-8">
          {profile.status === 'pending' ? (
            <>
              <p className="h-sub text-[28px]">Waiting for approval</p>
              <p className="mt-3 text-sand">
                Thanks for registering. A committee member will check your details and approve your membership, usually within a few days.
                Your member dashboard opens up as soon as you&apos;re approved.
              </p>
            </>
          ) : (
            <>
              <p className="h-sub text-[28px]">Membership not approved</p>
              <p className="mt-3 text-sand">
                Your registration wasn&apos;t approved. If you think this is a mistake, please{' '}
                <a href="mailto:praguespartanscc@gmail.com" className="text-gold hover:text-gold-hi">
                  contact the committee
                </a>
                .
              </p>
            </>
          )}
          <p className="mt-6 text-[14px] text-faint">
            CricHeroes profile on file:{' '}
            <a href={profile.cricheroes_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-hi">
              view
            </a>
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Member dashboard" title={<>Hi {firstName}</>}>
      <nav aria-label="Dashboard sections" className="-mt-2 mb-8 flex gap-1 overflow-x-auto border-b border-cream/12">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`relative shrink-0 px-4 py-3 font-display text-[18px] font-bold uppercase tracking-[0.06em] transition-colors ${
              tab === t.id ? 'text-cream' : 'text-faint hover:text-cream'
            }`}
          >
            {t.label}
            <span className={`absolute inset-x-4 bottom-0 h-[3px] bg-gold transition-transform ${tab === t.id ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
        ))}
      </nav>
      <div key={tab} className="page-enter">
        {tab === 'matches' && <MatchesTab userId={profile.id} />}
        {tab === 'practices' && <PracticesTab userId={profile.id} />}
        {tab === 'notices' && <NoticesTab />}
        {tab === 'profile' && <ProfileTab profile={profile} onProfile={setProfile} />}
      </div>
    </Shell>
  );
}

// Names of approved members for availability lists.
function useDirectory() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    supabase.rpc('member_directory').then(({ data }) => {
      setNames(new Map(((data ?? []) as DirectoryEntry[]).map((d) => [d.id, d.full_name])));
    });
  }, [supabase]);
  return names;
}

const AVAIL = [
  { status: 'yes', label: 'Available', active: 'bg-gold text-ink' },
  { status: 'maybe', label: 'Maybe', active: 'bg-cream text-ink' },
  { status: 'no', label: 'Not available', active: 'bg-crimson text-white' },
] as const;

function MatchesTab({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const names = useDirectory();
  const [matches, setMatches] = useState<Match[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const today = todayInPrague();
    const [{ data: m }, { data: a }] = await Promise.all([
      supabase.from('matches').select('*').gte('date', today).eq('result', 'will be played').order('date').limit(12),
      supabase.from('match_availability').select('*'),
    ]);
    setMatches((m ?? []) as Match[]);
    setAvailability((a ?? []) as Availability[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function answer(matchId: number, status: Availability['status']) {
    const mine = availability.find((x) => x.match_id === matchId && x.user_id === userId);
    const note = mine?.note ?? null;
    setAvailability((list) => [
      ...list.filter((x) => !(x.match_id === matchId && x.user_id === userId)),
      { id: mine?.id ?? -1, match_id: matchId, user_id: userId, status, note },
    ]);
    const { error } = await supabase
      .from('match_availability')
      .upsert({ match_id: matchId, user_id: userId, status, note, updated_at: new Date().toISOString() }, { onConflict: 'match_id,user_id' });
    if (error) {
      toast.error('Could not save your availability');
      load();
    }
  }

  if (loading) return <div className="skeleton h-64" />;
  if (matches.length === 0) return <p className="card p-6 text-muted">No upcoming matches yet. They&apos;ll appear here as soon as fixtures are added.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {matches.map((m) => {
        const d = dateParts(m.date);
        const forMatch = availability.filter((x) => x.match_id === m.id);
        const mine = forMatch.find((x) => x.user_id === userId);
        const counts = { yes: 0, maybe: 0, no: 0 };
        forMatch.forEach((x) => counts[x.status]++);
        return (
          <li key={m.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-5">
                <div className="w-14 shrink-0 text-center uppercase leading-none">
                  <div className="font-varsity text-[34px] text-gold">{d.day}</div>
                  <div className="mt-1.5 font-display text-[12px] font-semibold tracking-[0.16em] text-faint">
                    {d.month} · {d.weekday}
                  </div>
                </div>
                <div>
                  <Link href={`/fixtures/${m.id}`} className="h-sub text-[24px] hover:text-gold">
                    {m.team1} <span className="text-dim">vs</span> {m.team2}
                  </Link>
                  <p className="mt-1 text-[14px] text-muted">
                    {[formatTime(m.time), m.venue, titleCase(m.type), formatDivision(m.division)].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div role="group" aria-label="Your availability" className="flex flex-wrap gap-2">
                {AVAIL.map((o) => (
                  <button
                    key={o.status}
                    type="button"
                    aria-pressed={mine?.status === o.status}
                    onClick={() => answer(m.id, o.status)}
                    className={`chip min-h-10 px-4 text-[15px] transition-colors ${
                      mine?.status === o.status ? o.active : 'border border-cream/25 text-cream hover:border-cream/60'
                    }`}
                  >
                    {mine?.status === o.status && <Check size={14} />} {o.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(open === m.id ? null : m.id)}
              aria-expanded={open === m.id}
              className="mt-4 text-[14px] text-faint hover:text-cream"
            >
              {counts.yes} available · {counts.maybe} maybe · {counts.no} out {open === m.id ? '▲' : '▼'}
            </button>
            {open === m.id && (
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {AVAIL.map((o) => (
                  <div key={o.status}>
                    <p className="eyebrow mb-2">{o.label}</p>
                    <ul className="text-[15px] text-sand">
                      {forMatch
                        .filter((x) => x.status === o.status)
                        .map((x) => (
                          <li key={x.user_id}>{names.get(x.user_id) ?? 'Member'}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PracticesTab({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const names = useDirectory();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [rsvps, setRsvps] = useState<PracticeRsvp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('practices').select('*').gte('date', todayInPrague()).order('date').limit(12),
      supabase.from('practice_rsvps').select('*'),
    ]);
    setPractices((p ?? []) as Practice[]);
    setRsvps((r ?? []) as PracticeRsvp[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function answer(practiceId: number, status: PracticeRsvp['status']) {
    setRsvps((list) => [
      ...list.filter((x) => !(x.practice_id === practiceId && x.user_id === userId)),
      { id: -1, practice_id: practiceId, user_id: userId, status },
    ]);
    const { error } = await supabase
      .from('practice_rsvps')
      .upsert({ practice_id: practiceId, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'practice_id,user_id' });
    if (error) {
      toast.error('Could not save your reply');
      load();
    }
  }

  if (loading) return <div className="skeleton h-64" />;
  if (practices.length === 0) return <p className="card p-6 text-muted">No practice sessions scheduled right now.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {practices.map((p) => {
        const d = dateParts(p.date);
        const going = rsvps.filter((x) => x.practice_id === p.id && x.status === 'yes');
        const mine = rsvps.find((x) => x.practice_id === p.id && x.user_id === userId);
        return (
          <li key={p.id} className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex gap-5">
              <div className="w-14 shrink-0 text-center uppercase leading-none">
                <div className="font-varsity text-[34px] text-gold">{d.day}</div>
                <div className="mt-1.5 font-display text-[12px] font-semibold tracking-[0.16em] text-faint">{d.month}</div>
              </div>
              <div>
                <p className="h-sub text-[22px]">{p.title || `${titleCase(p.type) || 'Regular'} practice`}</p>
                <p className="mt-1 text-[14px] text-muted">
                  {d.weekday} {formatTime(p.time)} {p.venue ? `· ${p.venue}` : ''}
                </p>
                <p className="mt-1 text-[14px] text-faint" title={going.map((g) => names.get(g.user_id) ?? 'Member').join(', ')}>
                  {going.length} coming{going.length ? `: ${going.map((g) => names.get(g.user_id) ?? 'Member').join(', ')}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={mine?.status === 'yes'}
                onClick={() => answer(p.id, 'yes')}
                className={`chip min-h-10 px-4 text-[15px] ${mine?.status === 'yes' ? 'bg-gold text-ink' : 'border border-cream/25 hover:border-cream/60'}`}
              >
                I&apos;m coming
              </button>
              <button
                type="button"
                aria-pressed={mine?.status === 'no'}
                onClick={() => answer(p.id, 'no')}
                className={`chip min-h-10 px-4 text-[15px] ${mine?.status === 'no' ? 'bg-crimson text-white' : 'border border-cream/25 hover:border-cream/60'}`}
              >
                Can&apos;t make it
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NoticesTab() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    supabase
      .from('notices')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setNotices((data ?? []) as Notice[]));
  }, [supabase]);

  if (!notices) return <div className="skeleton h-64" />;
  if (notices.length === 0) return <p className="card p-6 text-muted">No notices from the committee yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {notices.map((n) => (
        <li key={n.id} className={`card p-6 ${n.pinned ? 'border-gold/60' : ''}`}>
          <div className="flex flex-wrap items-center gap-3">
            {n.pinned && <span className="chip bg-gold text-ink">Pinned</span>}
            <span className="text-[14px] text-faint">
              {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h3 className="h-sub mt-2 text-[26px]">{n.title}</h3>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-sand">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}

function ProfileTab({ profile, onProfile }: { profile: Profile; onProfile: (p: Profile) => void }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ photo_url: null as string | null, bio: '', batting_style: '', bowling_style: '', jersey_number: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile.player_id) {
      setLoading(false);
      return;
    }
    supabase
      .from('players')
      .select('*')
      .eq('id', profile.player_id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Player | null;
        setPlayer(p);
        if (p)
          setForm({
            photo_url: p.photo_url ?? null,
            bio: p.bio ?? '',
            batting_style: p.batting_style ?? '',
            bowling_style: p.bowling_style ?? '',
            jersey_number: p.jersey_number != null ? String(p.jersey_number) : '',
          });
        setLoading(false);
      });
  }, [supabase, profile.player_id]);

  async function pickPhoto(file: File) {
    setBusy(true);
    try {
      const url = await uploadImage(supabase, file, { folder: `members/${profile.id}` });
      setForm((f) => ({ ...f, photo_url: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc('update_my_player_profile', {
      p_photo_url: form.photo_url,
      p_bio: form.bio,
      p_batting_style: form.batting_style,
      p_bowling_style: form.bowling_style,
      p_jersey_number: form.jersey_number ? Number.parseInt(form.jersey_number, 10) : null,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success('Profile saved. It shows on the website within a minute.');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card p-6 sm:p-8">
        {loading ? (
          <div className="skeleton h-64" />
        ) : !player ? (
          <>
            <p className="h-sub text-[26px]">Player profile not linked yet</p>
            <p className="mt-3 text-sand">
              Once a committee member links your account to your player profile, you&apos;ll be able to add your photo, bio and playing style
              here.
            </p>
          </>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar name={player.name} src={form.photo_url} size={96} tone="gold" />
              <div className="flex flex-col gap-2">
                <p className="h-sub text-[26px]">{player.name}</p>
                <label className="btn btn-outline min-h-10 cursor-pointer px-4 text-[15px]">
                  {busy ? 'Uploading…' : form.photo_url ? 'Change photo' : 'Add photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="p-bat" className="field-label">Batting style</label>
                <input id="p-bat" className="field" value={form.batting_style} placeholder="Right-hand bat" onChange={(e) => setForm({ ...form, batting_style: e.target.value })} />
              </div>
              <div>
                <label htmlFor="p-bowl" className="field-label">Bowling style</label>
                <input id="p-bowl" className="field" value={form.bowling_style} placeholder="Right-arm medium" onChange={(e) => setForm({ ...form, bowling_style: e.target.value })} />
              </div>
              <div>
                <label htmlFor="p-num" className="field-label">Shirt number</label>
                <input id="p-num" type="number" min="0" max="999" className="field" value={form.jersey_number} onChange={(e) => setForm({ ...form, jersey_number: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="p-bio" className="field-label">About you</label>
              <textarea id="p-bio" rows={4} className="field" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="btn btn-gold">
                {busy ? 'Saving…' : 'Save profile'}
              </button>
              <Link href={`/players/${slugify(player.name)}`} className="btn btn-outline">
                View public profile <ArrowRight size={16} className="btn-arrow" />
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="card h-fit p-6">
        <p className="eyebrow mb-3">CricHeroes</p>
        <a href={profile.cricheroes_url ?? '#'} target="_blank" rel="noopener noreferrer" className="link-arrow mb-5 break-all text-[16px]">
          Your CricHeroes profile <ArrowUpRight size={16} />
        </a>
        <CricHeroesForm current={profile.cricheroes_url} onSaved={(url) => onProfile({ ...profile, cricheroes_url: url })} />
      </div>
    </div>
  );
}
