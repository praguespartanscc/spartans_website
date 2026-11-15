'use client';

import { useMemo, useState } from 'react';
import type { PlayerTotals } from '@/lib/indoor/stats';
import { likelyDuplicates, mergeSpellings, roster as fullRoster, sharedGames, splitSpelling } from '@/lib/indoor/stats';
import { newId } from '@/lib/indoor/store';
import type { Alias, SquadPlayer, TournamentTeam } from '@/lib/indoor/tournament';
import { ConfirmButton } from './RulesEditor';

const games = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;
const figures = (p: PlayerTotals) => `${games(p.matches)}, ${p.bat.runs} ${p.bat.runs === 1 ? 'run' : 'runs'}, ${p.bowl.wickets} ${p.bowl.wickets === 1 ? 'wicket' : 'wickets'}`;

// One player, two spellings: "Thilak" in the squad and "Tilak" typed in late show up as two
// players in the stats. The organiser says they are one person and every table adds them up.
// No scored match is changed, so a merge can always be undone.
export default function PlayerMerge({
  teams,
  players,
  busy,
  save,
}: {
  teams: TournamentTeam[];
  players: PlayerTotals[];
  busy: boolean;
  // Saves a team's squad. An award pointing at one of the `from` player keys moves to `to`.
  save: (team: TournamentTeam, squad: SquadPlayer[], moved: { from: string[]; to: string } | null, done: string) => Promise<boolean>;
}) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [keepKey, setKeepKey] = useState('');
  const [otherKey, setOtherKey] = useState('');

  // Everyone: those with figures, and squad members who have not played.
  const everyone = useMemo(() => fullRoster(players, teams), [players, teams]);
  const roster = useMemo(() => everyone.filter((p) => p.teamId === teamId).sort((a, b) => a.name.localeCompare(b.name)), [everyone, teamId]);
  const suggestions = useMemo(() => likelyDuplicates(everyone), [everyone]);
  const merged = teams.flatMap((t) => t.squad.filter((p) => p.aka?.length).map((p) => ({ team: t, player: p })));

  const keep = roster.find((p) => p.key === keepKey);
  const other = roster.find((p) => p.key === otherKey);
  const shared = keep && other ? sharedGames(keep, other) : 0;

  async function merge(a: PlayerTotals, b: PlayerTotals) {
    const t = teams.find((x) => x.id === a.teamId);
    if (!t || a.key === b.key) return;
    const squad = mergeSpellings(t.squad, a, b, newId);
    // A name that was only typed in gets a squad entry, so its key changes too.
    const target = squad.find((p) => p.aka?.some((x) => (x.id ? b.key === `${t.id}:${x.id}` : x.name === b.name)));
    const to = target ? `${t.id}:${target.id}` : a.key;
    if (await save(t, squad, { from: [a.key, b.key], to }, `${b.name} now counts as ${a.name}`)) {
      setKeepKey('');
      setOtherKey('');
    }
  }
  const split = (t: TournamentTeam, p: SquadPlayer, alias: Alias) => save(t, splitSpelling(t.squad, p.id, alias), null, `${alias.name} is a separate player again`);

  return (
    <div className="space-y-5">
      <p className="text-sand">
        When one player appears twice in the stats under two spellings, merge them here. Their runs, wickets and catches are added together. No scored match is changed, and a merge can be undone.
      </p>

      {suggestions.length > 0 && (
        <div>
          <p className="field-label">These look like the same player</p>
          <ul className="space-y-2">
            {suggestions.map(([a, b]) => (
              <li key={`${a.key}|${b.key}`} className="border border-gold bg-gold/10 p-3">
                <p className="text-cream">
                  <span className="font-semibold">{b.name}</span> and <span className="font-semibold">{a.name}</span> <span className="text-muted">({a.team})</span>
                </p>
                <p className="mt-1 text-sm text-sand">
                  {b.name}: {figures(b)}. {a.name}: {figures(a)}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} className="btn btn-gold" onClick={() => merge(a, b)}>
                    Keep {a.name}
                  </button>
                  <button type="button" disabled={busy} className="btn btn-outline" onClick={() => merge(b, a)}>
                    Keep {b.name}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <p className="field-label">Merge two names by hand</p>
        {teams.length > 1 && (
          <label className="block">
            <span className="sr-only">Team</span>
            <select className="field" value={teamId} onChange={(e) => (setTeamId(e.target.value), setKeepKey(''), setOtherKey(''))}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {roster.length < 2 ? (
          <p className="text-muted">This team needs at least two names before anything can be merged.</p>
        ) : (
          <>
            <label className="block">
              <span className="field-label">The name to keep</span>
              <select className="field" value={keepKey} onChange={(e) => setKeepKey(e.target.value)}>
                <option value="">Choose</option>
                {roster
                  .filter((p) => p.key !== otherKey)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name} ({games(p.matches)})
                    </option>
                  ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">The other spelling of the same player</span>
              <select className="field" value={otherKey} onChange={(e) => setOtherKey(e.target.value)}>
                <option value="">Choose</option>
                {roster
                  .filter((p) => p.key !== keepKey)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name} ({games(p.matches)})
                    </option>
                  ))}
              </select>
            </label>
            {keep && other && (
              <div className="space-y-3">
                <p className="text-sand">
                  {other.name} ({figures(other)}) will count as <span className="font-semibold text-cream">{keep.name}</span> ({figures(keep)}).
                </p>
                {shared > 0 ? (
                  <>
                    <p role="alert" className="border border-crimson-hi bg-crimson/30 px-3 py-2 text-sm text-cream">
                      They both played in {shared === 1 ? 'the same game' : `the same ${shared} games`}, so they are probably two different people.
                    </p>
                    <ConfirmButton danger label="Merge anyway" confirm="Tap again to merge" onConfirm={() => void merge(keep, other)} />
                  </>
                ) : (
                  <button type="button" disabled={busy} className="btn btn-gold btn-lg w-full" onClick={() => merge(keep, other)}>
                    Merge into {keep.name}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {merged.length > 0 && (
        <div className="border-t border-cream/12 pt-4">
          <p className="field-label">Merged so far</p>
          <ul className="divide-y divide-cream/10 border border-cream/12">
            {merged.flatMap(({ team: t, player }) =>
              (player.aka ?? []).map((alias) => (
                <li key={`${player.id}|${alias.id ?? alias.name}`} className="flex items-center justify-between gap-3 px-3 py-1">
                  <span className="min-w-0 text-sand">
                    <span className="text-cream">{alias.name}</span> counts as <span className="font-semibold text-cream">{player.name}</span>
                    <span className="block truncate text-xs text-muted">{t.name}</span>
                  </span>
                  <ConfirmButton label="Undo" confirm="Tap again" onConfirm={() => void split(t, player, alias)} />
                </li>
              )),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
