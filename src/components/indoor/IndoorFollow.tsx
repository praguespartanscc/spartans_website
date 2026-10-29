'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { IndoorEvent, MatchSetup, MatchState } from '@/lib/indoor/engine';
import { oversText, replay, target, teamTotal } from '@/lib/indoor/engine';
import { ballLabel, ballTone } from '@/lib/indoor/format';
import { LOCALE, tr, type Lang } from '@/lib/i18n';
import Scorecard from './Scorecard';

export type FollowData = {
  team_a: string;
  team_b: string;
  setup: MatchSetup;
  status: 'live' | 'complete' | 'abandoned';
  played_on: string;
  updated_at: string;
  events: IndoorEvent[];
};

const POLL_MS = 5000;

// Czech plural: 1 běh, 2 to 4 běhy, 5 and more běhů.
const csPlural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
const runs = (lang: Lang, n: number) => (lang === 'cs' ? `${n} ${csPlural(n, 'běh', 'běhy', 'běhů')}` : `${n} ${n === 1 ? 'run' : 'runs'}`);
const balls = (lang: Lang, n: number) => (lang === 'cs' ? `${n} ${csPlural(n, 'míček', 'míčky', 'míčků')}` : `${n} ${n === 1 ? 'ball' : 'balls'}`);

function resultLine(lang: Lang, s: MatchState): string | null {
  const r = s.result;
  if (!r) return null;
  if (r.winner == null) return tr(lang, { en: 'Match tied', cs: 'Zápas skončil remízou' });
  const name = s.teams[r.winner].name;
  const spare = r.byChase && r.ballsLeft > 0 ? tr(lang, { en: `, with ${balls(lang, r.ballsLeft)} to spare`, cs: `, zbývalo ${balls(lang, r.ballsLeft)}` }) : '';
  return tr(lang, { en: `${name} won by ${runs(lang, r.margin)}${spare}`, cs: `${name} vyhrál o ${runs(lang, r.margin)}${spare}` });
}

function chaseLine(lang: Lang, s: MatchState): string | null {
  const t = target(s);
  const inn = s.innings[s.current];
  if (t == null || inn.index !== 1 || inn.complete) return null;
  const need = t - teamTotal(s, inn.batting);
  const left = inn.oversLimit * s.rules.match.ballsPerOver - inn.legalBalls;
  if (need <= 0) return null;
  return tr(lang, { en: `Needs ${runs(lang, need)} from ${balls(lang, left)}`, cs: `Potřebuje ${runs(lang, need)} z ${balls(lang, left)}` });
}

const TONE: Record<ReturnType<typeof ballTone>, string> = {
  wicket: 'bg-crimson text-cream',
  boundary: 'bg-gold text-ink',
  extra: 'border border-gold/60 text-gold',
  dot: 'border border-cream/22 text-muted',
  runs: 'bg-cream/10 text-cream',
};

