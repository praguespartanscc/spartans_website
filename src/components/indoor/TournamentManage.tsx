'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import { gamesForLateTeam, gamesOf, groupsFor, hasStarted, pinnedIds, replan, smallestGroup } from '@/lib/indoor/plan';
import { buildFixtures, formatChoices, schedule } from '@/lib/indoor/schedule';
import type { Board } from '@/lib/indoor/standings';
import type { PlayerTotals } from '@/lib/indoor/stats';
import { newId } from '@/lib/indoor/store';
import type { Fixture, Format, Points, Settings, TournamentData, TournamentTeam } from '@/lib/indoor/tournament';
import { forgetTournament } from '@/lib/indoor/tstore';
import type { Saved } from '@/lib/indoor/tsync';
import { PROBLEM_TEXT, deleteTournament, saveSchedule, updateTournament } from '@/lib/indoor/tsync';
import type { Member } from './MemberGate';
import { ConfirmButton, Stepper, Toggle } from './RulesEditor';
import ScheduleEditor from './ScheduleEditor';

type Panel = 'schedule' | 'format' | 'teams' | 'points' | 'awards' | 'people' | 'name' | null;
type DirectoryEntry = { id: string; full_name: string | null };

// The day and time in Prague, where the halls are.
function pragueNow(): { day: string; starts: string } {
  const now = new Date();
  return {
    day: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(now),
    starts: new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now),
  };
}

const sameFormat = (a: Format, b: Format) => a.kind === b.kind && a.legs === b.legs && a.groups === b.groups && a.finals === b.finals;

