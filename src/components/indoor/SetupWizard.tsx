'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import type { EventData, FixtureLink, IndoorEvent, MatchSetup, Player, TeamIndex } from '@/lib/indoor/engine';
import type { IndoorRules } from '@/lib/indoor/rules';
import { cloneRules, normaliseZones } from '@/lib/indoor/rules';
import { PRESETS, presetById } from '@/lib/indoor/presets';
import { loadLocal, newId, newSlug, saveLocal } from '@/lib/indoor/store';
import type { LocalMatch } from '@/lib/indoor/store';
import { fetchMatch } from '@/lib/indoor/sync';
import { battingFirstOf } from '@/lib/indoor/toss';
import type { TournamentData } from '@/lib/indoor/tournament';
import { cacheTournament, loadTournament } from '@/lib/indoor/tstore';
import { fetchTournament } from '@/lib/indoor/tsync';
import RulesEditor, { ConfirmButton } from './RulesEditor';
import { rulesSummary } from './Scorer';
import SquadEditor, { PickList } from './SquadEditor';
import TossStep, { EMPTY_TOSS, tossOf } from './TossStep';
import type { TossDraft } from './TossStep';
import { ArrowLeft, ArrowRight } from '@/components/ui/Icons';
import { rememberNames } from '@/lib/indoor/names';

type Step = 'Teams' | 'Players' | 'Rules' | 'Toss' | 'Start';
const FREE_STEPS: Step[] = ['Teams', 'Rules', 'Toss', 'Start'];
// A tournament game: the teams and the rules are the tournament's, so only today's players are asked.
const FIXTURE_STEPS: Step[] = ['Players', 'Toss', 'Start'];
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