export default function IndoorFollow({ initial, slug, lang }: { initial: FollowData; slug: string; lang: Lang }) {
  const [data, setData] = useState(initial);
  // Set in the browser only, so the server and browser render the same text.
  const [checked, setChecked] = useState<Date | null>(null);
  useEffect(() => setChecked(new Date()), []);

  // Refresh while the match is live and the page is on screen.
  useEffect(() => {
    if (data.status !== 'live') return;
    const supabase = createClientComponentClient();
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: fresh } = await supabase.rpc('indoor_match_by_slug', { p_slug: slug });
      if (stopped || !fresh) return;
      setData(fresh as FollowData);
      setChecked(new Date());
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [data.status, slug]);

  const state = useMemo(() => replay(data.setup, data.events), [data]);
  const inn = state.innings[state.current];
  const bpo = state.rules.match.ballsPerOver;
  const live = data.status === 'live' && state.status !== 'complete';
  const result = resultLine(lang, state);
  const chase = chaseLine(lang, state);
  const overIndex = Math.floor(inn.legalBalls / bpo);
  const over = inn.overs.find((o) => o.index === overIndex) ?? inn.overs[inn.overs.length - 1];
  const striker = inn.striker ? inn.batters[inn.striker] : null;
  const other = inn.nonStriker ? inn.batters[inn.nonStriker] : null;
  const bowler = inn.bowler ? inn.bowlers[inn.bowler] : null;
  const date = new Date(`${data.played_on}T12:00:00`).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">{tr(lang, { en: 'Indoor cricket', cs: 'Halový kriket' })}</p>
        {live && (
          <span className="chip border-crimson-hi text-cream">
            <span className="live-dot h-2 w-2 rounded-full bg-crimson-hi" aria-hidden />
            {tr(lang, { en: 'Live', cs: 'Živě' })}
          </span>
        )}
        <span className="text-sm text-muted">{date}</span>
      </div>
      <h1 className="display mt-3 text-[clamp(32px,7vw,56px)]">
        {state.teams[0].name} <span className="text-muted">v</span> {state.teams[1].name}
      </h1>

      {/* Score of each innings so far */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-live="polite">
        {state.innings
          .filter((i) => i.index === 0 || i.overs.some((o) => o.balls.length) || i.complete)
          .map((i) => (
            <div key={i.index} className={`card p-5 ${i.index === state.current && live ? 'border-gold' : ''}`}>
              <p className="h-sub truncate text-xl">{state.teams[i.batting].name}</p>
              <p className="mt-2 font-varsity text-[clamp(40px,9vw,56px)] leading-none">
                {teamTotal(state, i.batting)}
                <span className="text-muted">/{i.wickets}</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                {oversText(i.legalBalls, bpo)} {tr(lang, { en: 'of', cs: 'z' })} {i.oversLimit} {tr(lang, { en: 'overs', cs: 'overů' })}
              </p>
            </div>
          ))}
      </div>

      {result && <p className="h-sub mt-6 text-2xl text-gold">{result}</p>}
      {chase && <p className="mt-6 text-lg text-sand">{chase}</p>}
      {state.current === 1 && live && (
        <p className="mt-1 text-sm text-muted">
          {tr(lang, { en: 'Target', cs: 'Cíl' })} {target(state)}
        </p>
      )}

      {live && (striker || bowler) && (
        <section className="card mt-6 space-y-2 p-5 text-sand" aria-label={tr(lang, { en: 'At the crease', cs: 'Na hřišti' })}>
          {[striker, other].map((b, k) =>
            b ? (
              <p key={b.id} className="flex justify-between gap-3">
                <span className={k === 0 ? 'font-semibold text-cream' : ''}>
                  {b.name}
                  {k === 0 && <span className="text-gold"> *</span>}
                </span>
                <span>
                  <span className="font-varsity">{b.runs}</span> <span className="text-muted">({b.balls})</span>
                </span>
              </p>
            ) : null,
          )}
          {bowler && (
            <p className="flex justify-between gap-3 border-t border-cream/12 pt-2 text-sm">
              <span>
                {tr(lang, { en: 'Bowling', cs: 'Nadhazuje' })}: {bowler.name}
              </span>
              <span className="text-muted">
                {oversText(bowler.balls, bpo)} ov, {bowler.runs} r, {bowler.wickets} w
              </span>
            </p>
          )}
          {over && over.balls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2" aria-label={tr(lang, { en: 'This over', cs: 'Tento over' })}>
              {over.balls.map((b) => (
                <span key={b.eventId} className={`chip-pop grid h-9 min-w-9 place-items-center rounded-full px-1.5 font-display text-xs font-bold italic ${TONE[ballTone(b)]} ${b.legal ? '' : 'border-dashed'}`}>
                  {ballLabel(b)}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {live && checked && (
        <p className="mt-4 text-sm text-muted">
          {tr(lang, { en: 'The score updates on its own every few seconds. Last checked', cs: 'Skóre se samo obnovuje každých pár sekund. Naposledy' })}{' '}
          {checked.toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.
        </p>
      )}

      <div className="mt-12">
        <Scorecard state={state} lang={lang} />
      </div>
    </div>
  );
}
