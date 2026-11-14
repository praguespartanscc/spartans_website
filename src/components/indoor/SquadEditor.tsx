'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import type { Player } from '@/lib/indoor/engine';
import { newId } from '@/lib/indoor/store';
import { loadNames, nameKey, nearName } from '@/lib/indoor/names';
import { Close } from '@/components/ui/Icons';

export function Big({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 px-3 font-display text-lg font-bold uppercase italic disabled:opacity-40 ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
    >
      {children}
    </button>
  );
}

export function PickList({ title, players, value, onPick }: { title: string; players: Player[]; value: string | null; onPick: (id: string) => void }) {
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

// The players of each team, in batting order. Names can come from the club's player list, from
// names this phone has used before, or be typed. Either way a plain copy of the name is kept:
// indoor stats never touch the website's player records.
//
// pools: for a tournament game, each team's tournament squad. A squad member left out today can
// be put back with one tap and keeps their id, so their tournament figures stay together.
// unique: 'all' stops one name being in two teams (a match), 'team' only within a team.
export default function SquadEditor({
  names,
  squads,
  setSquads,
  minPlayers,
  pools,
  unique = 'all',
  heading = 'Squads',
  listLabel = 'Batting order',
  team: teamProp,
  onTeam,
}: {
  names: string[];
  squads: Player[][];
  setSquads: (s: Player[][]) => void;
  minPlayers: number;
  pools?: Player[][];
  unique?: 'all' | 'team';
  heading?: string;
  listLabel?: string;
  team?: number;
  onTeam?: (t: number) => void;
}) {
  const [own, setOwn] = useState(0);
  const team = Math.min(teamProp ?? own, Math.max(0, names.length - 1));
  const setTeam = (t: number) => (onTeam ? onTeam(t) : setOwn(t));
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [club, setClub] = useState<ClubPlayer[]>([]);
  // Names used before on this phone, so a player is spelled the same way every week.
  const [remembered, setRemembered] = useState<string[]>([]);
  useEffect(() => setRemembered(loadNames()), []);
  // A typed name that looks like a known one: ask before adding a second spelling.
  const [ask, setAsk] = useState<{ typed: string; known: string } | null>(null);

  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase
      .from('players')
      .select('id, name, is_active')
      .order('name')
      .then(({ data }) => setClub(((data ?? []) as (ClubPlayer & { is_active?: boolean | null })[]).filter((p) => p.is_active !== false)));
  }, []);

  const list = squads[team] ?? [];
  const scope = unique === 'all' ? squads.flat() : list;
  const taken = new Set(scope.map((p) => p.name.trim().toLowerCase()));
  const update = (next: Player[]) => setSquads(squads.map((s, i) => (i === team ? next : s)));

  function addName(name: string) {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return;
    if (taken.has(n.toLowerCase())) {
      toast.error(unique === 'all' ? `${n} is already in a squad` : `${n} is already in this team`);
      return;
    }
    // A tournament squad member keeps the id the tournament gave them.
    const member = pools?.[team]?.find((p) => nameKey(p.name) === nameKey(n));
    update([...list, member ?? { id: newId(), name: n.slice(0, 40) }]);
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const known = [...(pools?.[team]?.map((p) => p.name) ?? []), ...remembered, ...club.map((p) => p.name)];
  // Typed by hand: check it against the names this phone and the club already know.
  function addTyped(name: string) {
    const n = name.trim().replace(/\s+/g, ' ');
    if (!n) return;
    const near = nearName(n, known);
    if (near && !taken.has(near.toLowerCase())) return setAsk({ typed: n, known: near });
    addName(n);
  }
  const typedKey = nameKey(typed);
  const hints =
    typedKey.length >= 2
      ? known.filter((n, i) => known.findIndex((x) => nameKey(x) === nameKey(n)) === i && nameKey(n).includes(typedKey) && !taken.has(n.trim().toLowerCase())).slice(0, 8)
      : [];

  const matches = club.filter((p) => !taken.has(p.name.trim().toLowerCase()) && p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 24);
  const benched = (pools?.[team] ?? []).filter((p) => !list.some((x) => x.id === p.id));

  return (
    <section className="space-y-5">
      <h2 className="h-sub text-2xl">{heading}</h2>
      {names.length > 1 && (
        <div className={names.length === 2 ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'} role="tablist">
          {names.map((name, t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={team === t}
              onClick={() => setTeam(t)}
              className={`min-h-12 truncate px-3 font-display font-bold uppercase italic ${names.length > 2 ? 'max-w-full' : ''} ${team === t ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
            >
              {name} ({squads[t]?.length ?? 0})
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="field-label">{listLabel}</p>
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

      {benched.length > 0 && (
        <div>
          <p className="field-label">In the squad, not playing today</p>
          <div className="flex flex-wrap gap-2">
            {benched.map((p) => (
              <button key={p.id} type="button" onClick={() => update([...list, p])} className="min-h-11 border border-cream/22 px-3 text-cream hover:border-gold">
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTyped(typed);
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

      {hints.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-2" aria-label="Names used before">
          {hints.map((n) => (
            <button key={n} type="button" onClick={() => (addName(n), setTyped(''))} className="min-h-11 border border-cream/22 px-3 text-cream hover:border-gold">
              + {n}
            </button>
          ))}
        </div>
      )}
      {ask && (
        <div role="alert" className="border border-gold bg-gold/10 p-3">
          <p className="text-sand">
            Did you mean <span className="font-semibold text-cream">{ask.known}</span>? One spelling per player keeps the scores together.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-gold" onClick={() => (addName(ask.known), setAsk(null))}>
              Use {ask.known}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => (addName(ask.typed), setAsk(null))}>
              Keep {ask.typed}
            </button>
          </div>
        </div>
      )}

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
