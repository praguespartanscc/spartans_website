'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import type { Player } from '@/lib/indoor/engine';
import type { IndoorRules } from '@/lib/indoor/rules';
import { cloneRules, normaliseZones } from '@/lib/indoor/rules';
import { presetById } from '@/lib/indoor/presets';
import { rememberNames } from '@/lib/indoor/names';
import { matchMinutesFor, planTournament, pointsFor } from '@/lib/indoor/plan';
import { formatChoices, suggestFormat } from '@/lib/indoor/schedule';
import { board } from '@/lib/indoor/standings';
import { newId, newSlug } from '@/lib/indoor/store';
import type { Format, Points, Session } from '@/lib/indoor/tournament';
import { cacheTournament, clearDraft, loadDraft, saveDraft } from '@/lib/indoor/tstore';
import { PROBLEM_TEXT, createTournament } from '@/lib/indoor/tsync';
import { ConfirmButton, Stepper, Toggle } from './RulesEditor';
import RulesPicker from './RulesPicker';
import ScheduleEditor, { newSession } from './ScheduleEditor';
import SquadEditor from './SquadEditor';
import { FixtureList } from './TournamentViews';
import { ArrowLeft, ArrowRight, Close } from '@/components/ui/Icons';

const STEPS = ['Name', 'Teams', 'Format', 'Schedule'] as const;

type DraftTeam = { id: string; name: string; squad: Player[] };
type Draft = {
  v: 1;
  step: number;
  name: string;
  base: IndoorRules;
  rules: IndoorRules;
  points: Points | null; // null: follow the rules
  teams: DraftTeam[];
  format: Format | null; // null: the suggestion for this many teams
  sessions: Session[];
  matchMinutes: number | null; // null: worked out from the overs
  gapMinutes: number;
  duty: boolean;
  seed: number;
};

const sameFormat = (a: Format, b: Format) => a.kind === b.kind && a.legs === b.legs && a.groups === b.groups && a.finals === b.finals;

function fresh(): Draft {
  const rules = presetById('league');
  const team = (): DraftTeam => ({ id: newId(), name: '', squad: [] });
  return { v: 1, step: 0, name: '', base: rules, rules, points: null, teams: [team(), team(), team()], format: null, sessions: [newSession()], matchMinutes: null, gapMinutes: 5, duty: false, seed: 1 };
}