function Section({ id, title, hint, open, onToggle, children }: { id: Panel; title: string; hint: string; open: boolean; onToggle: (p: Panel) => void; children: React.ReactNode }) {
  return (
    <section className="border border-cream/12">
      <button type="button" aria-expanded={open} onClick={() => onToggle(open ? null : id)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left">
        <span>
          <span className="h-sub block text-lg">{title}</span>
          <span className="block text-sm text-muted">{hint}</span>
        </span>
        <span aria-hidden className={`text-xl text-gold transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && <div className="space-y-4 border-t border-cream/12 p-4">{children}</div>}
    </section>
  );
}

// Everything only the organiser does: plan the games again, add or withdraw a team, set the
// points, name the player of the tournament, share the job, finish or delete.
export default function TournamentManage({ data, board, players, member, reload }: { data: TournamentData; board: Board; players: PlayerTotals[]; member: Member; reload: () => Promise<void> }) {
  const router = useRouter();
  const t = data.tournament;
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Settings>(t.settings);
  const [name, setName] = useState(t.name);
  const [newTeam, setNewTeam] = useState('');
  const [leaving, setLeaving] = useState('');
  const [people, setPeople] = useState<DirectoryEntry[] | null>(null);
  useEffect(() => setSettings(t.settings), [t.rev]); // eslint-disable-line react-hooks/exhaustive-deps

  const started = hasStarted(data.fixtures, data.matches);
  const active = data.teams.filter((x) => !x.withdrawn);
  const entrants = useMemo(() => [...active].sort((a, b) => a.seed - b.seed).map((x, i) => ({ id: x.id, seed: i + 1 })), [active]);
  const left = data.fixtures.filter((f) => !pinnedIds(data.fixtures, data.matches).includes(f.id));
  const allIds = data.fixtures.map((f) => f.id);
  const choices = formatChoices(active.length);

  useEffect(() => {
    if (panel !== 'people' || people) return;
    createClientComponentClient()
      .rpc('member_directory')
      .then(({ data: list }) => setPeople(((list ?? []) as DirectoryEntry[]).filter((p) => p.id !== t.created_by)));
  }, [panel, people, t.created_by]);

  async function run(work: () => Promise<Saved>, ok: string): Promise<boolean> {
    setBusy(true);
    try {
      const res = await work();
      if (!res.ok) {
        toast.error(PROBLEM_TEXT[res.problem]);
        if (res.problem === 'stale') await reload();
        return false;
      }
      toast.success(ok);
      await reload();
      return true;
    } finally {
      setBusy(false);
    }
  }
  const supabase = () => createClientComponentClient();

  // A tournament nobody has played in yet is simply built again from its teams.
  function rebuild(teams: TournamentTeam[], next: Settings, removeTeams: string[] = []) {
    const order = [...teams].sort((a, b) => a.seed - b.seed).map((x, i) => ({ ...x, seed: i + 1, sort: i }));
    const seeds = order.map((x) => ({ id: x.id, seed: x.seed }));
    const groups = groupsFor(seeds, next.format);
    const placed = schedule(buildFixtures(t.id, seeds, next.format, newId), next);
    return saveSchedule(supabase(), t, { settings: next, teams: order.map((x) => ({ ...x, grp: groups[x.id] ?? null })), fixtures: placed.fixtures, removeTeams });
  }

  const planAgain = () =>
    run(async () => {
      if (!started) return rebuild(active, settings);
      const placed = replan(data.fixtures, data.matches, settings, pragueNow());
      return saveSchedule(supabase(), t, { settings, fixtures: placed.fixtures }, allIds);
    }, 'Schedule planned again');

  const changeFormat = (format: Format) => run(() => rebuild(active, { ...settings, format }), 'Format changed');

  const addTeam = () => {
    const clean = newTeam.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!clean) return;
    if (data.teams.some((x) => x.name.trim().toLowerCase() === clean.toLowerCase())) return void toast.error('Another team has that name.');
    const kind = t.settings.format.kind;
    if (started && kind !== 'roundRobin' && kind !== 'groups') return void toast.error('A team cannot join a series or a knockout once it has started.');
    const seed = Math.max(0, ...data.teams.map((x) => x.seed)) + 1;
    const team: TournamentTeam = { id: newId(), tournament_id: t.id, name: clean, short: null, seed, grp: null, squad: [], withdrawn: false, sort: data.teams.length };
    void run(async () => {
      if (!started) return rebuild([...active, team], t.settings);
      team.grp = smallestGroup(data.teams);
      const extra = gamesForLateTeam(t.id, team, data.teams, t.settings.format, Math.max(0, ...data.fixtures.map((f) => f.seq)) + 1, newId);
      const placed = replan([...data.fixtures, ...extra], data.matches, t.settings, pragueNow());
      return saveSchedule(supabase(), t, { teams: [team], fixtures: placed.fixtures }, allIds);
    }, `${clean} added`).then((ok) => ok && setNewTeam(''));
  };

  // remove: every league game of the team is struck out. award: what is left goes to the opponents.
  const withdraw = (mode: 'remove' | 'award') => {
    const team = data.teams.find((x) => x.id === leaving);
    if (!team) return;
    void run(async () => {
      if (!started) return rebuild(active.filter((x) => x.id !== team.id), t.settings, [team.id]);
      const { played, left: toPlay } = gamesOf(team.id, data.fixtures, data.matches);
      const other = (f: Fixture) => (f.home.kind === 'team' && f.home.id !== team.id ? f.home.id : f.away.kind === 'team' ? f.away.id : null);
      const changed: Fixture[] =
        mode === 'remove'
          ? [...played, ...toPlay].map((f) => ({ ...f, status: 'cancelled' as const, winner_id: null, note: `${team.name} withdrew` }))
          : toPlay.map((f) => ({ ...f, status: 'walkover' as const, winner_id: other(f), note: `${team.name} withdrew` }));
      return saveSchedule(supabase(), t, { teams: [{ ...team, withdrawn: true }], fixtures: changed }, allIds);
    }, `${team.name} withdrawn`).then((ok) => ok && setLeaving(''));
  };

  const savePoints = (points: Points) => run(() => updateTournament(supabase(), t.id, { settings: { ...t.settings, points } }), 'Points saved');
  const setSetting = (patch: Partial<Settings>, ok: string) => run(() => updateTournament(supabase(), t.id, { settings: { ...t.settings, ...patch } }), ok);
  const mvp = [...players].sort((a, b) => b.mvp - a.mvp);
  const final = data.fixtures.find((f) => f.stage === 'final');
  const finalTied = final ? board.outcome(final).tie && !board.outcome(final).winner : false;
  const withdrawing = data.teams.find((x) => x.id === leaving);
  const withdrawingGames = withdrawing ? gamesOf(withdrawing.id, data.fixtures, data.matches) : null;

  return (
    <div className="space-y-3">
      <Section id="schedule" title="Schedule" hint={started ? `${left.length} games left to place` : 'Halls, hours and courts'} open={panel === 'schedule'} onToggle={setPanel}>
        <p className="text-sand">
          {started ? 'Games that are live or finished stay exactly where they are. So do games you moved by hand. Everything else is placed again.' : 'Nothing has been played yet, so the whole schedule is made again.'}
        </p>
        <ScheduleEditor settings={settings} onChange={setSettings} entrants={entrants} games={data.fixtures.filter((f) => f.status !== 'cancelled').length} />
        <button type="button" disabled={busy} className="btn btn-gold btn-lg w-full" onClick={planAgain}>
          Plan the games again
        </button>
      </Section>

      {!started && (
        <Section id="format" title="Format" hint="Can be changed until the first game" open={panel === 'format'} onToggle={setPanel}>
          <div className="grid gap-2">
            {choices.map((c) => {
              const on = sameFormat(c.format, t.settings.format);
              return (
                <button key={c.title} type="button" disabled={busy || on} onClick={() => changeFormat({ ...c.format, thirdPlace: t.settings.format.thirdPlace })} className={`p-3 text-left ${on ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display font-bold uppercase italic">{c.title}</span>
                    <span className={`shrink-0 text-sm ${on ? 'text-ink' : 'text-muted'}`}>{c.games} games</span>
                  </span>
                  <span className={`mt-1 block text-sm ${on ? 'text-ink' : 'text-sand'}`}>{c.detail}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section id="teams" title="Add or withdraw a team" hint={`${active.length} teams`} open={panel === 'teams'} onToggle={setPanel}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTeam();
          }}
        >
          <label htmlFor="new-team" className="sr-only">
            Name of the new team
          </label>
          <input id="new-team" className="field flex-1" maxLength={40} placeholder="New team" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} autoComplete="off" />
          <button type="submit" disabled={busy} className="btn btn-gold">
            Add
          </button>
        </form>
        <p className="text-sm text-muted">{started ? 'The new team gets a game against every team in its group. Games already played stay where they are.' : 'The schedule is made again with the new team.'}</p>
        <div className="border-t border-cream/12 pt-4">
          <label htmlFor="leaving" className="field-label">
            A team has to pull out
          </label>
          <select id="leaving" className="field" value={leaving} onChange={(e) => setLeaving(e.target.value)}>
            <option value="">Choose the team</option>
            {active.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          {withdrawing && withdrawingGames && (
            <div className="mt-3 space-y-2">
              {!started ? (
                <ConfirmButton danger label={`Remove ${withdrawing.name}`} confirm="Tap again to remove" onConfirm={() => withdraw('remove')} />
              ) : (
                <>
                  <p className="text-sm text-sand">
                    {withdrawing.name} have played {withdrawingGames.played.length} and have {withdrawingGames.left.length} to play.{' '}
                    {withdrawingGames.played.length < withdrawingGames.left.length ? 'They have played under half, so removing their results is the usual choice.' : 'They have played most of their games, so awarding the rest is the usual choice.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ConfirmButton danger label="Remove their results" confirm="Tap again to remove" onConfirm={() => withdraw('remove')} />
                    <ConfirmButton danger label="Award the games left" confirm="Tap again to award" onConfirm={() => withdraw('award')} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section id="points" title="Points" hint={`Win ${t.settings.points.win}, tie ${t.settings.points.tie}, no result ${t.settings.points.noResult}, loss ${t.settings.points.loss}`} open={panel === 'points'} onToggle={setPanel}>
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
            <Stepper value={settings.points[k]} min={0} max={20} label={`Points for a ${label.toLowerCase()}`} onChange={(v) => setSettings({ ...settings, points: { ...settings.points, [k]: v } })} />
          </div>
        ))}
        <button type="button" disabled={busy} className="btn btn-gold w-full" onClick={() => savePoints(settings.points)}>
          Save the points
        </button>
      </Section>

      <Section id="awards" title="Awards" hint="Player of the tournament" open={panel === 'awards'} onToggle={setPanel}>
        <label htmlFor="pot" className="field-label">
          Player of the tournament
        </label>
        <select id="pot" className="field" value={t.settings.playerOfTournament ?? ''} disabled={busy} onChange={(e) => setSetting({ playerOfTournament: e.target.value || null }, 'Saved')}>
          <option value="">Top of the MVP table{mvp[0] ? ` (${mvp[0].name})` : ''}</option>
          {mvp.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}, {p.team} ({p.mvp})
            </option>
          ))}
        </select>
        <p className="text-sm text-muted">Shown once the tournament is marked as finished.</p>
        {(finalTied || t.settings.sharedTitle) && (
          <Toggle label="Share the title" hint="The final was tied and both teams are winners." value={t.settings.sharedTitle === true} onChange={(v) => setSetting({ sharedTitle: v }, 'Saved')} />
        )}
      </Section>

      <Section id="people" title="Organisers" hint={t.organisers.length ? `${t.organisers.length} helping` : 'Share the job with other members'} open={panel === 'people'} onToggle={setPanel}>
        <p className="text-sand">Organisers can change teams, the schedule and results. Any member can score a game.</p>
        {people === null ? (
          <div className="skeleton h-24" role="status" aria-label="Loading members" />
        ) : (
          <ul className="max-h-72 divide-y divide-cream/10 overflow-y-auto border border-cream/12">
            {people.map((p) => {
              const on = t.organisers.includes(p.id);
              return (
                <li key={p.id} className="px-3">
                  <Toggle
                    label={p.full_name || 'Member'}
                    value={on}
                    onChange={(v) => run(() => updateTournament(supabase(), t.id, { organisers: v ? [...t.organisers, p.id] : t.organisers.filter((x) => x !== p.id) }), v ? 'Organiser added' : 'Organiser removed')}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section id="name" title="Name and finish" hint={t.status === 'complete' ? 'Finished' : 'Rename, finish or delete'} open={panel === 'name'} onToggle={setPanel}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) void run(() => updateTournament(supabase(), t.id, { name: name.trim().slice(0, 80) }), 'Renamed');
          }}
        >
          <label htmlFor="rename" className="sr-only">
            Tournament name
          </label>
          <input id="rename" className="field flex-1" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" disabled={busy || !name.trim() || name.trim() === t.name} className="btn btn-outline">
            Rename
          </button>
        </form>
        <button type="button" disabled={busy} className="btn btn-gold w-full" onClick={() => run(() => updateTournament(supabase(), t.id, { status: t.status === 'complete' ? 'live' : 'complete' }), t.status === 'complete' ? 'Reopened' : 'Marked as finished')}>
          {t.status === 'complete' ? 'Reopen the tournament' : 'Mark as finished'}
        </button>
        <div className="flex items-center justify-between gap-3 border-t border-cream/12 pt-4">
          <span className="text-sm text-sand">Deleting removes the teams and the schedule. Matches already scored stay in the match list.</span>
          <ConfirmButton
            danger
            label="Delete"
            confirm="Tap again to delete"
            onConfirm={async () => {
              const res = await deleteTournament(supabase(), t.id);
              if (!res.ok) return void toast.error(PROBLEM_TEXT[res.problem]);
              forgetTournament(t.id);
              router.push('/score');
            }}
          />
        </div>
        {member.isAdmin && t.created_by !== member.user.id && <p className="text-xs text-muted">You can manage this tournament because you are an admin.</p>}
      </Section>
    </div>
  );
}
