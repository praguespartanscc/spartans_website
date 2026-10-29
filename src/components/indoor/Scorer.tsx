'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { BallRecord, EventData, InningsState, MatchState, TeamIndex } from '@/lib/indoor/engine';
import { bowlerChoices, needs, oversText, target, teamTotal } from '@/lib/indoor/engine';
import type { BallInput, End, ExtraKind, WicketInput } from '@/lib/indoor/scoring';
import { findZone, scoreBall, wicketStands } from '@/lib/indoor/scoring';
import type { DismissalKind, IndoorRules, RulesPatch } from '@/lib/indoor/rules';
import { DISMISSAL_LABEL, isFinalOver } from '@/lib/indoor/rules';
import { upcoming } from '@/lib/indoor/queue';
import { newId } from '@/lib/indoor/store';
import { announceText, ballLabel, ballTone, chaseText, resultText, runRate } from '@/lib/indoor/format';
import type { Member } from './MemberGate';
import type { Placement, SyncState } from './useScorer';
import { useScorer } from './useScorer';
import Court from './Court';
import Sheet from './Sheet';
import RulesEditor, { Stepper } from './RulesEditor';
import { ArrowLeft, Share, Undo } from '@/components/ui/Icons';

type SheetName = 'wicket' | 'bowler' | 'more' | 'ball' | 'history' | 'rules' | 'penalty' | 'player' | 'overs' | 'retire' | 'next' | 'end' | 'info' | 'handover' | null;

const EXTRAS: { id: ExtraKind; label: string }[] = [
  { id: 'wide', label: 'Wide' },
  { id: 'noBall', label: 'No ball' },
  { id: 'bye', label: 'Bye' },
  { id: 'legBye', label: 'Leg bye' },
];

export default function Scorer({ id, member }: { id: string; member: Member }) {
  const s = useScorer(id);
  const { state, lm } = s;

  if (s.loading && !lm) {
    return (
      <div className="mx-auto max-w-lg space-y-3 px-4 pt-6" role="status" aria-label="Loading the match">
        <div className="skeleton h-24" />
        <div className="skeleton h-16" />
        <div className="skeleton h-72" />
      </div>
    );
  }
  if (!lm || !state) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="h-sub text-3xl">Match not found</h1>
        <p className="mt-3 text-sand">It may have been deleted, or it was started on another phone that has not synced yet.</p>
        <Link href="/score" className="btn btn-gold mt-6">
          My matches
        </Link>
      </div>
    );
  }
  const owner = lm.match.created_by == null || lm.match.created_by === member.user.id || lm.match.scorer_id === member.user.id;
  return <Board s={s} state={state} canScore={member.isAdmin || owner} />;
}

type ScorerApi = ReturnType<typeof useScorer>;

