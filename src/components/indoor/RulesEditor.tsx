'use client';

import { useId, useState } from 'react';
import type { DismissalKind, IndoorRules, Zone } from '@/lib/indoor/rules';
import { DISMISSAL_LABEL } from '@/lib/indoor/rules';

type OnRules = (next: IndoorRules) => void;

// Every house rule in plain English. The common groups are open, the rest fold away.
export default function RulesEditor({ rules, onChange, hideMatch = false }: { rules: IndoorRules; onChange: OnRules; hideMatch?: boolean }) {
  const r = rules;
  const set = <K extends keyof IndoorRules>(key: K, patch: Partial<IndoorRules[K]>) =>
    onChange({ ...r, [key]: { ...(r[key] as object), ...patch } } as IndoorRules);

  return (
    <div className="space-y-3">
      {!hideMatch && (
        <Group title="Match" open>
          <Num label="Balls per over" value={r.match.ballsPerOver} min={1} max={12} onChange={(v) => set('match', { ballsPerOver: v })} />
          <Num label="Minimum players per side" value={r.match.minPlayers} min={1} max={15} onChange={(v) => set('match', { minPlayers: v })} />
          <OptionalNum label="Most overs per bowler" off="No limit" value={r.match.maxOversPerBowler} fallback={3} min={1} max={20} onChange={(v) => set('match', { maxOversPerBowler: v })} />
          <Toggle label="A bowler may bowl two overs in a row" value={r.match.consecutiveOversAllowed} onChange={(v) => set('match', { consecutiveOversAllowed: v })} />
          <Toggle label="Batters change ends after each over" value={r.match.swapEndsAtOverEnd} onChange={(v) => set('match', { swapEndsAtOverEnd: v })} />
          <Choice
            label="The second innings ends"
            value={r.match.inningsEnd}
            options={[
              { value: 'chaseStops', label: 'When the target is reached' },
              { value: 'allOvers', label: 'After all overs, always' },
            ]}
            onChange={(v) => set('match', { inningsEnd: v })}
          />
        </Group>
      )}

      <Group title="Walls" open>
        <Walls rules={r} onChange={onChange} />
        <Toggle
          label="Side walls only pay if a run is completed"
          hint="The far wall always pays."
          value={r.running.wallRunsNeedACompletedRun}
          onChange={(v) => set('running', { wallRunsNeedACompletedRun: v })}
        />
      </Group>

      <Group title="Extras" open>
        <Num label="Wide" suffix="runs" value={r.extras.wideRuns} min={0} max={10} onChange={(v) => set('extras', { wideRuns: v })} />
        <Num label="No ball" suffix="runs" value={r.extras.noBallRuns} min={0} max={10} onChange={(v) => set('extras', { noBallRuns: v })} />
        <Choice
          label="Bowl wides and no balls again"
          value={r.extras.rebowl}
          options={[
            { value: 'finalOver', label: 'In the final over only' },
            { value: 'never', label: 'Never, they count as a ball' },
            { value: 'always', label: 'Always' },
          ]}
          onChange={(v) => set('extras', { rebowl: v })}
        />
        <Toggle label="Runs run on a wide count" value={r.extras.runsRunOnWideCount} onChange={(v) => set('extras', { runsRunOnWideCount: v })} />
        <Toggle label="Free hit after a no ball" value={r.extras.freeHitAfterNoBall} onChange={(v) => set('extras', { freeHitAfterNoBall: v })} />
        <Toggle label="Byes allowed" value={r.extras.byesAllowed} onChange={(v) => set('extras', { byesAllowed: v })} />
        <Toggle label="Leg byes allowed" value={r.extras.legByesAllowed} onChange={(v) => set('extras', { legByesAllowed: v })} />
        <OptionalNum
          label="Byes and leg byes off any wall score"
          off="The wall value"
          value={r.extras.byeWallRuns}
          fallback={1}
          min={0}
          max={6}
          onChange={(v) => set('extras', { byeWallRuns: v })}
        />
      </Group>

      <Group title="Wickets" open>
        <Num label="Runs off for each wicket" value={r.wickets.penalty} min={0} max={30} onChange={(v) => set('wickets', { penalty: v })} />
        <Toggle label="Also take them off the batter's score" value={r.wickets.alsoFromBatter} onChange={(v) => set('wickets', { alsoFromBatter: v })} />
        <Toggle label="A wicket ball scores nothing else" value={r.wickets.wicketBallScoresNothing} onChange={(v) => set('wickets', { wicketBallScoresNothing: v })} />
        <Num label="Extra runs off when the whole side is out" value={r.wickets.allOutPenalty} min={0} max={50} onChange={(v) => set('wickets', { allOutPenalty: v })} />
        <Choice
          label="When the whole side is out"
          value={r.wickets.onAllOut}
          options={[
            { value: 'continue', label: 'Batters come back in the order they got out' },
            { value: 'endInnings', label: 'The innings ends' },
          ]}
          onChange={(v) => set('wickets', { onAllOut: v })}
        />
      </Group>

      <Group title="Batting" open>
        <OptionalNum label="Retire at" suffix="runs" off="No retirement" value={r.batting.retireAt} fallback={30} min={1} max={200} onChange={(v) => set('batting', { retireAt: v })} />
        {r.batting.retireAt != null && (
          <Toggle label="Show a retired batter on the retire score" hint="The side keeps every run either way." value={r.batting.capAtRetire} onChange={(v) => set('batting', { capAtRetire: v })} />
        )}
        <Toggle label="Retired batters come back with the others" value={r.wickets.retiredRejoinQueue} onChange={(v) => set('wickets', { retiredRejoinQueue: v })} />
      </Group>

      <Group title="Short side">
        <Toggle label="Bigger penalty for a short side" value={r.wickets.shortSide.enabled} onChange={(v) => set('wickets', { shortSide: { ...r.wickets.shortSide, enabled: v } })} />
        {r.wickets.shortSide.enabled && (
          <>
            <Num label="Applies with this many players or fewer" value={r.wickets.shortSide.maxPlayers} min={1} max={15} onChange={(v) => set('wickets', { shortSide: { ...r.wickets.shortSide, maxPlayers: v } })} />
            <Num label="On every wicket number" value={r.wickets.shortSide.everyNth} min={1} max={15} onChange={(v) => set('wickets', { shortSide: { ...r.wickets.shortSide, everyNth: v } })} />
            <Num label="Runs off on that wicket" value={r.wickets.shortSide.penalty} min={0} max={50} onChange={(v) => set('wickets', { shortSide: { ...r.wickets.shortSide, penalty: v } })} />
          </>
        )}
      </Group>

      <Group title="Running and dead balls">
        <OptionalNum label="Most runs on one ball" off="No limit" value={r.running.maxRunsPerBall} fallback={3} min={1} max={10} onChange={(v) => set('running', { maxRunsPerBall: v })} />
        <Num label="A dead ball keeps at most" suffix="runs run" value={r.running.deadBallMaxRuns} min={0} max={5} onChange={(v) => set('running', { deadBallMaxRuns: v })} />
        <Toggle
          label="After a last ball wicket the new batter goes to the non striker's end"
          value={r.wickets.newBatterNonStrikerAfterLastBall}
          onChange={(v) => set('wickets', { newBatterNonStrikerAfterLastBall: v })}
        />
      </Group>

      <Group title="Ways to be out">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {(Object.keys(DISMISSAL_LABEL) as DismissalKind[]).map((k) => (
            <Toggle
              key={k}
              label={DISMISSAL_LABEL[k]}
              value={r.wickets.allowed.includes(k)}
              onChange={(v) => set('wickets', { allowed: v ? [...r.wickets.allowed, k] : r.wickets.allowed.filter((x) => x !== k) })}
            />
          ))}
        </div>
      </Group>

      <Group title="Penalties and points">
        <Num label="Behaviour penalty" suffix="runs" value={r.penalties.behaviourRuns} min={0} max={50} onChange={(v) => set('penalties', { behaviourRuns: v })} />
        <Num label="Points for a win" value={r.points.win} min={0} max={10} onChange={(v) => set('points', { win: v })} />
        <Num label="Points for a tie" value={r.points.tie} min={0} max={10} onChange={(v) => set('points', { tie: v })} />
      </Group>
    </div>
  );
}