export default function TournamentWizard() {
  const router = useRouter();
  const [d, setD] = useState<Draft>(fresh);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [squadTeam, setSquadTeam] = useState(0);

  // Pick up where the organiser left off (a refresh, or the phone went to sleep).
  useEffect(() => {
    const saved = loadDraft<Draft>();
    if (saved?.v === 1 && Array.isArray(saved.teams)) setD({ ...saved, base: { ...saved.base, zones: normaliseZones(saved.base.zones) }, rules: { ...saved.rules, zones: normaliseZones(saved.rules.zones) } });
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) saveDraft(d);
  }, [d, ready]);

  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const step = d.step;
  const teamName = (i: number) => d.teams[i]?.name.trim() || `Team ${i + 1}`;
  const names = d.teams.map((_, i) => teamName(i));
  const n = d.teams.length;
  const choices = useMemo(() => formatChoices(n), [n]);
  const format = d.format && choices.some((c) => sameFormat(c.format, d.format!)) ? { ...d.format } : { ...suggestFormat(n), thirdPlace: false };
  const points = d.points ?? pointsFor(d.rules);
  const matchMinutes = d.matchMinutes ?? matchMinutesFor(d.rules);
  const settings = { format, sessions: d.sessions, matchMinutes, gapMinutes: d.gapMinutes, points, duty: d.duty, seed: d.seed };
  const entrants = d.teams.map((t, i) => ({ id: t.id, seed: i + 1 }));

  const problems = useMemo(() => {
    const out: string[] = [];
    if (n < 2) out.push('A tournament needs at least 2 teams.');
    const seen = new Set<string>();
    names.forEach((nm) => {
      const k = nm.toLowerCase();
      if (seen.has(k)) out.push(`Two teams are called ${nm}. Give them different names.`);
      seen.add(k);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join('|')]);

  // The whole schedule as it would be saved, for the last step.
  const plan = useMemo(() => {
    if (step !== 3 || problems.length) return null;
    let k = 0;
    const p = planTournament({ id: 'preview', slug: 'preview00', name: d.name, rules: d.rules }, d.teams.map((t, i) => ({ id: t.id, name: teamName(i), squad: t.squad })), settings, () => `preview-${(k += 1)}`);
    return { ...p, board: board({ teams: p.teams, fixtures: p.placed.fixtures, matches: [], points, bpo: d.rules.match.ballsPerOver }) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(settings), names.join('|'), problems.length]);

  function go(to: number) {
    if (to > step && step === 0 && !d.name.trim()) return void toast.error('Give the tournament a name.');
    if (to > step && step === 1 && problems.length) return void toast.error(problems[0]);
    set({ step: to });
    window.scrollTo({ top: 0 });
  }

  const moveTeam = (i: number, by: -1 | 1) => {
    const j = i + by;
    if (j < 0 || j >= n) return;
    const next = [...d.teams];
    [next[i], next[j]] = [next[j], next[i]];
    set({ teams: next });
  };

  async function create() {
    if (!d.name.trim() || problems.length) return void toast.error(problems[0] ?? 'Give the tournament a name.');
    if (d.sessions.some((s) => s.end <= s.start)) return void toast.error('A session ends before it starts.');
    setBusy(true);
    try {
      const id = newId();
      const rules = { ...cloneRules(d.rules), zones: normaliseZones(d.rules.zones) };
      const p = planTournament({ id, slug: newSlug(), name: d.name.trim().slice(0, 80), rules }, d.teams.map((t, i) => ({ id: t.id, name: teamName(i).slice(0, 40), squad: t.squad })), settings, newId);
      const data = { tournament: p.tournament, teams: p.teams, fixtures: p.placed.fixtures, matches: [] };
      const res = await createTournament(createClientComponentClient(), data);
      if (!res.ok) return void toast.error(PROBLEM_TEXT[res.problem]);
      cacheTournament(data);
      rememberNames(d.teams.flatMap((t) => t.squad.map((x) => x.name)));
      clearDraft();
      router.push(`/score/t/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/score" className="-ml-2 grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-cream" aria-label="Back to my matches">
          <ArrowLeft size={22} />
        </Link>
        <p className="eyebrow">New tournament</p>
        <ConfirmButton
          label="Start over"
          confirm="Tap again"
          onConfirm={() => {
            clearDraft();
            setD(fresh());
            window.scrollTo({ top: 0 });
          }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Steps">
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
            <h1 className="h-sub text-3xl">Name and rules</h1>
            <div>
              <label htmlFor="t-name" className="field-label">
                Tournament name
              </label>
              <input id="t-name" className="field" maxLength={80} placeholder="Winter Cup 2026" value={d.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" />
            </div>
            <div>
              <p className="mb-3 text-sand">Every game in the tournament is played to the same rules.</p>
              <RulesPicker base={d.base} rules={d.rules} onBase={(r) => set({ base: r })} onRules={(r) => set({ rules: r })} />
            </div>
            <div className="space-y-3 border-t border-cream/12 pt-5">
              <p className="eyebrow">Points for the table</p>
              {(
                [
                  ['win', 'Win'],
                  ['tie', 'Tie'],
                  ['noResult', 'No result'],
                  ['loss', 'Loss'],
                ] as [keyof Points, string][]
              ).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-cream">{label}</span>
                  <Stepper value={points[k]} min={0} max={20} label={`Points for a ${label.toLowerCase()}`} onChange={(v) => set({ points: { ...points, [k]: v } })} />
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h1 className="h-sub text-3xl">Teams</h1>
              <p className="mt-2 text-sand">Any number of teams. The order is the seeding, with the strongest team first. It only matters for groups and knockouts.</p>
            </div>
            <ol className="space-y-2">
              {d.teams.map((t, i) => (
                <li key={t.id} className="flex items-center gap-1">
                  <span className="w-6 shrink-0 font-varsity text-gold">{i + 1}</span>
                  <label htmlFor={`tt-${t.id}`} className="sr-only">
                    Name of team {i + 1}
                  </label>
                  <input
                    id={`tt-${t.id}`}
                    className="field min-w-0 flex-1"
                    maxLength={40}
                    placeholder={`Team ${i + 1}`}
                    value={t.name}
                    onChange={(e) => set({ teams: d.teams.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)) })}
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => moveTeam(i, -1)} disabled={i === 0} aria-label={`Move ${teamName(i)} up`} className="grid h-11 w-9 shrink-0 place-items-center text-muted disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveTeam(i, 1)} disabled={i === n - 1} aria-label={`Move ${teamName(i)} down`} className="grid h-11 w-9 shrink-0 place-items-center text-muted disabled:opacity-30">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => (set({ teams: d.teams.filter((x) => x.id !== t.id) }), setSquadTeam(0))}
                    disabled={n <= 2}
                    aria-label={`Remove ${teamName(i)}`}
                    className="grid h-11 w-9 shrink-0 place-items-center text-muted hover:text-cream disabled:opacity-30"
                  >
                    <Close size={18} />
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-outline w-full" onClick={() => set({ teams: [...d.teams, { id: newId(), name: '', squad: [] }] })}>
              Add a team
            </button>
            <div className="border-t border-cream/12 pt-5">
              <p className="mb-4 text-sand">Squads can be added now or later. Each player keeps one name for the whole tournament, so their runs and wickets add up.</p>
              <SquadEditor
                names={names}
                squads={d.teams.map((t) => t.squad)}
                setSquads={(s) => set({ teams: d.teams.map((t, i) => ({ ...t, squad: s[i] ?? [] })) })}
                minPlayers={d.rules.match.minPlayers}
                unique="team"
                listLabel="Squad"
                team={squadTeam}
                onTeam={setSquadTeam}
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <div>
              <h1 className="h-sub text-3xl">Format</h1>
              <p className="mt-2 text-sand">
                {n} teams. The first choice is what we suggest.
              </p>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label="Format">
              {choices.map((c, i) => {
                const on = sameFormat(c.format, format);
                return (
                  <button
                    key={`${c.format.kind}-${c.format.legs}-${c.format.groups}-${c.format.finals}`}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ format: { ...c.format, thirdPlace: format.thirdPlace } })}
                    className={`p-4 text-left ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-lg font-bold uppercase italic">{c.title}</span>
                      <span className={`shrink-0 text-sm ${on ? 'text-ink' : 'text-muted'}`}>
                        {c.games} {c.games === 1 ? 'game' : 'games'}
                      </span>
                    </span>
                    <span className={`mt-1 block text-sm ${on ? 'text-ink' : 'text-sand'}`}>{c.detail}</span>
                    {i === 0 && <span className={`mt-2 inline-block text-xs font-semibold uppercase ${on ? 'text-ink' : 'text-gold'}`}>Suggested</span>}
                  </button>
                );
              })}
            </div>
            {(format.finals === 'semis' || format.finals === 'quarters' || (format.kind === 'knockout' && n >= 4)) && (
              <Toggle label="Play for third place" hint="The two losing semi finalists meet before the final." value={format.thirdPlace} onChange={(v) => set({ format: { ...format, thirdPlace: v } })} />
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h1 className="h-sub text-3xl">Where and when</h1>
              <p className="mt-2 text-sand">Tell us the hall, the hours and the courts. The games are placed so teams get a rest between games and nobody waits around all day.</p>
            </div>
            <ScheduleEditor
              settings={settings}
              entrants={entrants}
              games={plan?.placed.fixtures.length}
              onChange={(s) => set({ sessions: s.sessions, matchMinutes: s.matchMinutes, gapMinutes: s.gapMinutes, duty: s.duty, format: s.format, points: s.points })}
            />
            {plan && (
              <div className="space-y-4 border-t border-cream/12 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="h-sub text-2xl">The schedule</h2>
                  <button type="button" className="min-h-11 px-2 font-display text-sm font-bold uppercase italic text-muted hover:text-cream" onClick={() => set({ seed: d.seed + 1 })}>
                    Try another order
                  </button>
                </div>
                {plan.placed.notes.map((note) => (
                  <p key={note} className="text-sm text-gold">
                    {note}
                  </p>
                ))}
                <FixtureList lang="en" fixtures={plan.placed.fixtures} teams={plan.teams} board={plan.board} />
                <p className="text-sm text-muted">Any game can be moved by hand once the tournament is created.</p>
              </div>
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
            <button type="button" onClick={create} disabled={busy} className="btn btn-gold btn-lg flex-1">
              {busy ? 'Creating' : 'Create the tournament'}
              <ArrowRight size={18} className="btn-arrow" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
