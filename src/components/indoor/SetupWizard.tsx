'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import type { EventData, IndoorEvent, MatchSetup, Player, TeamIndex } from '@/lib/indoor/engine';
import type { IndoorRules } from '@/lib/indoor/rules';
import { cloneRules } from '@/lib/indoor/rules';
import { PRESETS, presetById } from '@/lib/indoor/presets';
import { newId, newSlug, saveLocal } from '@/lib/indoor/store';
import type { LocalMatch } from '@/lib/indoor/store';
import RulesEditor from './RulesEditor';
import { ArrowLeft, ArrowRight, Close } from '@/components/ui/Icons';

const STEPS = ['Teams', 'Squads', 'Rules', 'Toss', 'Start'] as const;
const OVERS = [5, 6, 10, 12, 15];
const LAST_RULES = 'indoor:lastRules';

const todayInPrague = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());

function loadLastRules(): IndoorRules | null {
  try {
    const raw = localStorage.getItem(LAST_RULES);
    return raw ? (JSON.parse(raw) as IndoorRules) : null;
  } catch {
    return null;
  }
}

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [squads, setSquads] = useState<[Player[], Player[]]>([[], []]);
  const [rules, setRules] = useState<IndoorRules>(() => presetById('league'));
  const [last, setLast] = useState<IndoorRules | null>(null);
  const [tossWinner, setTossWinner] = useState<TeamIndex | null>(null);
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [openers, setOpeners] = useState<[string | null, string | null]>([null, null]);
  const [bowler, setBowler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLast(loadLastRules()), []);

  const teamName = (t: TeamIndex) => names[t].trim() || (t === 0 ? 'Team A' : 'Team B');
  const battingFirst: TeamIndex = tossWinner == null ? 0 : tossChoice === 'bat' ? tossWinner : tossWinner === 0 ? 1 : 0;
  const batSide = squads[battingFirst];
  const bowlSide = squads[battingFirst === 0 ? 1 : 0];
  const striker = openers[0] ?? batSide[0]?.id ?? null;
  const nonStriker = openers[1] ?? batSide.find((p) => p.id !== striker)?.id ?? null;

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
    if (to > 1 && step <= 1 && problems.length) {
      toast.error(problems[0]);
      return;
    }
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  async function start() {
    if (problems.length || !striker || !nonStriker || striker === nonStriker || !bowler) {
      toast.error('Pick two opening batters and a bowler.');
      return;
    }
    setBusy(true);
    const setup: MatchSetup = {
      teams: [
        { name: teamName(0), players: squads[0] },
        { name: teamName(1), players: squads[1] },
      ],
      battingFirst,
      rules: cloneRules(rules),
    };
    const data: EventData[] = [
      { type: 'openers', data: { strikerId: striker, nonStrikerId: nonStriker } },
      { type: 'overStart', data: { bowlerId: bowler } },
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
      localStorage.setItem(LAST_RULES, JSON.stringify({ ...rules, presetId: 'last', name: 'My last rules' }));
    } catch {
      // storage blocked: the match still starts
    }
    if (!saveLocal(lm)) toast('This phone could not save a copy. Keep the screen open until it says Synced.');
    router.push(`/score/${id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/score" className="-ml-2 grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Back to my matches">
          <ArrowLeft size={22} />
        </Link>
        <p className="eyebrow">New indoor match</p>
        <span className="w-11" />
      </div>

      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Steps">
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
          <section className="space-y-5">
            <h1 className="h-sub text-3xl">Who is playing?</h1>
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
          </section>
        )}

        {step === 1 && <Squads names={[teamName(0), teamName(1)]} squads={squads} setSquads={setSquads} minPlayers={rules.match.minPlayers} />}

        {step === 2 && (
          <section className="space-y-5">
            <h1 className="h-sub text-3xl">Rules for today</h1>
            <div>
              <p className="field-label">Start from</p>
              <div className="flex flex-wrap gap-2">
                {[...PRESETS, ...(last ? [last] : [])].map((p) => (
                  <button
                    key={p.presetId}
                    type="button"
                    aria-pressed={rules.presetId === p.presetId}
                    onClick={() => setRules({ ...cloneRules(p), match: { ...p.match } })}
                    className={`min-h-11 px-4 font-semibold ${rules.presetId === p.presetId ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
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
                <label className="flex items-center gap-2 text-muted">
                  or
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    aria-label="Any number of overs"
                    value={rules.match.oversPerInnings}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                      setRules({ ...rules, match: { ...rules.match, oversPerInnings: v } });
                    }}
                    className="field h-12 w-20 text-center"
                  />
                </label>
              </div>
            </div>
            <RulesEditor rules={rules} onChange={setRules} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <h1 className="h-sub text-3xl">The toss</h1>
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
            <p className="text-sand">
              <strong className="text-cream">{teamName(battingFirst)}</strong> bat first.
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <h1 className="h-sub text-3xl">Openers and bowler</h1>
            <PickList title={`On strike for ${teamName(battingFirst)}`} players={batSide} value={striker} onPick={(id) => setOpeners([id, id === nonStriker ? striker : nonStriker])} />
            <PickList title="At the other end" players={batSide} value={nonStriker} onPick={(id) => setOpeners([id === striker ? nonStriker : striker, id])} />
            <PickList title={`Opening bowler for ${teamName(battingFirst === 0 ? 1 : 0)}`} players={bowlSide} value={bowler} onPick={setBowler} />
            <div className="card p-4 text-sand">
              <p>
                {rules.name}, {rules.match.oversPerInnings} overs. Wicket {rules.wickets.penalty > 0 ? `minus ${rules.wickets.penalty}` : 'no penalty'}.{' '}
                {rules.batting.retireAt != null ? `Retire at ${rules.batting.retireAt}.` : 'No retirement.'}{' '}
                {rules.extras.rebowl === 'finalOver' ? 'Wides and no balls are bowled again in the final over.' : rules.extras.rebowl === 'always' ? 'Wides and no balls are always bowled again.' : 'Wides and no balls always count as a ball.'}
              </p>
              {short.some(Boolean) && <p className="mt-2 text-gold">A side has fewer than {rules.match.minPlayers} players. You can still start.</p>}
            </div>
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
      <h1 className="h-sub text-3xl">Squads</h1>
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
