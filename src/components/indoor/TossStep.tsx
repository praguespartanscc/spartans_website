'use client';

import { useEffect, useRef, useState } from 'react';
import type { TeamIndex, Toss } from '@/lib/indoor/engine';
import type { Face } from '@/lib/indoor/toss';
import { flip, tossWinner } from '@/lib/indoor/toss';
import { ConfirmButton } from './RulesEditor';
import { Big } from './SquadEditor';

// The toss as far as the scorer has got. Nothing here is saved until the match starts.
export type TossDraft = {
  method: 'coin' | 'manual';
  caller: TeamIndex | null;
  call: Face | null;
  face: Face | null;
  winner: TeamIndex | null;
  choice: 'bat' | 'bowl' | null;
};

export const EMPTY_TOSS: TossDraft = { method: 'coin', caller: null, call: null, face: null, winner: null, choice: null };

export function tossOf(d: TossDraft): Toss | null {
  if (d.winner == null || !d.choice) return null;
  if (d.method === 'coin' && d.caller != null && d.call && d.face) return { winner: d.winner, choice: d.choice, method: 'coin', caller: d.caller, call: d.call, face: d.face };
  return { winner: d.winner, choice: d.choice, method: 'manual' };
}

const SPIN_MS = 1100;
const FACE_NAME: Record<Face, string> = { heads: 'Heads', tails: 'Tails' };

// One captain calls, the coin is flipped once, the winner picks bat or bowl. A real coin can be
// used instead: then the scorer just enters who won.
export default function TossStep({ names, value, onChange }: { names: [string, string]; value: TossDraft; onChange: (d: TossDraft) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [spin, setSpin] = useState(0); // re-keys the coin so the animation runs again
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current != null && window.clearTimeout(timer.current)), []);

  const set = (patch: Partial<TossDraft>) => onChange({ ...value, ...patch });
  const landed = value.method === 'coin' && value.face != null && !spinning;
  const ready = value.caller != null && value.call != null;

  function flipNow() {
    if (value.caller == null || !value.call || spinning) return;
    const caller = value.caller;
    const call = value.call;
    const face = flip();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The face is known at once, the winner is only shown when the coin has landed.
    onChange({ ...value, face, winner: null, choice: null });
    setSpin((n) => n + 1);
    setSpinning(true);
    timer.current = window.setTimeout(
      () => {
        setSpinning(false);
        onChange({ ...value, face, winner: tossWinner(caller, call, face), choice: null });
      },
      still ? 0 : SPIN_MS,
    );
  }

  const again = () => onChange({ ...EMPTY_TOSS, caller: value.caller, call: value.call });

  return (
    <div className="space-y-6">
      {value.method === 'coin' ? (
        <>
          {value.face == null && (
            <>
              <div>
                <p className="field-label">Who calls?</p>
                <div className="grid grid-cols-2 gap-2">
                  {([0, 1] as TeamIndex[]).map((t) => (
                    <Big key={t} on={value.caller === t} onClick={() => set({ caller: t })}>
                      {names[t]}
                    </Big>
                  ))}
                </div>
              </div>
              <div>
                <p className="field-label">{value.caller != null ? `${names[value.caller]} call` : 'The call'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['heads', 'tails'] as Face[]).map((f) => (
                    <Big key={f} on={value.call === f} onClick={() => set({ call: f })}>
                      {FACE_NAME[f]}
                    </Big>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="coin-stage" aria-hidden>
              <div key={spin} className={spin > 0 ? 'coin-lift' : undefined}>
                <div className={`coin ${spin > 0 ? 'coin-flip' : ''}`} style={{ transform: `rotateY(${value.face === 'tails' ? 180 : 0}deg)` }}>
                  <span className="coin-face coin-heads">
                    <span className="font-varsity text-5xl leading-none">H</span>
                    <span className="font-display text-xs font-bold uppercase italic tracking-wider">Heads</span>
                  </span>
                  <span className="coin-face coin-tails">
                    <span className="font-varsity text-5xl leading-none">T</span>
                    <span className="font-display text-xs font-bold uppercase italic tracking-wider">Tails</span>
                  </span>
                </div>
              </div>
            </div>
            <div aria-live="polite" className="min-h-14 text-center">
              {landed && value.face && value.winner != null && value.caller != null && value.call && (
                <>
                  <p className="h-sub text-3xl text-gold">{FACE_NAME[value.face]}</p>
                  <p className="mt-1 text-sand">
                    {names[value.caller]} called {value.call}. <span className="font-semibold text-cream">{names[value.winner]} won the toss.</span>
                  </p>
                </>
              )}
              {spinning && <p className="text-muted">In the air</p>}
            </div>
            {value.face == null && (
              <button type="button" onClick={flipNow} disabled={!ready} className="btn btn-gold btn-lg w-full">
                Flip the coin
              </button>
            )}
            {value.face == null && !ready && <p className="-mt-2 text-sm text-muted">Pick who calls and what they call first.</p>}
          </div>
        </>
      ) : (
        <div>
          <p className="field-label">Who won the toss?</p>
          <div className="grid grid-cols-2 gap-2">
            {([0, 1] as TeamIndex[]).map((t) => (
              <Big key={t} on={value.winner === t} onClick={() => set({ winner: t })}>
                {names[t]}
              </Big>
            ))}
          </div>
        </div>
      )}

      {value.winner != null && !spinning && (
        <div>
          <p className="field-label">{names[value.winner]} chose to</p>
          <div className="grid grid-cols-2 gap-2">
            <Big on={value.choice === 'bat'} onClick={() => set({ choice: 'bat' })}>
              Bat
            </Big>
            <Big on={value.choice === 'bowl'} onClick={() => set({ choice: 'bowl' })}>
              Bowl
            </Big>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cream/12 pt-4">
        {value.method === 'coin' ? (
          <button type="button" className="min-h-11 text-left text-muted underline underline-offset-4 hover:text-cream" onClick={() => onChange({ ...EMPTY_TOSS, method: 'manual' })}>
            We used a real coin
          </button>
        ) : (
          <button type="button" className="min-h-11 text-left text-muted underline underline-offset-4 hover:text-cream" onClick={() => onChange({ ...EMPTY_TOSS })}>
            Flip a coin in the app
          </button>
        )}
        {landed && <ConfirmButton label="Flip again" confirm="Tap again to flip" onConfirm={again} />}
      </div>
    </div>
  );
}
