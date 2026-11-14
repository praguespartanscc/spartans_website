'use client';

import { useMemo } from 'react';
import type { Entrant } from '@/lib/indoor/schedule';
import { checkFit } from '@/lib/indoor/schedule';
import { newId } from '@/lib/indoor/store';
import type { Session, Settings } from '@/lib/indoor/tournament';
import { VENUES } from '@/lib/club';
import { Stepper, Toggle } from './RulesEditor';
import { Close } from '@/components/ui/Icons';

const todayInPrague = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date());

export function newSession(after?: Session): Session {
  if (!after) return { id: newId(), day: todayInPrague(), venue: '', courts: 1, start: '17:00', end: '20:00' };
  // The next session is usually the same hall a week later.
  const d = new Date(`${after.day}T12:00:00`);
  d.setDate(d.getDate() + 7);
  return { ...after, id: newId(), day: new Intl.DateTimeFormat('en-CA').format(d) };
}

function Minutes({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-cream">{label}</span>
      <div className="flex items-center" role="group" aria-label={label}>
        <button type="button" aria-label="Five minutes less" onClick={() => onChange(clamp(value - 5))} className="grid h-11 w-11 place-items-center border border-cream/22 text-xl text-cream">
          −
        </button>
        <span className="grid h-11 w-20 place-items-center border-y border-cream/22 font-varsity text-lg text-cream">{value} min</span>
        <button type="button" aria-label="Five minutes more" onClick={() => onChange(clamp(value + 5))} className="grid h-11 w-11 place-items-center border border-cream/22 text-xl text-cream">
          +
        </button>
      </div>
    </div>
  );
}

// Where and when the games are played: one or more sessions in a hall, how long a game takes,
// and whether a resting team umpires. Says at once whether everything fits, and what would help.
export default function ScheduleEditor({ settings, onChange, entrants, games }: { settings: Settings; onChange: (s: Settings) => void; entrants: Entrant[]; games?: number }) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });
  const setSession = (id: string, patch: Partial<Session>) => set({ sessions: settings.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const fit = useMemo(() => checkFit(entrants, settings), [entrants, settings]);
  const count = games ?? fit.games;
  const venues = Object.values(VENUES).map((v) => v.name);

  return (
    <div className="space-y-5">
      <datalist id="club-venues">
        {venues.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      {settings.sessions.map((s, i) => (
        <fieldset key={s.id} className="space-y-3 border border-cream/12 p-4">
          <legend className="flex w-full items-center justify-between px-1">
            <span className="eyebrow">{settings.sessions.length > 1 ? `Session ${i + 1}` : 'Hall and hours'}</span>
            {settings.sessions.length > 1 && (
              <button type="button" aria-label={`Remove session ${i + 1}`} onClick={() => set({ sessions: settings.sessions.filter((x) => x.id !== s.id) })} className="grid h-11 w-11 place-items-center text-muted hover:text-cream">
                <Close size={18} />
              </button>
            )}
          </legend>
          <div>
            <label htmlFor={`venue-${s.id}`} className="field-label">
              Hall
            </label>
            <input id={`venue-${s.id}`} className="field" list="club-venues" maxLength={80} placeholder="Name of the hall" value={s.venue} onChange={(e) => setSession(s.id, { venue: e.target.value })} autoComplete="off" />
          </div>
          <div>
            <label htmlFor={`day-${s.id}`} className="field-label">
              Date
            </label>
            <input id={`day-${s.id}`} type="date" className="field" value={s.day} onChange={(e) => e.target.value && setSession(s.id, { day: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`start-${s.id}`} className="field-label">
                From
              </label>
              <input id={`start-${s.id}`} type="time" className="field" value={s.start} onChange={(e) => e.target.value && setSession(s.id, { start: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`end-${s.id}`} className="field-label">
                Until
              </label>
              <input id={`end-${s.id}`} type="time" className="field" value={s.end} onChange={(e) => e.target.value && setSession(s.id, { end: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-cream">Courts</span>
            <Stepper value={s.courts} min={1} max={8} label="Courts" onChange={(v) => setSession(s.id, { courts: v })} />
          </div>
        </fieldset>
      ))}
      <button type="button" className="btn btn-outline w-full" onClick={() => set({ sessions: [...settings.sessions, newSession(settings.sessions[settings.sessions.length - 1])] })}>
        Add another session
      </button>

      <div className="space-y-3 border-t border-cream/12 pt-4">
        <Minutes label="One game takes" value={settings.matchMinutes} min={10} max={180} onChange={(v) => set({ matchMinutes: v })} />
        <Minutes label="Changeover between games" value={settings.gapMinutes} min={0} max={30} onChange={(v) => set({ gapMinutes: v })} />
        <Toggle label="A resting team umpires" hint="Each game names a team that is not playing at that time." value={settings.duty} onChange={(v) => set({ duty: v })} />
      </div>

      <div role="status" className={`border p-4 ${fit.fits ? 'border-cream/22' : 'border-gold bg-gold/10'}`}>
        <p className={fit.fits ? 'text-sand' : 'font-semibold text-cream'}>
          {count} {count === 1 ? 'game' : 'games'}, room for {fit.slots}. {fit.fits ? 'It all fits.' : 'It does not fit yet.'}
        </p>
        {!fit.fits && fit.suggestions.length === 0 && (
          <p className="mt-2 text-sand">
            No single change is enough. Add a court, more hours or another session until there is room for {count} games. A format with fewer games also helps.
          </p>
        )}
        {!fit.fits && fit.suggestions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {fit.suggestions.map((s) => (
              <li key={s.kind + s.text}>
                {s.settings ? (
                  <button type="button" className="min-h-11 w-full border border-cream/22 px-3 py-2 text-left text-cream hover:border-gold" onClick={() => set(s.settings!)}>
                    {s.text}
                  </button>
                ) : (
                  <p className="text-sand">{s.text}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
