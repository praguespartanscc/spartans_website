'use client';

import { useEffect, useState } from 'react';
import type { IndoorRules } from '@/lib/indoor/rules';
import { cloneRules, normaliseZones } from '@/lib/indoor/rules';
import { PRESETS } from '@/lib/indoor/presets';
import RulesEditor from './RulesEditor';
import { rulesSummary } from './Scorer';

const OVERS = [5, 6, 8, 10, 12, 15];
const LAST_RULES = 'indoor:lastRules';

export function loadLastRules(): IndoorRules | null {
  try {
    const raw = localStorage.getItem(LAST_RULES);
    if (!raw) return null;
    const r = JSON.parse(raw) as IndoorRules;
    return { ...r, zones: normaliseZones(r.zones) };
  } catch {
    return null;
  }
}

export function rememberRules(rules: IndoorRules): void {
  try {
    localStorage.setItem(LAST_RULES, JSON.stringify({ ...rules, presetId: 'last', name: 'My last rules' }));
  } catch {
    // storage blocked: nothing to remember
  }
}

// Pick a set of rules to start from, the number of overs, and change any rule if needed.
// base is the preset picked, rules is what will be used.
export default function RulesPicker({ base, rules, onBase, onRules }: { base: IndoorRules; rules: IndoorRules; onBase: (r: IndoorRules) => void; onRules: (r: IndoorRules) => void }) {
  const [customise, setCustomise] = useState(false);
  const [last, setLast] = useState<IndoorRules | null>(null);
  useEffect(() => setLast(loadLastRules()), []);

  const pick = (p: IndoorRules) => {
    const r = { ...cloneRules(p), zones: normaliseZones(p.zones) };
    onBase(r);
    onRules(r);
  };
  const setOvers = (o: number) => onRules({ ...rules, match: { ...rules.match, oversPerInnings: o } });

  return (
    <div className="space-y-5">
      <div>
        <p className="field-label">Start from</p>
        <div className="flex flex-wrap gap-2">
          {[...PRESETS, ...(last ? [last] : [])].map((p) => (
            <button
              key={p.presetId}
              type="button"
              aria-pressed={base.presetId === p.presetId}
              onClick={() => pick(p)}
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
              onClick={() => setOvers(o)}
              className={`h-12 w-12 font-varsity text-lg ${rules.match.oversPerInnings === o ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
            >
              {o}
            </button>
          ))}
          <OversInput value={rules.match.oversPerInnings} onChange={setOvers} />
        </div>
      </div>
      {customise ? (
        <RulesEditor rules={rules} onChange={onRules} base={base} />
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
