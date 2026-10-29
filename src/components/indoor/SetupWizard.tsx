'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import type { EventData, IndoorEvent, MatchSetup, Player, TeamIndex } from '@/lib/indoor/engine';
import type { IndoorRules } from '@/lib/indoor/rules';
import { cloneRules, normaliseZones } from '@/lib/indoor/rules';
import { PRESETS, presetById } from '@/lib/indoor/presets';
import { loadLocal, newId, newSlug, saveLocal } from '@/lib/indoor/store';
import type { LocalMatch } from '@/lib/indoor/store';
import { fetchMatch } from '@/lib/indoor/sync';
import RulesEditor, { ConfirmButton } from './RulesEditor';
import { rulesSummary } from './Scorer';
import { ArrowLeft, ArrowRight, Close } from '@/components/ui/Icons';

const STEPS = ['Teams', 'Rules', 'Start'] as const;
const OVERS = [5, 6, 8, 10, 12, 15];
const LAST_RULES = 'indoor:lastRules';

const todayInPrague = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());

function loadLastRules(): IndoorRules | null {
  try {
    const raw = localStorage.getItem(LAST_RULES);
    if (!raw) return null;
    const r = JSON.parse(raw) as IndoorRules;
    return { ...r, zones: normaliseZones(r.zones) };
  } catch {
    return null;
  }
}

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [squads, setSquads] = useState<[Player[], Player[]]>([[], []]);
  const [base, setBase] = useState<IndoorRules>(() => presetById('league')); // the preset picked
  const [rules, setRules] = useState<IndoorRules>(() => presetById('league'));
  const [customise, setCustomise] = useState(false);
  const [last, setLast] = useState<IndoorRules | null>(null);
  const [tossWinner, setTossWinner] = useState<TeamIndex | null>(null);
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [openers, setOpeners] = useState<[string | null, string | null]>([null, null]);
  const [bowler, setBowler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // "Same teams again": /score/new?from=<match id> copies teams, squads and rules.
  useEffect(() => {
    setLast(loadLastRules());
    const from = new URLSearchParams(window.location.search).get('from');
    if (!from) return;
    const fill = (setup: MatchSetup) => {
      setNames([setup.teams[0].name, setup.teams[1].name]);
      setSquads([setup.teams[0].players, setup.teams[1].players]);
      const r = { ...cloneRules(setup.rules), zones: normaliseZones(setup.rules.zones) };
      setBase(r);
      setRules(r);
    };
    const local = loadLocal(from);
    if (local) return fill(local.match.setup);
    fetchMatch(createClientComponentClient(), from)
      .then((m) => m && fill(m.match.setup))
      .catch(() => {});
  }, []);

  const teamName = (t: TeamIndex) => names[t].trim() || (t === 0 ? 'Team A' : 'Team B');
  const battingFirst: TeamIndex | null = tossWinner == null ? null : tossChoice === 'bat' ? tossWinner : tossWinner === 0 ? 1 : 0;
  const batSide = battingFirst == null ? [] : squads[battingFirst];
  const bowlSide = battingFirst == null ? [] : squads[battingFirst === 0 ? 1 : 0];
  // Choices left over from a different toss or squad simply fall back to the batting order.
  const pickedStriker = openers[0] && batSide.some((p) => p.id === openers[0]) ? openers[0] : null;
  const striker = pickedStriker ?? batSide[0]?.id ?? null;
  const pickedNon = openers[1] && openers[1] !== striker && batSide.some((p) => p.id === openers[1]) ? openers[1] : null;
  const nonStriker = pickedNon ?? batSide.find((p) => p.id !== striker)?.id ?? null;
  const firstBowler = bowler && bowlSide.some((p) => p.id === bowler) ? bowler : null;

  const problems = useMemo(() => {
    const out: string[] = [];
    if (names[0].trim() && names[0].trim().toLowerCase() === names[1].trim().toLowerCase()) out.push('The two teams need different names.');
    squads.forEach((s, i) => {
      if (s.length < 2) out.push(`${teamName(i as TeamIndex)} needs at least 2 players.`);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, squads]);

  const short = squads.map((s) => s.length < rules.match.minPlayers);

  function go(to: number) {
    if (to > 0 && step === 0 && problems.length) {
      toast.error(problems[0]);
      return;
    }
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  function startOver() {
    setStep(0);
    setNames(['', '']);
    setSquads([[], []]);
    setBase(presetById('league'));
    setRules(presetById('league'));
    setCustomise(false);
    setTossWinner(null);
    setTossChoice('bat');
    setOpeners([null, null]);
    setBowler(null);
    window.scrollTo({ top: 0 });
  }

  function pickPreset(p: IndoorRules) {
    const r = { ...cloneRules(p), zones: normaliseZones(p.zones) };
    setBase(r);
    setRules(r);
  }

  async function start() {
    if (battingFirst == null) return void toast.error('Pick who won the toss.');
    if (problems.length || !striker || !nonStriker || striker === nonStriker || !firstBowler) return void toast.error('Pick two opening batters and a bowler.');
    setBusy(true);
    try {
      const setup: MatchSetup = {
        teams: [
          { name: teamName(0), players: squads[0] },
          { name: teamName(1), players: squads[1] },
        ],
        battingFirst,
        rules: { ...cloneRules(rules), zones: normaliseZones(rules.zones) },
      };
      const data: EventData[] = [
        { type: 'openers', data: { strikerId: striker, nonStrikerId: nonStriker } },
        { type: 'overStart', data: { bowlerId: firstBowler } },
      ];
      const events = data.map((d, i) => ({ id: newId(), seq: i + 1, ...d }) as IndoorEvent);
      const id = newId();
      const lm: LocalMatch = {
        match: { id, team_a: setup.teams[0].name, team_b: setup.teams[1].name, setup, summary: null, status: 'live', share_slug: newSlug(), played_on: todayInPrague() },
        events,
        pending: events.map((e) => e.id),
        matchPending: true,
      };
      try {
        localStorage.setItem(LAST_RULES, JSON.stringify({ ...setup.rules, presetId: 'last', name: 'My last rules' }));
      } catch {
        // storage blocked: the match still starts
      }
      if (!saveLocal(lm)) toast('This phone could not save a copy. Keep the screen open until it says Synced.');
      router.push(`/score/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/score" className="-ml-2 grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Back to my matches">
          <ArrowLeft size={22} />
        </Link>
        <p className="eyebrow">New indoor match</p>
        <ConfirmButton label="Start over" confirm="Tap again" onConfirm={startOver} />
      </div>

      <ol className="mt-4 grid grid-cols-3 gap-1" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => i < step && go(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined} className="w-full text-left">
              <span className={`block h-1 ${i <= step ? 'bg-gold' : 'bg-cream/15'}`} />
              <span className={`mt-1.5 block font-display text-xs font-bold uppercase italic ${i === step ? 'text-cream' : 'text-faint'}`}>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div key={step} className="page-enter mt-8">
        {step === 0 && (
          <section className="space-y-6">
            <h1 className="h-sub text-3xl">Who is playing?</h1>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((t) => (
                <div key={t}>
                  <label htmlFor={`team-${t}`} className="field-label">
                    {t === 0 ? 'First team' : 'Second team'}
                  </label>
                  <input
                    id={`team-${t}`}
                    className="field"
                    maxLength={40}
                    placeholder={t === 0 ? 'Team A' : 'Team B'}
                    value={names[t]}
                    onChange={(e) => setNames((n) => (t === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
                  />
                </div>
              ))}
            </div>
            <Squads names={[teamName(0), teamName(1)]} squads={squads} setSquads={setSquads} minPlayers={rules.match.minPlayers} />
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <h1 className="h-sub text-3xl">Rules for today</h1>
            <div>
              <p className="field-label">Start from</p>
              <div className="flex flex-wrap gap-2">
                {[...PRESETS, ...(last ? [last] : [])].map((p) => (
                  <button
                    key={p.presetId}
                    type="button"
                    aria-pressed={base.presetId === p.presetId}
                    onClick={() => pickPreset(p)}
                    className={`min-h-11 px-4 font-semibold ${base.presetId === p.presetId ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">Overs per innings</p>
              <div className="flex flex-wrap items-center gap-2">
                {OVERS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={rules.match.oversPerInnings === o}
                    onClick={() => setRules({ ...rules, match: { ...rules.match, oversPerInnings: o } })}
                    className={`h-12 w-12 font-varsity text-lg ${rules.match.oversPerInnings === o ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
                  >
                    {o}
                  </button>
                ))}
                <OversInput value={rules.match.oversPerInnings} onChange={(v) => setRules({ ...rules, match: { ...rules.match, oversPerInnings: v } })} />
              </div>
            </div>
            {customise ? (
              <RulesEditor rules={rules} onChange={setRules} base={base} />
            ) : (
              <div className="card p-4">
                <ul className="space-y-1 text-sm text-sand">
                  {rulesSummary(rules).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => setCustomise(true)} className="btn btn-outline mt-4 w-full">
                  Customise rules
                </button>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <h1 className="h-sub text-3xl">Toss and openers</h1>
            <div>
              <p className="field-label">Who won the toss?</p>
              <div className="grid grid-cols-2 gap-2">
                {([0, 1] as TeamIndex[]).map((t) => (
                  <Big key={t} on={tossWinner === t} onClick={() => setTossWinner(t)}>
                    {teamName(t)}
                  </Big>
                ))}
              </div>
            </div>
            {tossWinner != null && (
              <div>
                <p className="field-label">They chose to</p>
                <div className="grid grid-cols-2 gap-2">
                  <Big on={tossChoice === 'bat'} onClick={() => setTossChoice('bat')}>
                    Bat
                  </Big>
                  <Big on={tossChoice === 'bowl'} onClick={() => setTossChoice('bowl')}>
                    Bowl
                  </Big>
                </div>
              </div>
            )}
            {battingFirst != null && (
              <>
                <PickList title={`On strike for ${teamName(battingFirst)}`} players={batSide} value={striker} onPick={(id) => setOpeners([id, id === nonStriker ? striker : nonStriker])} />
                <PickList title="At the other end" players={batSide} value={nonStriker} onPick={(id) => setOpeners([id === striker ? nonStriker : striker, id])} />
                <PickList title={`Opening bowler for ${teamName(battingFirst === 0 ? 1 : 0)}`} players={bowlSide} value={firstBowler} onPick={setBowler} />
                {short.some(Boolean) && <p className="text-gold">A side has fewer than {rules.match.minPlayers} players. You can still start.</p>}
              </>
            )}
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream/12 bg-ink/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-3">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="btn btn-outline btn-lg">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn btn-gold btn-lg flex-1">
              Next
              <ArrowRight size={18} className="btn-arrow" />
            </button>
          ) : (
            <button type="button" onClick={start} disabled={busy} className="btn btn-gold btn-lg flex-1">
              Start the match
              <ArrowRight size={18} className="btn-arrow" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Any number of overs: free typing, settled to 1 to 50 when the field is left.
function OversInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const settle = () => {
    const v = Math.max(1, Math.min(50, Math.round(Number(text)) || value));
    setText(String(v));
    if (v !== value) onChange(v);
  };
  return (
    <label className="flex items-center gap-2 text-muted">
      or
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={50}
        aria-label="Any number of overs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (Number.isInteger(v) && v >= 1 && v <= 50) onChange(v);
        }}
        onBlur={settle}
        className="field h-12 w-20 text-center"
      />
    </label>
  );
}

function Big({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`min-h-14 px-3 font-display text-lg font-bold uppercase italic ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}>
      {children}
    </button>
  );
}

function PickList({ title, players, value, onPick }: { title: string; players: Player[]; value: string | null; onPick: (id: string) => void }) {
  return (
    <div>
      <p className="field-label">{title}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onPick(p.id)} className={`min-h-11 px-4 ${value === p.id ? 'bg-gold font-semibold text-ink' : 'border border-cream/22 text-cream'}`}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

type ClubPlayer = { id: string; name: string };

// Names can come from the club's player list or be typed. Either way the match keeps a
// plain copy of the name: indoor stats never touch the website's player records.
function Squads({ names, squads, setSquads, minPlayers }: { names: [string, string]; squads: [Player[], Player[]]; setSquads: (s: [Player[], Player[]]) => void; minPlayers: number }) {
  const [team, setTeam] = useState<TeamIndex>(0);
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [club, setClub] = useState<ClubPlayer[]>([]);

  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase
      .from('players')
      .select('id, name, is_active')
      .order('name')
      .then(({ data }) => setClub(((data ?? []) as (ClubPlayer & { is_active?: boolean | null })[]).filter((p) => p.is_active !== false)));
  }, []);

  const taken = new Set([...squads[0], ...squads[1]].map((p) => p.name.trim().toLowerCase()));
  const list = squads[team];
  const update = (next: Player[]) => setSquads(team === 0 ? [next, squads[1]] : [squads[0], next]);

  function addName(name: string) {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return;
    if (taken.has(n.toLowerCase())) {
      toast.error(`${n} is already in a squad`);
      return;
    }
    update([...list, { id: newId(), name: n.slice(0, 40) }]);
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const matches = club.filter((p) => !taken.has(p.name.trim().toLowerCase()) && p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 24);

  return (
    <section className="space-y-5">
      <h2 className="h-sub text-2xl">Squads</h2>
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {([0, 1] as TeamIndex[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={team === t}
            onClick={() => setTeam(t)}
            className={`min-h-12 truncate px-3 font-display font-bold uppercase italic ${team === t ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
          >
            {names[t]} ({squads[t].length})
          </button>
        ))}
      </div>

      <div>
        <p className="field-label">Batting order</p>
        {list.length === 0 ? (
          <p className="border border-dashed border-cream/22 p-4 text-muted">No players yet. Add names below.</p>
        ) : (
          <ol className="divide-y divide-cream/10 border border-cream/12">
            {list.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 py-1 pl-3 pr-1">
                <span className="w-6 font-varsity text-gold">{i + 1}</span>
                <span className="flex-1 truncate text-cream">{p.name}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.name} up`} className="grid h-11 w-11 place-items-center text-muted disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${p.name} down`} className="grid h-11 w-11 place-items-center text-muted disabled:opacity-30">
                  ↓
                </button>
                <button type="button" onClick={() => update(list.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`} className="grid h-11 w-11 place-items-center text-muted hover:text-cream">
                  <Close size={18} />
                </button>
              </li>
            ))}
          </ol>
        )}
        {list.length > 0 && list.length < minPlayers && <p className="mt-2 text-sm text-gold">These rules expect at least {minPlayers} players.</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addName(typed);
          setTyped('');
        }}
        className="flex gap-2"
      >
        <label htmlFor="add-name" className="sr-only">
          Add a name
        </label>
        <input id="add-name" className="field flex-1" placeholder="Add a name" value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={40} autoComplete="off" />
        <button type="submit" className="btn btn-gold">
          Add
        </button>
      </form>

      {club.length > 0 && (
        <div>
          <label htmlFor="club-search" className="field-label">
            Or pick from the club&apos;s players
          </label>
          <input id="club-search" className="field" placeholder="Search names" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          <div className="mt-3 flex flex-wrap gap-2">
            {matches.map((p) => (
              <button key={p.id} type="button" onClick={() => addName(p.name)} className="min-h-11 border border-cream/22 px-3 text-cream hover:border-gold">
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