// Side walls can be one zone per half, or each far half split again into two.
function Walls({ rules, onChange }: { rules: IndoorRules; onChange: OnRules }) {
  const zones = rules.zones;
  const split = zones.some((z) => z.area === 'farLeftA');
  const update = (id: string, patch: Partial<Zone>) => onChange({ ...rules, zones: zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) });

  const toggleSplit = () => {
    if (split) {
      const rest = zones.filter((z) => !['farLeftA', 'farLeftB', 'farRightA', 'farRightB'].includes(z.area));
      const make = (side: 'Left' | 'Right'): Zone => ({ id: `far${side}`, label: `Far side wall, ${side.toLowerCase()}`, area: `far${side}`, runs: 2, allowRunning: true, catchOffIsOut: true, boundary: false, enabled: true });
      onChange({ ...rules, zones: [...rest, make('Left'), make('Right')] });
    } else {
      const rest = zones.filter((z) => z.area !== 'farLeft' && z.area !== 'farRight');
      const half = (side: 'Left' | 'Right', part: 'A' | 'B'): Zone => ({
        id: `far${side}${part}`,
        label: `Far side wall, ${side.toLowerCase()}, ${part === 'A' ? 'first' : 'second'} half`,
        area: `far${side}${part}`,
        runs: part === 'A' ? 1 : 2,
        allowRunning: true,
        catchOffIsOut: true,
        boundary: false,
        enabled: true,
      });
      onChange({ ...rules, zones: [...rest, half('Left', 'A'), half('Left', 'B'), half('Right', 'A'), half('Right', 'B')] });
    }
  };

  return (
    <div className="space-y-2">
      {zones.map((z) => (
        <div key={z.id} className={`border border-cream/12 p-3 ${z.enabled ? '' : 'opacity-60'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-cream">{z.label}</p>
            <Stepper value={z.runs} min={0} max={12} label={`${z.label} runs`} onChange={(v) => update(z.id, { runs: v })} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill on={z.allowRunning} onClick={() => update(z.id, { allowRunning: !z.allowRunning })}>
              Running allowed
            </Pill>
            <Pill on={z.catchOffIsOut} onClick={() => update(z.id, { catchOffIsOut: !z.catchOffIsOut })}>
              Catch off it is out
            </Pill>
            <Pill on={z.boundary} onClick={() => update(z.id, { boundary: !z.boundary })}>
              Boundary
            </Pill>
            <Pill on={z.enabled} onClick={() => update(z.id, { enabled: !z.enabled })}>
              In use
            </Pill>
          </div>
        </div>
      ))}
      <button type="button" onClick={toggleSplit} className="btn btn-outline w-full">
        {split ? 'Use one zone for each far side wall' : 'Split the far side walls into two halves'}
      </button>
    </div>
  );
}

function Group({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(open);
  const id = useId();
  return (
    <section className="border border-cream/12 bg-ink/40">
      <button type="button" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(!isOpen)} className="flex min-h-12 w-full items-center justify-between px-4 text-left">
        <span className="h-sub text-lg">{title}</span>
        <span aria-hidden className={`text-gold transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {isOpen && (
        <div id={id} className="space-y-3 border-t border-cream/12 p-4">
          {children}
        </div>
      )}
    </section>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-9 px-3 text-sm font-semibold transition-colors duration-150 ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-muted'}`}
    >
      {children}
    </button>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="text-cream">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={value} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold ${value ? 'bg-gold' : 'bg-cream/20'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-transform duration-200 ease-out-expo ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </label>
  );
}

export function Stepper({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center" role="group" aria-label={label}>
      <button type="button" aria-label="Less" onClick={() => onChange(clamp(value - 1))} className="grid h-11 w-11 place-items-center border border-cream/22 text-xl text-cream">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value !== '' && onChange(clamp(Number(e.target.value)))}
        className="h-11 w-14 border-y border-cream/22 bg-transparent text-center text-base text-cream [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label="More" onClick={() => onChange(clamp(value + 1))} className="grid h-11 w-11 place-items-center border border-cream/22 text-xl text-cream">
        +
      </button>
    </div>
  );
}

function Num({ label, suffix, value, min, max, onChange }: { label: string; suffix?: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-cream">
        {label}
        {suffix && <span className="text-muted"> ({suffix})</span>}
      </span>
      <Stepper value={value} min={min} max={max} label={label} onChange={onChange} />
    </div>
  );
}

function OptionalNum({ label, suffix, off, value, min, max, fallback, onChange }: { label: string; suffix?: string; off: string; value: number | null; min: number; max: number; fallback: number; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-2">
      <Toggle label={label + (suffix && value != null ? ` (${suffix})` : '')} hint={value == null ? off : undefined} value={value != null} onChange={(v) => onChange(v ? fallback : null)} />
      {value != null && (
        <div className="flex justify-end">
          <Stepper value={value} min={min} max={max} label={label} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-cream">{label}</legend>
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-11 px-3 text-left transition-colors duration-150 ${value === o.value ? 'bg-gold font-semibold text-ink' : 'border border-cream/22 text-cream'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