// What a tournament game brings to the setup: its two teams with their ids and squads.
type FromFixture = { link: FixtureLink; teamIds: [string, string]; pools: [Player[], Player[]] };

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState<[string, string]>(['', '']);
  const [squads, setSquads] = useState<[Player[], Player[]]>([[], []]);
  const [base, setBase] = useState<IndoorRules>(() => presetById('league')); // the preset picked
  const [rules, setRules] = useState<IndoorRules>(() => presetById('league'));
  const [customise, setCustomise] = useState(false);
  const [last, setLast] = useState<IndoorRules | null>(null);
  const [toss, setToss] = useState<TossDraft>(EMPTY_TOSS);
  const [openers, setOpeners] = useState<[string | null, string | null]>([null, null]);
  const [bowler, setBowler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fixture, setFixture] = useState<FromFixture | null>(null);
  // A tournament game is being looked up ('loading'), or could not be found ('missing').
  const [lookup, setLookup] = useState<'none' | 'loading' | 'missing'>('none');

  const steps = fixture || lookup !== 'none' ? FIXTURE_STEPS : FREE_STEPS;
  const at = steps[step];

  useEffect(() => {
    setLast(loadLastRules());
    const q = new URLSearchParams(window.location.search);

    // A tournament game: /score/new?t=<tournament>&f=<fixture>&h=<home team>&a=<away team>.
    const [t, f, h, a] = [q.get('t'), q.get('f'), q.get('h'), q.get('a')];
    if (t && f && h && a) {
      const fill = (d: TournamentData): boolean => {
        const fx = d.fixtures.find((x) => x.id === f);
        const home = d.teams.find((x) => x.id === h);
        const away = d.teams.find((x) => x.id === a);
        if (!fx || !home || !away) return false;
        setNames([home.name, away.name]);
        setSquads([home.squad, away.squad]);
        const r = { ...cloneRules(d.tournament.rules), zones: normaliseZones(d.tournament.rules.zones) };
        setBase(r);
        setRules(r);
        setFixture({
          link: { id: fx.id, label: fx.label || `Game ${fx.seq}`, tournament: { id: d.tournament.id, name: d.tournament.name, slug: d.tournament.slug } },
          teamIds: [home.id, away.id],
          pools: [home.squad, away.squad],
        });
        setLookup('none');
        return true;
      };
      // The copy on this phone first, so a game can be started with no signal.
      const cached = loadTournament(t);
      if (cached && fill(cached)) return;
      setLookup('loading');
      fetchTournament(createClientComponentClient(), t)
        .then(({ data }) => {
          if (data) cacheTournament(data);
          if (!data || !fill(data)) setLookup('missing');
        })
        .catch(() => setLookup('missing'));
      return;
    }

    // "Same teams again": /score/new?from=<match id> copies teams, squads and rules.
    const from = q.get('from');
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
  const tossed = tossOf(toss);
  const battingFirst: TeamIndex | null = tossed ? battingFirstOf(tossed) : null;
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
    if (to > step && (at === 'Teams' || at === 'Players') && problems.length) {
      toast.error(problems[0]);
      return;
    }
    if (to > step && at === 'Toss' && !tossed) {
      toast.error(toss.winner == null ? 'Do the toss first.' : 'Pick bat or bowl.');
      return;
    }
    setStep(to);
    window.scrollTo({ top: 0 });
  }

  function startOver() {
    setStep(0);
    setToss(EMPTY_TOSS);
    setOpeners([null, null]);
    setBowler(null);
    if (fixture) {
      // A tournament game goes back to the full squads.
      setSquads(fixture.pools);
    } else {
      setNames(['', '']);
      setSquads([[], []]);
      setBase(presetById('league'));
      setRules(presetById('league'));
      setCustomise(false);
    }
    window.scrollTo({ top: 0 });
  }

  function pickPreset(p: IndoorRules) {
    const r = { ...cloneRules(p), zones: normaliseZones(p.zones) };
    setBase(r);
    setRules(r);
  }

  async function start() {
    if (!tossed || battingFirst == null) return void toast.error('Do the toss first.');
    if (problems.length || !striker || !nonStriker || striker === nonStriker || !firstBowler) return void toast.error('Pick two opening batters and a bowler.');
    setBusy(true);
    try {
      const setup: MatchSetup = {
        teams: [
          { name: teamName(0), players: squads[0], ...(fixture ? { id: fixture.teamIds[0] } : {}) },
          { name: teamName(1), players: squads[1], ...(fixture ? { id: fixture.teamIds[1] } : {}) },
        ],
        battingFirst,
        rules: { ...cloneRules(rules), zones: normaliseZones(rules.zones) },
        toss: tossed,
        ...(fixture ? { fixture: fixture.link } : {}),
      };
      const data: EventData[] = [
        { type: 'openers', data: { strikerId: striker, nonStrikerId: nonStriker } },
        { type: 'overStart', data: { bowlerId: firstBowler } },
      ];
      const events = data.map((d, i) => ({ id: newId(), seq: i + 1, ...d }) as IndoorEvent);
      const id = newId();
      const lm: LocalMatch = {
        match: {
          id,
          team_a: setup.teams[0].name,
          team_b: setup.teams[1].name,
          setup,
          summary: null,
          status: 'live',
          share_slug: newSlug(),
          played_on: todayInPrague(),
          created_at: new Date().toISOString(),
          ...(fixture ? { tournament_id: fixture.link.tournament.id, fixture_id: fixture.link.id } : {}),
        },
        events,
        pending: events.map((e) => e.id),
        matchPending: true,
      };
      rememberNames(setup.teams.flatMap((t) => t.players.map((p) => p.name)));
      if (!fixture) {
        try {
          localStorage.setItem(LAST_RULES, JSON.stringify({ ...setup.rules, presetId: 'last', name: 'My last rules' }));
        } catch {
          // storage blocked: the match still starts
        }
      }
      if (!saveLocal(lm)) toast('This phone could not save a copy. Keep the screen open until it says Synced.');
      router.push(`/score/${id}`);
    } finally {
      setBusy(false);
    }
  }

  const back = fixture ? `/score/t/${fixture.link.tournament.id}` : '/score';

  if (lookup !== 'none') {
    return (
      <div className="mx-auto max-w-lg px-4 pb-32 pt-4">
        <Link href="/score" className="-ml-2 grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="Back to my matches">
          <ArrowLeft size={22} />
        </Link>
        {lookup === 'loading' ? (
          <div className="skeleton mt-8 h-64" role="status" aria-label="Loading the game" />
        ) : (
          <div className="mt-16 text-center">
            <h1 className="h-sub text-3xl">Game not found</h1>
            <p className="mt-3 text-sand">This phone has no copy of that tournament, and it could not be loaded. Open the tournament once while you are online, then start the game from there.</p>
            <Link href="/score" className="btn btn-gold mt-6">
              My matches
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={back} className="-ml-2 grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-cream" aria-label={fixture ? 'Back to the tournament' : 'Back to my matches'}>
          <ArrowLeft size={22} />
        </Link>
        <p className="eyebrow min-w-0 truncate text-center">{fixture ? `${fixture.link.tournament.name}, ${fixture.link.label}` : 'New indoor match'}</p>
        <ConfirmButton label="Start over" confirm="Tap again" onConfirm={startOver} />
      </div>

      <ol className="mt-4 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Steps">
        {steps.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => i < step && go(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined} className="w-full text-left">
              <span className={`block h-1 ${i <= step ? 'bg-gold' : 'bg-cream/15'}`} />
              <span className={`mt-1.5 block font-display text-xs font-bold uppercase italic ${i === step ? 'text-cream' : 'text-faint'}`}>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div key={step} className="page-enter mt-8">
        {at === 'Teams' && (
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
            <SquadEditor names={[teamName(0), teamName(1)]} squads={squads} setSquads={(s) => setSquads([s[0], s[1]])} minPlayers={rules.match.minPlayers} />
          </section>
        )}

        {at === 'Players' && fixture && (
          <section className="space-y-6">
            <div>
              <h1 className="h-sub text-3xl">
                {teamName(0)} v {teamName(1)}
              </h1>
              <p className="mt-2 text-sand">Who is playing today? Take out anyone who is not here and put the rest in batting order.</p>
            </div>
            <SquadEditor names={[teamName(0), teamName(1)]} squads={squads} setSquads={(s) => setSquads([s[0], s[1]])} minPlayers={rules.match.minPlayers} pools={fixture.pools} heading="Today's players" />
            <div className="card p-4">
              <p className="eyebrow">Tournament rules: {rules.name}</p>
              <ul className="mt-3 space-y-1 text-sm text-sand">
                {rulesSummary(rules).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {at === 'Rules' && (
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

        {at === 'Toss' && (
          <section className="space-y-6">
            <h1 className="h-sub text-3xl">The toss</h1>
            <TossStep names={[teamName(0), teamName(1)]} value={toss} onChange={setToss} />
          </section>
        )}

        {at === 'Start' && battingFirst != null && (
          <section className="space-y-6">
            <div>
              <h1 className="h-sub text-3xl">Openers</h1>
              <p className="mt-2 text-sand">
                {teamName(battingFirst)} bat first, {teamName(battingFirst === 0 ? 1 : 0)} bowl.
              </p>
            </div>
            <PickList title={`On strike for ${teamName(battingFirst)}`} players={batSide} value={striker} onPick={(id) => setOpeners([id, id === nonStriker ? striker : nonStriker])} />
            <PickList title="At the other end" players={batSide} value={nonStriker} onPick={(id) => setOpeners([id === striker ? nonStriker : striker, id])} />
            <PickList title={`Opening bowler for ${teamName(battingFirst === 0 ? 1 : 0)}`} players={bowlSide} value={firstBowler} onPick={setBowler} />
            {short.some(Boolean) && <p className="text-gold">A side has fewer than {rules.match.minPlayers} players. You can still start.</p>}
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
          {step < steps.length - 1 ? (
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