function Board({ s, state, canScore }: { s: ScorerApi; state: MatchState; canScore: boolean }) {
  const lm = s.lm!;
  const rules = state.rules;
  const inn = state.innings[state.current];
  const bpo = rules.match.ballsPerOver;

  const [zone, setZone] = useState<string | null>(null);
  const [extra, setExtra] = useState<ExtraKind | null>(null);
  const [dead, setDead] = useState(false);
  const [place, setPlace] = useState<Placement>({ mode: 'append' });
  const [sheet, setSheet] = useState<SheetName>(null);
  const [picked, setPicked] = useState<BallRecord | null>(null);
  const lastTap = useRef(0);

  const overIndex = Math.floor(inn.legalBalls / bpo);
  const finalOver = isFinalOver(rules, overIndex, inn.oversLimit);
  const need = needs(state);
  const atBreak = state.current === 1 && !inn.complete && !inn.bowler && !inn.overs.some((o) => o.balls.length) && state.status !== 'complete';
  const done = state.status === 'complete';

  useWakeLock(canScore && !done);

  // At the end of an over, ask for the next bowler (once: closing it leaves Undo reachable).
  const overKey = `${state.current}:${overIndex}:${inn.legalBalls}`;
  const asked = useRef<string | null>(null);
  useEffect(() => {
    if (canScore && need === 'bowler' && !atBreak && sheet === null && place.mode === 'append' && asked.current !== overKey) {
      asked.current = overKey;
      setSheet('bowler');
    }
  }, [canScore, need, atBreak, sheet, place.mode, overKey]);

  const close = useCallback(() => setSheet(null), []);

  const reset = () => {
    setZone(null);
    setExtra(null);
    setDead(false);
    setPlace({ mode: 'append' });
  };

  // Only a ball can replace or be inserted before another ball. Everything else goes at the end.
  const commit = (data: EventData | EventData[], message?: string) => {
    const isBall = !Array.isArray(data) && data.type === 'ball';
    const at: Placement = isBall ? place : { mode: 'append' };
    const ids = s.add(data, at);
    const wasEdit = at.mode === 'replace';
    if (isBall) reset();
    navigator.vibrate?.(12);
    if (message) {
      toast(
        (t) => (
          <span className="flex items-center gap-3">
            <span>{message}</span>
            {!wasEdit && ids.length > 0 && (
              <button
                type="button"
                className="font-display font-bold uppercase italic text-gold"
                onClick={() => {
                  ids.forEach((x) => s.remove(x));
                  toast.dismiss(t.id);
                }}
              >
                Undo
              </button>
            )}
          </span>
        ),
        { id: 'last', duration: 2500 },
      );
    }
  };

  const ball = (runs: number, wicket: WicketInput | null = null) => {
    const now = Date.now();
    if (now - lastTap.current < 350) return; // a double tap is one ball
    lastTap.current = now;
    const input: BallInput = { zone, runs, extra, wicket, ...(dead ? { deadBall: true } : {}) };
    const v = scoreBall(rules, input, { finalOver, freeHit: inn.freeHit });
    const what = v.wicket ? 'Wicket' : `${v.teamRuns} ${v.teamRuns === 1 ? 'run' : 'runs'}`;
    commit({ type: 'ball', data: input }, place.mode === 'replace' ? 'Ball changed' : `${what} recorded`);
  };

  const undo = () => {
    const last = s.undo();
    if (last) toast('Undone', { id: 'last', duration: 1500 });
  };

  const zoneObj = findZone(rules, zone);
  const runLimit = dead ? rules.running.deadBallMaxRuns : zoneObj && !zoneObj.allowRunning ? 0 : rules.running.maxRunsPerBall ?? 6;
  const preview = (runs: number) => scoreBall(rules, { zone, runs, extra, wicket: null, deadBall: dead }, { finalOver, freeHit: inn.freeHit });

  const currentOver = inn.overs.find((o) => o.index === overIndex) ?? inn.overs[inn.overs.length - 1];
  const strikerLine = inn.striker ? inn.batters[inn.striker] : null;
  const nonLine = inn.nonStriker ? inn.batters[inn.nonStriker] : null;
  const bowlerLine = inn.bowler ? inn.bowlers[inn.bowler] : null;
  const queue = upcoming(inn.queue).map((pid) => inn.batters[pid]?.name).filter(Boolean);
  const chase = chaseText(state);

  return (
    <div className={`mx-auto max-w-lg ${canScore && !done && !atBreak ? 'pb-48' : 'pb-28'}`}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', borderRadius: 0, border: '1px solid rgba(255,255,255,0.12)' } }} />

      {/* Top bar */}
      <div className="flex items-center gap-2 px-2 pt-2">
        <Link href="/score" className="grid h-11 w-11 place-items-center text-muted hover:text-cream" aria-label="My matches">
          <ArrowLeft size={22} />
        </Link>
        <p className="flex-1 truncate text-center text-sm text-muted">
          {state.teams[0].name} v {state.teams[1].name}
        </p>
        <SyncDot sync={s.sync} pending={lm.pending.length} />
        <button type="button" onClick={() => setSheet('info')} className="chip mr-2 shrink-0 hover:border-gold">
          Rules
        </button>
      </div>

      {/* Score */}
      <header className="px-4 pt-2">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow truncate">{state.teams[inn.batting].name} batting</p>
            <p className="font-varsity text-[clamp(44px,13vw,64px)] leading-none" aria-live="polite">
              {teamTotal(state, inn.batting)}
              <span className="text-muted">/{inn.wickets}</span>
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="font-varsity text-2xl leading-none">
              {oversText(inn.legalBalls, bpo)}
              <span className="text-base text-muted"> of {inn.oversLimit}</span>
            </p>
            <p className="mt-1 text-sm text-muted">Run rate {runRate(state, inn).toFixed(1)}</p>
          </div>
        </div>
        {(state.current === 1 || inn.freeHit || (finalOver && !done)) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chase && <span className="text-sand">{chase}</span>}
            {state.current === 1 && <span className="text-sm text-muted">Target {target(state)}</span>}
            {inn.freeHit && <span className="chip border-gold text-gold">Free hit</span>}
            {finalOver && !done && rules.extras.rebowl === 'finalOver' && <span className="chip border-crimson-hi text-cream">Final over: extras bowled again</span>}
          </div>
        )}
      </header>

      {done ? (
        <Finished state={state} slug={lm.match.share_slug} id={lm.match.id} />
      ) : !canScore ? (
        <ReadOnly state={state} id={lm.match.id} pull={s.pull} />
      ) : atBreak ? (
        <Break state={state} inn={inn} onStart={(evs) => commit(evs, 'Second innings started')} />
      ) : (
        <>
          {/* Batters */}
          <section className="mx-4 mt-4 divide-y divide-cream/10 border border-cream/12 bg-panel" aria-label="Batters">
            {[strikerLine, nonLine].map((b, i) =>
              b ? (
                <button
                  key={b.id}
                  type="button"
                  disabled={i === 0}
                  onClick={() => commit({ type: 'swapStrike', data: {} }, 'Strike changed')}
                  className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left disabled:cursor-default"
                  aria-label={i === 0 ? `${b.name} on strike` : `Put ${b.name} on strike`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-gold' : 'bg-transparent ring-1 ring-cream/30'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${i === 0 ? 'font-semibold text-cream' : 'text-sand'}`}>{b.name}</span>
                    {rules.batting.retireAt != null && (
                      <span className="mt-1 block h-1 w-full bg-cream/10">
                        <span className="block h-1 bg-gold transition-transform duration-500 ease-out-expo origin-left" style={{ transform: `scaleX(${Math.min(1, Math.max(0, b.visitRuns) / rules.batting.retireAt)})` }} />
                      </span>
                    )}
                  </span>
                  <span className="font-varsity text-xl">{b.runs}</span>
                  <span className="w-10 text-right text-sm text-muted">({b.balls})</span>
                </button>
              ) : (
                <p key={i} className="px-3 py-3 text-muted">
                  No batter
                </p>
              ),
            )}
          </section>
          <p className="mx-4 mt-1.5 flex justify-between gap-3 text-xs text-muted">
            <span>
              Partnership {inn.partnership.runs} ({inn.partnership.balls})
            </span>
            {queue.length > 0 && <span className="truncate">Next: {queue.slice(0, 3).join(', ')}</span>}
          </p>

          {/* Bowler and over */}
          <section className="mx-4 mt-3 flex items-center gap-3">
            <button type="button" onClick={() => setSheet('bowler')} className="min-h-11 min-w-0 flex-1 truncate border border-cream/12 px-3 text-left">
              <span className="text-muted">Bowler </span>
              {bowlerLine ? (
                <span className="text-cream">
                  {bowlerLine.name} {oversText(bowlerLine.balls, bpo)}, {bowlerLine.runs} r, {bowlerLine.wickets} w
                </span>
              ) : (
                <span className="text-gold">Pick a bowler</span>
              )}
            </button>
            <button type="button" onClick={() => setSheet('history')} className="chip shrink-0 hover:border-gold">
              All balls
            </button>
          </section>
          <OverStrip over={currentOver?.balls ?? []} onPick={(b) => (setPicked(b), setSheet('ball'))} />

          {place.mode !== 'append' && (
            <div className="mx-4 mt-3 flex items-center justify-between gap-3 border border-gold bg-gold/10 px-3 py-2 text-sm">
              <span>{place.mode === 'replace' ? 'Editing a ball. Enter it again.' : 'Inserting a missed ball. Enter it now.'}</span>
              <button type="button" onClick={reset} className="font-display font-bold uppercase italic text-gold">
                Cancel
              </button>
            </div>
          )}

          {/* Extras */}
          <div className="mx-4 mt-3 flex flex-wrap gap-2">
            {EXTRAS.filter((x) => (x.id === 'bye' ? rules.extras.byesAllowed : x.id === 'legBye' ? rules.extras.legByesAllowed : true)).map((x) => (
              <Toggle key={x.id} on={extra === x.id} onClick={() => setExtra(extra === x.id ? null : x.id)}>
                {x.label}
              </Toggle>
            ))}
            <Toggle on={dead} onClick={() => setDead(!dead)}>
              Dead ball
            </Toggle>
          </div>
          {(zone || extra || dead) && <p className="mx-4 mt-2 text-sm text-sand">{describe(rules, zone, extra, dead, finalOver)}</p>}

          {/* Court */}
          <div className="mx-auto mt-3 max-w-[360px] px-4">
            <Court rules={rules} selected={zone} onSelect={setZone} />
          </div>

          {need === 'batter' && <p className="mx-4 mt-2 text-gold">No batter is free to come in. Add a player from More.</p>}
        </>
      )}

      {/* Runs and actions stay under the thumb */}
      {canScore && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream/12 bg-ink/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          {!done && !atBreak && (
            <div className="mx-auto mb-2 grid max-w-lg grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((r) => {
                const v = preview(r);
                const off = r > runLimit || need !== 'nothing';
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={off}
                    onClick={() => ball(r)}
                    className="flex h-14 flex-col items-center justify-center border border-cream/22 bg-panel transition-transform duration-150 active:scale-95 disabled:opacity-30"
                    aria-label={`${r} run${r === 1 ? '' : 's'}, scores ${v.teamRuns}`}
                  >
                    <span className="font-varsity text-2xl leading-none">{r}</span>
                    {(zone || extra) && <span className="mt-0.5 text-[11px] leading-none text-gold">= {v.teamRuns}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mx-auto grid max-w-lg grid-cols-[1fr_1.4fr_1fr] gap-2">
            <button type="button" onClick={undo} className="btn btn-outline btn-lg px-2" disabled={!lm.events.some((e) => !e.deleted)}>
              <Undo size={18} /> Undo
            </button>
            <button
              type="button"
              onClick={() => setSheet('wicket')}
              disabled={done || atBreak || need !== 'nothing'}
              className="btn btn-lg bg-crimson text-cream hover:bg-crimson-hi disabled:opacity-40"
            >
              Wicket
            </button>
            <button type="button" onClick={() => setSheet('more')} className="btn btn-outline btn-lg px-2">
              More
            </button>
          </div>
        </div>
      )}

      {sheet === 'wicket' && (
        <WicketSheet
          rules={rules}
          inn={inn}
          zone={zone}
          extra={extra}
          onClose={close}
          onOut={(w) => {
            close();
            ball(0, w);
          }}
        />
      )}
      {sheet === 'bowler' && (
        <Sheet title="Next bowler" onClose={close}>
          <div className="grid gap-2">
            {bowlerChoices(state).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  close();
                  commit({ type: 'overStart', data: { bowlerId: c.id } });
                }}
                className={`flex min-h-12 items-center justify-between gap-3 border px-3 text-left ${c.id === inn.bowler ? 'border-gold' : 'border-cream/22'} ${c.blocked ? 'opacity-50' : ''}`}
              >
                <span className="text-cream">{c.name}</span>
                <span className="text-sm text-muted">{c.blocked ?? `${c.overs} ${c.overs === 1 ? 'over' : 'overs'}`}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'ball' && picked && (
        <Sheet title={`Ball ${picked.over}.${picked.ballOfOver}${picked.legal ? '' : ' (not counted)'}`} onClose={close}>
          <p className="text-sand">{ballText(state, inn, picked)}</p>
          <div className="mt-5 grid gap-2">
            <button type="button" className="btn btn-gold btn-lg" onClick={() => (setPlace({ mode: 'replace', id: picked.eventId }), close())}>
              Change this ball
            </button>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => (setPlace({ mode: 'before', id: picked.eventId }), close())}>
              Insert a missed ball before it
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={() => {
                s.remove(picked.eventId);
                close();
                toast('Ball deleted', { id: 'last' });
              }}
            >
              Delete this ball
            </button>
          </div>
        </Sheet>
      )}
      {sheet === 'history' && (
        <Sheet title="Every ball this innings" onClose={close}>
          <div className="space-y-3">
            {inn.overs.length === 0 && <p className="text-muted">No balls yet.</p>}
            {[...inn.overs].reverse().map((o) => (
              <div key={o.index}>
                <p className="text-sm text-muted">
                  Over {o.index + 1}
                  {o.bowlerId ? `, ${inn.bowlers[o.bowlerId]?.name ?? ''}` : ''}
                </p>
                <OverStrip over={o.balls} onPick={(b) => (setPicked(b), setSheet('ball'))} flush />
              </div>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'more' && (
        <Sheet title="More" onClose={close}>
          <div className="grid grid-cols-2 gap-2">
            <MoreBtn onClick={() => (commit({ type: 'swapStrike', data: {} }, 'Strike changed'), close())}>Swap strike</MoreBtn>
            <MoreBtn onClick={() => setSheet('retire')}>Retire a batter</MoreBtn>
            <MoreBtn onClick={() => setSheet('next')}>Choose next batter</MoreBtn>
            <MoreBtn onClick={() => setSheet('penalty')}>Penalty runs</MoreBtn>
            <MoreBtn onClick={() => setSheet('player')}>Add a late player</MoreBtn>
            <MoreBtn onClick={() => setSheet('overs')}>Change overs</MoreBtn>
            <MoreBtn onClick={() => setSheet('rules')}>Change rules</MoreBtn>
            <MoreBtn onClick={() => setSheet('end')}>End innings</MoreBtn>
            <MoreBtn onClick={() => setSheet('handover')}>Hand over scoring</MoreBtn>
            <Link href={`/score/${lm.match.id}/card`} className="btn btn-outline min-h-14 justify-center">
              Scorecard
            </Link>
            <ShareButton slug={lm.match.share_slug} uploaded={!lm.matchPending} />
          </div>
          <p className="mt-5 border-t border-cream/12 pt-4 text-sm text-muted">Umpire call: {announceText(state)}</p>
        </Sheet>
      )}
      {sheet === 'retire' && (
        <Sheet title="Retire a batter" onClose={close}>
          <div className="grid gap-2">
            {(['striker', 'nonStriker'] as End[]).map((end) => {
              const b = end === 'striker' ? strikerLine : nonLine;
              if (!b) return null;
              return (
                <div key={end} className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn btn-outline min-h-14" onClick={() => (commit({ type: 'retire', data: { who: end, out: false } }, `${b.name} retired`), close())}>
                    {b.name} retires
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline min-h-14"
                    onClick={() => (commit({ type: 'retire', data: { who: end, out: true } }, `${b.name} retired out`), close())}
                  >
                    {b.name} retired out (minus {rules.wickets.penalty})
                  </button>
                </div>
              );
            })}
          </div>
        </Sheet>
      )}
      {sheet === 'next' && (
        <Sheet title="Next batter in" onClose={close}>
          <div className="grid gap-2">
            {upcoming(inn.queue).map((pid) => (
              <button key={pid} type="button" className="min-h-12 border border-cream/22 px-3 text-left text-cream" onClick={() => (commit({ type: 'nextBatter', data: { playerId: pid } }, `${inn.batters[pid]?.name} is in next`), close())}>
                {inn.batters[pid]?.name}
              </button>
            ))}
            {upcoming(inn.queue).length === 0 && <p className="text-muted">Nobody is waiting.</p>}
          </div>
        </Sheet>
      )}
      {sheet === 'penalty' && <PenaltySheet state={state} onClose={close} onSave={(team, runs) => (commit({ type: 'penalty', data: { team, runs } }, `${runs > 0 ? 'Plus' : 'Minus'} ${Math.abs(runs)} for ${state.teams[team].name}`), close())} />}
      {sheet === 'player' && <PlayerSheet state={state} onClose={close} onSave={(team, name) => (commit({ type: 'addPlayer', data: { team, player: { id: newId(), name } } }, `${name} added`), close())} />}
      {sheet === 'overs' && (
        <OversSheet
          current={inn.oversLimit}
          min={Math.max(1, Math.ceil(inn.legalBalls / bpo))}
          onClose={close}
          onSave={(o) => (commit({ type: 'oversChange', data: { overs: o } }, `Innings now ${o} overs`), close())}
        />
      )}
      {sheet === 'rules' && <RulesSheet rules={rules} onClose={close} onSave={(patch) => (commit({ type: 'rulesChange', data: { patch } }, 'Rules changed from here on'), close())} />}
      {sheet === 'handover' && <HandoverSheet current={lm.match.scorer_id ?? null} onClose={close} onPick={s.handOver} />}
      {sheet === 'end' && (
        <Sheet title="End this innings?" onClose={close}>
          <p className="text-sand">Use this if the innings stops early. You can undo it.</p>
          <button type="button" className="btn btn-gold btn-lg mt-5 w-full" onClick={() => (commit({ type: 'inningsEnd', data: {} }, 'Innings ended'), close())}>
            End the innings
          </button>
        </Sheet>
      )}
      {sheet === 'info' && (
        <Sheet title={rules.name} onClose={close}>
          <ul className="space-y-1.5 text-sand">
            {rulesSummary(rules).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {state.rulesLog.length > 0 && (
            <>
              <p className="field-label mt-5">Changed during the match</p>
              <ul className="space-y-1 text-sm text-muted">
                {state.rulesLog.map((r) => (
                  <li key={r.eventId}>
                    Innings {r.innings + 1}, after {r.overs} overs: {Object.keys(r.patch).join(', ')}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}

function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const get = () => {
      if (document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {});
    };
    get();
    document.addEventListener('visibilitychange', get);
    return () => {
      document.removeEventListener('visibilitychange', get);
      lock?.release().catch(() => {});
    };
  }, [on]);
}

function SyncDot({ sync, pending }: { sync: SyncState; pending: number }) {
  const text = sync === 'offline' ? `Saved on this phone${pending ? `, ${pending} to upload` : ''}` : sync === 'saving' ? 'Saving' : 'Synced';
  const tone = sync === 'offline' ? 'bg-crimson-hi' : sync === 'saving' ? 'bg-gold' : 'bg-cream/40';
  return (
    <span className="flex h-11 items-center gap-1.5 pr-2 text-xs text-muted" role="status">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      <span className="max-w-24 truncate">{text}</span>
    </span>
  );
}

const TONE: Record<ReturnType<typeof ballTone>, string> = {
  wicket: 'bg-crimson text-cream',
  boundary: 'bg-gold text-ink',
  extra: 'border border-gold/60 text-gold',
  dot: 'border border-cream/22 text-muted',
  runs: 'bg-cream/10 text-cream',
};

function OverStrip({ over, onPick, flush = false }: { over: BallRecord[]; onPick: (b: BallRecord) => void; flush?: boolean }) {
  return (
    <div className={`${flush ? '' : 'mx-4 mt-2'} flex min-h-10 flex-wrap items-center gap-1.5`} aria-label="Balls this over">
      {over.length === 0 && !flush && <span className="text-sm text-muted">New over. Tap a wall if the ball hit one, then the runs.</span>}
      {over.map((b) => (
        <button key={b.eventId} type="button" onClick={() => onPick(b)} className={`chip-pop grid h-10 min-w-10 place-items-center rounded-full px-2 font-display text-sm font-bold italic ${TONE[ballTone(b)]} ${b.legal ? '' : 'border-dashed'}`}
          aria-label={`${ballLabel(b)}${b.legal ? '' : ', not counted'}`}
        >
          {ballLabel(b)}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`min-h-11 px-3 font-display text-sm font-bold uppercase italic transition-colors duration-150 ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}>
      {children}
    </button>
  );
}

function MoreBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-outline min-h-14 justify-center">
      {children}
    </button>
  );
}

function ShareButton({ slug, uploaded = true }: { slug: string; uploaded?: boolean }) {
  const share = async () => {
    if (!uploaded) {
      toast('The match is still only on this phone. The link works once it says Synced.');
      return;
    }
    const url = `${window.location.origin}/indoor/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Live indoor score', url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // share sheet closed
    }
  };
  return (
    <button type="button" onClick={share} className="btn btn-outline min-h-14 justify-center">
      <Share size={18} /> Share link
    </button>
  );
}

function describe(rules: IndoorRules, zone: string | null, extra: ExtraKind | null, dead: boolean, finalOver: boolean): string {
  const z = findZone(rules, zone);
  const parts: string[] = [];
  if (z) parts.push(`${z.label}, ${z.runs}${z.allowRunning ? ' plus runs' : ', no running'}`);
  if (extra === 'wide') parts.push(`Wide, ${rules.extras.wideRuns}`);
  if (extra === 'noBall') parts.push(`No ball, ${rules.extras.noBallRuns} plus the hit`);
  if (extra === 'bye') parts.push('Bye');
  if (extra === 'legBye') parts.push('Leg bye');
  if ((extra === 'wide' || extra === 'noBall') && (rules.extras.rebowl === 'always' || (rules.extras.rebowl === 'finalOver' && finalOver))) parts.push('bowled again');
  if (dead) parts.push(`Dead ball, at most ${rules.running.deadBallMaxRuns} run`);
  return parts.join('. ');
}

function ballText(state: MatchState, inn: InningsState, b: BallRecord): string {
  const name = inn.batters[b.strikerId]?.name ?? '';
  const parts = [`${name} on strike`];
  if (b.value.struckZone) parts.push(b.value.struckZone.label);
  if (b.input.extra) parts.push(EXTRAS.find((x) => x.id === b.input.extra)?.label ?? '');
  if (b.dismissedId) parts.push(`${inn.batters[b.dismissedId]?.name} out, ${DISMISSAL_LABEL[b.input.wicket!.kind].toLowerCase()}, minus ${b.penalty}`);
  else parts.push(`${b.value.teamRuns} ${b.value.teamRuns === 1 ? 'run' : 'runs'}`);
  if (b.retiredId) parts.push(`${inn.batters[b.retiredId]?.name} retired`);
  parts.push(`Score after it ${b.totalAfter + state.adjustments[inn.batting]}/${b.wicketsAfter}`);
  return parts.join('. ') + '.';
}

function ordinal(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${tail}`;
}

export function rulesSummary(r: IndoorRules): string[] {
  const walls = r.zones.filter((z) => z.enabled).map((z) => `${z.label} ${z.runs}${z.allowRunning ? '' : ' (no running)'}`);
  return [
    `${r.match.oversPerInnings} overs of ${r.match.ballsPerOver} balls.${r.match.maxOversPerBowler ? ` Up to ${r.match.maxOversPerBowler} overs a bowler.` : ''}`,
    `Walls: ${walls.join(', ')}.`,
    `Wide ${r.extras.wideRuns}, no ball ${r.extras.noBallRuns}. ${r.extras.rebowl === 'finalOver' ? 'Bowled again in the final over.' : r.extras.rebowl === 'always' ? 'Always bowled again.' : 'They count as a ball.'}`,
    `Wicket minus ${r.wickets.penalty}${r.wickets.alsoFromBatter ? ', off the batter too' : ''}.${r.wickets.shortSide.enabled ? ` With ${r.wickets.shortSide.maxPlayers} or fewer players every ${ordinal(r.wickets.shortSide.everyNth)} wicket is minus ${r.wickets.shortSide.penalty}.` : ''}`,
    r.wickets.allOutPenalty ? `Whole side out: minus ${r.wickets.allOutPenalty} more.` : '',
    r.batting.retireAt != null ? `Retire at ${r.batting.retireAt}.` : 'No retirement.',
    r.match.inningsEnd === 'chaseStops' ? 'The chase ends when the target is reached.' : 'All overs are bowled.',
  ].filter(Boolean);
}

function WicketSheet({ rules, inn, zone, extra, onClose, onOut }: { rules: IndoorRules; inn: InningsState; zone: string | null; extra: ExtraKind | null; onClose: () => void; onOut: (w: WicketInput) => void }) {
  const [kind, setKind] = useState<DismissalKind | null>(null);
  const kinds = rules.wickets.allowed.filter((k) => k !== 'retiredOut' && wicketStands(rules, { kind: k, who: 'striker', zone: null }, inn.freeHit, extra));
  const wallZones = rules.zones.filter((z) => z.enabled && z.catchOffIsOut && z.area !== 'keeperWall');
  const keeper = rules.zones.find((z) => z.enabled && z.area === 'keeperWall');
  const names = { striker: inn.striker ? inn.batters[inn.striker]?.name : '', nonStriker: inn.nonStriker ? inn.batters[inn.nonStriker]?.name : '' };

  const pick = (k: DismissalKind) => {
    if (k === 'runOut' || k === 'obstructing') return setKind(k);
    if (k === 'caughtOffWall') {
      const z = findZone(rules, zone);
      if (z && z.catchOffIsOut && z.area !== 'keeperWall') return onOut({ kind: k, who: 'striker', zone: z.id });
      return setKind(k);
    }
    if (k === 'caughtOffKeeperWall') return onOut({ kind: k, who: 'striker', zone: keeper?.id ?? null });
    onOut({ kind: k, who: 'striker', zone: null });
  };

  return (
    <Sheet title={kind ? DISMISSAL_LABEL[kind] : 'How out?'} onClose={onClose}>
      {!kind && (
        <>
          {inn.freeHit && <p className="mb-3 text-gold">Free hit: only these dismissals count.</p>}
          {extra && <p className="mb-3 text-gold">Off a {extra === 'noBall' ? 'no ball' : extra === 'wide' ? 'wide' : extra === 'bye' ? 'bye' : 'leg bye'}.</p>}
          <div className="grid grid-cols-2 gap-2">
            {kinds.map((k) => (
              <button key={k} type="button" onClick={() => pick(k)} className="min-h-14 border border-cream/22 px-3 text-left font-semibold text-cream hover:border-crimson-hi">
                {DISMISSAL_LABEL[k]}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            {rules.wickets.wicketBallScoresNothing ? `Only minus ${rules.wickets.penalty} counts on this ball.` : `Minus ${rules.wickets.penalty}, runs off this ball still count.`}
          </p>
        </>
      )}
      {(kind === 'runOut' || kind === 'obstructing') && (
        <div className="grid gap-2">
          {(['striker', 'nonStriker'] as End[]).map((who) => (
            <button key={who} type="button" onClick={() => onOut({ kind, who, zone: null })} className="btn btn-outline btn-lg">
              {names[who]} ({who === 'striker' ? 'on strike' : 'other end'})
            </button>
          ))}
        </div>
      )}
      {kind === 'caughtOffWall' && (
        <div className="grid gap-2">
          <p className="text-sand">Which wall did it come off?</p>
          {wallZones.map((z) => (
            <button key={z.id} type="button" onClick={() => onOut({ kind, who: 'striker', zone: z.id })} className="min-h-12 border border-cream/22 px-3 text-left text-cream">
              {z.label}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function PenaltySheet({ state, onClose, onSave }: { state: MatchState; onClose: () => void; onSave: (team: TeamIndex, runs: number) => void }) {
  const [team, setTeam] = useState<TeamIndex>(state.innings[state.current].bowling);
  const [runs, setRuns] = useState(state.rules.penalties.behaviourRuns);
  const [sign, setSign] = useState<-1 | 1>(-1);
  return (
    <Sheet title="Penalty runs" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as TeamIndex[]).map((t) => (
          <Toggle key={t} on={team === t} onClick={() => setTeam(t)}>
            {state.teams[t].name}
          </Toggle>
        ))}
        <Toggle on={sign === -1} onClick={() => setSign(-1)}>
          Take off
        </Toggle>
        <Toggle on={sign === 1} onClick={() => setSign(1)}>
          Add
        </Toggle>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-cream">Runs</span>
        <Stepper value={runs} min={1} max={50} label="Penalty runs" onChange={setRuns} />
      </div>
      <button type="button" className="btn btn-gold btn-lg mt-5 w-full" onClick={() => onSave(team, sign * runs)}>
        {sign < 0 ? 'Take' : 'Add'} {runs} {sign < 0 ? 'off' : 'to'} {state.teams[team].name}
      </button>
    </Sheet>
  );
}

function PlayerSheet({ state, onClose, onSave }: { state: MatchState; onClose: () => void; onSave: (team: TeamIndex, name: string) => void }) {
  const [team, setTeam] = useState<TeamIndex>(state.innings[state.current].batting);
  const [name, setName] = useState('');
  const clean = name.trim().replace(/\s+/g, ' ');
  const taken = state.teams.some((t) => t.players.some((p) => p.name.toLowerCase() === clean.toLowerCase()));
  return (
    <Sheet title="Add a late player" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {([0, 1] as TeamIndex[]).map((t) => (
          <Toggle key={t} on={team === t} onClick={() => setTeam(t)}>
            {state.teams[t].name}
          </Toggle>
        ))}
      </div>
      <label htmlFor="late-name" className="field-label mt-4">
        Name
      </label>
      <input id="late-name" className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      {taken && <p className="mt-2 text-sm text-gold">That name is already playing.</p>}
      <p className="mt-2 text-sm text-muted">Late players bat at the end of the order.</p>
      <button type="button" disabled={!clean || taken} className="btn btn-gold btn-lg mt-5 w-full" onClick={() => onSave(team, clean)}>
        Add {clean || 'player'}
      </button>
    </Sheet>
  );
}

function OversSheet({ current, min, onClose, onSave }: { current: number; min: number; onClose: () => void; onSave: (o: number) => void }) {
  const [o, setO] = useState(current);
  return (
    <Sheet title="Overs this innings" onClose={onClose}>
      <p className="text-sand">For a late side, or when time runs short. Only this innings changes.</p>
      <div className="mt-4 flex justify-end">
        <Stepper value={o} min={min} max={50} label="Overs" onChange={setO} />
      </div>
      <button type="button" className="btn btn-gold btn-lg mt-5 w-full" onClick={() => onSave(o)}>
        Set {o} overs
      </button>
    </Sheet>
  );
}

function RulesSheet({ rules, onClose, onSave }: { rules: IndoorRules; onClose: () => void; onSave: (patch: RulesPatch) => void }) {
  const [draft, setDraft] = useState(rules);
  const patch = useMemo(() => {
    const p: Record<string, unknown> = {};
    for (const k of Object.keys(draft) as (keyof IndoorRules)[]) {
      if (k === 'schema' || k === 'presetId' || k === 'name') continue;
      if (JSON.stringify(draft[k]) !== JSON.stringify(rules[k])) p[k] = draft[k];
    }
    return p as RulesPatch;
  }, [draft, rules]);
  const changed = Object.keys(patch).length > 0;
  return (
    <Sheet title="Change rules" onClose={onClose}>
      <p className="mb-4 text-sand">Changes apply from the next ball. Balls already bowled keep the old rules.</p>
      <RulesEditor rules={draft} onChange={setDraft} />
      <button type="button" disabled={!changed} className="btn btn-gold btn-lg sticky bottom-0 mt-5 w-full" onClick={() => onSave(patch)}>
        {changed ? 'Use these rules from now' : 'No changes yet'}
      </button>
    </Sheet>
  );
}

function Break({ state, inn, onStart }: { state: MatchState; inn: InningsState; onStart: (evs: EventData[]) => void }) {
  const players = state.teams[inn.batting].players;
  const bowlers = state.teams[inn.bowling].players;
  const [a, setA] = useState<string | null>(inn.striker);
  const [b, setB] = useState<string | null>(inn.nonStriker);
  const [bowler, setBowler] = useState<string | null>(null);
  const first = state.innings[0];
  const ok = a && b && a !== b && bowler;
  return (
    <section className="mx-4 mt-5 space-y-5">
      <div className="card p-4">
        <p className="eyebrow">Innings break</p>
        <p className="mt-2 text-sand">
          {state.teams[first.batting].name} made {teamTotal(state, first.batting)}/{first.wickets}. {state.teams[inn.batting].name} need {target(state)} to win
          {state.rules.match.inningsEnd === 'allOvers' ? ', all overs are bowled.' : '.'}
        </p>
      </div>
      <Pick title="On strike" list={players} value={a} onPick={(x) => (setA(x), x === b && setB(a))} />
      <Pick title="At the other end" list={players} value={b} onPick={(x) => (setB(x), x === a && setA(b))} />
      <Pick title="Opening bowler" list={bowlers} value={bowler} onPick={setBowler} />
      <button
        type="button"
        disabled={!ok}
        className="btn btn-gold btn-lg w-full"
        onClick={() =>
          ok &&
          onStart([
            { type: 'openers', data: { strikerId: a, nonStrikerId: b } },
            { type: 'overStart', data: { bowlerId: bowler } },
          ])
        }
      >
        Start the second innings
      </button>
    </section>
  );
}

function Pick({ title, list, value, onPick }: { title: string; list: { id: string; name: string }[]; value: string | null; onPick: (id: string) => void }) {
  return (
    <div>
      <p className="field-label">{title}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onPick(p.id)} className={`min-h-11 px-3 ${value === p.id ? 'bg-gold font-semibold text-ink' : 'border border-cream/22 text-cream'}`}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Finished({ state, slug, id }: { state: MatchState; slug: string; id: string }) {
  return (
    <section className="mx-4 mt-6 space-y-4">
      <div className="card border-gold p-5">
        <p className="eyebrow">Result</p>
        <p className="h-sub mt-2 text-3xl">{resultText(state)}</p>
        <ul className="mt-4 space-y-1 text-sand">
          {state.innings.map((i) => (
            <li key={i.index} className="flex justify-between">
              <span>{state.teams[i.batting].name}</span>
              <span className="font-varsity">
                {teamTotal(state, i.batting)}/{i.wickets} <span className="text-muted">({oversText(i.legalBalls, state.rules.match.ballsPerOver)})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/score/${id}/card`} className="btn btn-gold min-h-14 justify-center">
          Scorecard
        </Link>
        <ShareButton slug={slug} />
      </div>
      <Link href="/score/new" className="btn btn-outline btn-lg w-full">
        New match
      </Link>
      <p className="text-center text-sm text-muted">Made a mistake? Undo takes back the last ball and reopens the match.</p>
    </section>
  );
}

function ReadOnly({ state, id, pull }: { state: MatchState; id: string; pull: () => Promise<boolean> }) {
  const inn = state.innings[state.current];
  // Another member is scoring: keep this copy fresh.
  useEffect(() => {
    if (state.status === 'complete') return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pull().catch(() => {});
    }, 5000);
    return () => window.clearInterval(t);
  }, [pull, state.status]);
  return (
    <section className="mx-4 mt-6 space-y-4">
      <p className="text-sand">Another member is scoring this match. This screen updates on its own.</p>
      <OverStrip over={inn.overs[inn.overs.length - 1]?.balls ?? []} onPick={() => {}} />
      <Link href={`/score/${id}/card`} className="btn btn-gold btn-lg w-full">
        Scorecard
      </Link>
    </section>
  );
}

type DirectoryEntry = { id: string; full_name: string | null };

// Approved members the match can be handed to. The new scorer finds it under My matches.
function HandoverSheet({ current, onClose, onPick }: { current: string | null; onClose: () => void; onPick: (userId: string) => Promise<string | null> }) {
  const [people, setPeople] = useState<DirectoryEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    createClientComponentClient()
      .rpc('member_directory')
      .then(({ data }) => setPeople(((data ?? []) as DirectoryEntry[]).sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''))));
  }, []);

  const list = (people ?? []).filter((p) => p.id !== current && (p.full_name ?? '').toLowerCase().includes(query.trim().toLowerCase()));

  const pick = async (p: DirectoryEntry) => {
    setBusy(p.id);
    const error = await onPick(p.id);
    setBusy(null);
    if (error) toast.error(error);
    else {
      toast.success(`${p.full_name ?? 'The member'} can score this match now`);
      onClose();
    }
  };

  return (
    <Sheet title="Hand over scoring" onClose={onClose}>
      <p className="text-sand">
        The member you pick can score this match from their own phone, under My matches. The member who started the match and admins can always score too.
      </p>
      <label htmlFor="handover-search" className="field-label mt-4">
        Find a member
      </label>
      <input id="handover-search" className="field" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      <div className="mt-3 grid gap-2">
        {people === null && <div className="skeleton h-12" role="status" aria-label="Loading members" />}
        {people !== null && list.length === 0 && <p className="text-muted">No members found.</p>}
        {list.slice(0, 30).map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy !== null}
            onClick={() => pick(p)}
            className="flex min-h-12 items-center justify-between border border-cream/22 px-3 text-left text-cream disabled:opacity-50"
          >
            {p.full_name ?? 'Member'}
            {busy === p.id && <span className="text-sm text-muted">Handing over</span>}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
