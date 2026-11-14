'use client';

import { useState } from 'react';
import { oversText } from '@/lib/indoor/engine';
import type { Board, Outcome, Row } from '@/lib/indoor/standings';
import { nrrText } from '@/lib/indoor/standings';
import type { PlayerTotals } from '@/lib/indoor/stats';
import { MVP, dismissals, economy, leaders, strikeRate, thresholds } from '@/lib/indoor/stats';
import type { Fixture, TeamRef, TournamentTeam } from '@/lib/indoor/tournament';
import { fixtureTitle, isKnockout, refLabel } from '@/lib/indoor/tournament';
import { LOCALE, tr, type Lang } from '@/lib/i18n';

// The read only pieces of a tournament: fixtures, table, stats and teams. The scorer shows
// them in English, the public page in English or Czech.

const csPlural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
const runsWord = (lang: Lang, n: number) => (lang === 'cs' ? `${n} ${csPlural(n, 'běh', 'běhy', 'běhů')}` : `${n} ${n === 1 ? 'run' : 'runs'}`);

export function dayTitle(lang: Lang, day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long' });
}

// "A1" and "Winner of Semi final 1" in Czech as well.
export function placeLabel(lang: Lang, ref: TeamRef, teams: TournamentTeam[], fixtures: Fixture[]): string {
  if (lang === 'en' || ref.kind === 'team' || ref.kind === 'groupPos') return refLabel(ref, teams, fixtures);
  if (ref.kind === 'tablePos') return `${ref.pos}. místo`;
  const f = fixtures.find((x) => x.id === ref.fixture);
  const name = f ? stageLabel(lang, f) : 'předchozí zápas';
  return `${ref.kind === 'winner' ? 'Vítěz' : 'Poražený'}: ${name}`;
}

const STAGE_CS: Record<string, string> = { final: 'Finále', third: 'O třetí místo', q1: 'Kvalifikace 1', elim: 'Eliminace', q2: 'Kvalifikace 2' };

// The label the schedule gave the game, in Czech where it is one of the known ones.
export function stageLabel(lang: Lang, f: Fixture): string {
  const label = fixtureTitle(f);
  if (lang === 'en') return label;
  if (STAGE_CS[f.stage]) return STAGE_CS[f.stage];
  return label
    .replace(/^Semi final/, 'Semifinále')
    .replace(/^Quarter final/, 'Čtvrtfinále')
    .replace(/^Round of/, 'Kolo posledních')
    .replace(/^Round/, 'Kolo')
    .replace(/^Group/, 'Skupina')
    .replace(/^Game/, 'Zápas');
}

export function resultLine(lang: Lang, o: Outcome, name: (id: string | null) => string): string | null {
  if (o.state === 'cancelled') return tr(lang, { en: 'Cancelled', cs: 'Zrušeno' });
  if (o.state === 'no_result') {
    const base = tr(lang, { en: 'No result', cs: 'Bez výsledku' });
    return o.winner ? `${base}. ${tr(lang, { en: `${name(o.winner)} go through`, cs: `Postupuje tým ${name(o.winner)}` })}.` : base;
  }
  if (o.state === 'walkover') return o.winner ? tr(lang, { en: `Walkover to ${name(o.winner)}`, cs: `Kontumačně vyhrál tým ${name(o.winner)}` }) : tr(lang, { en: 'Walkover', cs: 'Kontumace' });
  if (o.state !== 'complete') return null;
  if (o.tie) {
    const base = tr(lang, { en: 'Match tied', cs: 'Remíza' });
    return o.winner ? `${base}. ${tr(lang, { en: `${name(o.winner)} go through`, cs: `Postupuje tým ${name(o.winner)}` })}.` : base;
  }
  if (!o.winner || !o.score) return null;
  const margin = Math.abs(o.score.home.runs - o.score.away.runs);
  return tr(lang, { en: `${name(o.winner)} won by ${runsWord(lang, margin)}`, cs: `Vyhrál tým ${name(o.winner)} o ${runsWord(lang, margin)}` });
}

function Chip({ tone, children }: { tone?: 'live' | 'gold'; children: React.ReactNode }) {
  return <span className={`chip shrink-0 ${tone === 'live' ? 'border-crimson-hi text-cream' : tone === 'gold' ? 'border-gold text-gold' : ''}`}>{children}</span>;
}

export function FixtureList({
  lang,
  fixtures,
  teams,
  board,
  onOpen,
  href,
  empty,
}: {
  lang: Lang;
  fixtures: Fixture[];
  teams: TournamentTeam[];
  board: Board;
  onOpen?: (f: Fixture) => void;
  href?: (f: Fixture, o: Outcome) => string | null;
  empty?: React.ReactNode;
}) {
  if (!fixtures.length) return <>{empty}</>;
  const name = (id: string | null) => teams.find((t) => t.id === id)?.name ?? '';
  const days = [...new Set(fixtures.map((f) => f.day ?? ''))].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));
  const byTime = (a: Fixture, b: Fixture) => (a.starts ?? '99').localeCompare(b.starts ?? '99') || (a.court ?? 0) - (b.court ?? 0) || a.seq - b.seq;

  return (
    <div className="space-y-8">
      {days.map((day) => {
        const list = fixtures.filter((f) => (f.day ?? '') === day).sort(byTime);
        const venues = [...new Set(list.map((f) => f.venue).filter(Boolean))];
        return (
          <section key={day || 'none'}>
            <h3 className="eyebrow">{day ? dayTitle(lang, day) : tr(lang, { en: 'No time yet', cs: 'Zatím bez času' })}</h3>
            {venues.length === 1 && <p className="mt-1 text-sm text-muted">{venues[0]}</p>}
            <ul className="mt-3 space-y-2">
              {list.map((f) => {
                const o = board.outcome(f);
                const side = (id: string | null, ref: TeamRef, score: { runs: number; wickets: number; balls: number } | undefined) => (
                  <p className="flex items-baseline justify-between gap-3">
                    <span className={`min-w-0 truncate ${id ? (o.winner === id ? 'font-semibold text-cream' : 'text-cream') : 'italic text-muted'}`}>{id ? name(id) : placeLabel(lang, ref, teams, fixtures)}</span>
                    {o.match && score && (o.state === 'live' || o.state === 'complete') && (
                      <span className="shrink-0 font-varsity text-cream">
                        {score.runs}/{score.wickets} <span className="font-sans text-sm text-muted">({oversText(score.balls, o.bpo)})</span>
                      </span>
                    )}
                  </p>
                );
                const result = resultLine(lang, o, name);
                const where = [f.court != null ? tr(lang, { en: `Court ${f.court}`, cs: `Kurt ${f.court}` }) : null, venues.length > 1 ? f.venue : null].filter(Boolean).join(', ');
                const dutyId = f.duty ? board.resolve(f.duty) : null;
                const body = (
                  <>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span className="min-w-0 truncate">
                        <span className="font-varsity text-sm text-gold">{f.starts ?? '--:--'}</span>
                        {where && <span className="ml-2">{where}</span>}
                      </span>
                      <span className="flex shrink-0 gap-1.5">
                        {o.state === 'live' && (
                          <Chip tone="live">
                            <span className="live-dot h-2 w-2 rounded-full bg-crimson-hi" aria-hidden />
                            {tr(lang, { en: 'Live', cs: 'Živě' })}
                          </Chip>
                        )}
                        <Chip tone={isKnockout(f.stage) ? 'gold' : undefined}>{stageLabel(lang, f)}</Chip>
                      </span>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {side(o.home, f.home, o.score?.home)}
                      {side(o.away, f.away, o.score?.away)}
                    </div>
                    {result && <p className="mt-2 text-sm text-gold">{result}</p>}
                    {f.note && <p className="mt-1 text-sm text-muted">{f.note}</p>}
                    {dutyId && o.state === 'scheduled' && (
                      <p className="mt-2 text-xs text-muted">
                        {tr(lang, { en: 'Umpire', cs: 'Rozhodčí' })}: {name(dutyId)}
                      </p>
                    )}
                  </>
                );
                const link = href?.(f, o) ?? null;
                return (
                  <li key={f.id}>
                    {onOpen ? (
                      <button type="button" onClick={() => onOpen(f)} className={`card card-hover block w-full p-4 text-left ${o.state === 'cancelled' ? 'opacity-60' : ''}`}>
                        {body}
                      </button>
                    ) : link ? (
                      <a href={link} className="card card-hover block p-4">
                        {body}
                      </a>
                    ) : (
                      <div className={`card p-4 ${o.state === 'cancelled' ? 'opacity-60' : ''}`}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function StandingsTable({ lang, rows, title }: { lang: Lang; rows: Row[]; title?: string }) {
  const ties = rows.some((r) => r.tied > 0);
  const nr = rows.some((r) => r.noResult > 0);
  const whys = rows.filter((r) => r.why);
  const head = 'px-1.5 py-2 font-display text-xs font-bold uppercase italic text-muted';
  const th = `${head} text-right`;
  const td = 'px-1.5 py-2.5 text-right tabular-nums';
  return (
    <section>
      {title && <h3 className="eyebrow mb-3">{title}</h3>}
      <div className="overflow-x-auto border border-cream/12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/12">
              <th scope="col" className={`${head} w-8 text-left`}>
                #
              </th>
              <th scope="col" className={`${head} text-left`}>
                {tr(lang, { en: 'Team', cs: 'Tým' })}
              </th>
              <th scope="col" className={th} title={tr(lang, { en: 'Played', cs: 'Zápasy' })}>
                {tr(lang, { en: 'P', cs: 'Z' })}
              </th>
              <th scope="col" className={th} title={tr(lang, { en: 'Won', cs: 'Výhry' })}>
                {tr(lang, { en: 'W', cs: 'V' })}
              </th>
              <th scope="col" className={th} title={tr(lang, { en: 'Lost', cs: 'Prohry' })}>
                {tr(lang, { en: 'L', cs: 'P' })}
              </th>
              {ties && (
                <th scope="col" className={th} title={tr(lang, { en: 'Tied', cs: 'Remízy' })}>
                  {tr(lang, { en: 'T', cs: 'R' })}
                </th>
              )}
              {nr && (
                <th scope="col" className={th} title={tr(lang, { en: 'No result', cs: 'Bez výsledku' })}>
                  {tr(lang, { en: 'NR', cs: 'BV' })}
                </th>
              )}
              <th scope="col" className={`${th} text-cream`} title={tr(lang, { en: 'Points', cs: 'Body' })}>
                {tr(lang, { en: 'Pts', cs: 'B' })}
              </th>
              <th scope="col" className={th} title={tr(lang, { en: 'Net run rate', cs: 'Čistý poměr běhů' })}>
                NRR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/10">
            {rows.map((r) => (
              <tr key={r.teamId}>
                <td className={`${td} text-left font-varsity text-gold`}>{r.pos}</td>
                <th scope="row" className="max-w-0 truncate px-1.5 py-2.5 text-left font-semibold text-cream" style={{ width: '99%' }}>
                  {r.name}
                  {r.withdrawn && <span className="ml-1 font-normal text-muted">({tr(lang, { en: 'withdrawn', cs: 'odstoupil' })})</span>}
                </th>
                <td className={`${td} text-sand`}>{r.played}</td>
                <td className={`${td} text-sand`}>{r.won}</td>
                <td className={`${td} text-sand`}>{r.lost}</td>
                {ties && <td className={`${td} text-sand`}>{r.tied}</td>}
                {nr && <td className={`${td} text-sand`}>{r.noResult}</td>}
                <td className={`${td} font-varsity text-base text-cream`}>{r.points}</td>
                <td className={`${td} whitespace-nowrap text-sand`}>{r.played ? nrrText(r.nrr) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lang === 'en' && whys.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {whys.map((r) => (
            <li key={r.teamId}>
              {r.name}: {r.why!.charAt(0).toLowerCase() + r.why!.slice(1)}.
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TableKey({ lang }: { lang: Lang }) {
  return (
    <p className="text-xs text-muted">
      {tr(lang, {
        en: 'Teams level on points are split by wins, then the games between them, then net run rate (runs per over scored minus runs per over conceded), then run difference.',
        cs: 'Týmy se stejným počtem bodů rozhodují výhry, potom vzájemné zápasy, potom čistý poměr běhů (běhy na over získané minus běhy na over obdržené) a nakonec rozdíl běhů.',
      })}
    </p>
  );
}

type BoardId = 'runs' | 'strikeRate' | 'wickets' | 'economy' | 'fielding' | 'mvp';
const BOARDS: { id: BoardId; en: string; cs: string }[] = [
  { id: 'runs', en: 'Runs', cs: 'Běhy' },
  { id: 'wickets', en: 'Wickets', cs: 'Wickety' },
  { id: 'mvp', en: 'MVP', cs: 'MVP' },
  { id: 'strikeRate', en: 'Strike rate', cs: 'Strike rate' },
  { id: 'economy', en: 'Economy', cs: 'Ekonomie' },
  { id: 'fielding', en: 'Fielding', cs: 'Pole' },
];

type Col = { head: { en: string; cs: string }; cell: (p: PlayerTotals) => string | number; main?: boolean };

export function StatsTables({ lang, players, bpo, games, star }: { lang: Lang; players: PlayerTotals[]; bpo: number; games: number; star?: string | null }) {
  const [board, setBoard] = useState<BoardId>('runs');
  const [all, setAll] = useState(false);
  const list = leaders(players, board, { bpo, games });
  const min = thresholds(games, bpo);
  const best = (p: PlayerTotals) => (p.bowl.best ? `${p.bowl.best.w}/${p.bowl.best.r}` : '');
  const cols: Record<BoardId, Col[]> = {
    runs: [
      { head: { en: 'Runs', cs: 'Běhy' }, cell: (p) => p.bat.runs, main: true },
      { head: { en: 'Balls', cs: 'Míčky' }, cell: (p) => p.bat.balls },
      { head: { en: 'SR', cs: 'SR' }, cell: (p) => strikeRate(p).toFixed(0) },
      { head: { en: 'Best', cs: 'Max' }, cell: (p) => p.bat.best ?? '' },
      { head: { en: 'Out', cs: 'Aut' }, cell: (p) => p.bat.outs },
    ],
    strikeRate: [
      { head: { en: 'SR', cs: 'SR' }, cell: (p) => strikeRate(p).toFixed(1), main: true },
      { head: { en: 'Runs', cs: 'Běhy' }, cell: (p) => p.bat.scored },
      { head: { en: 'Balls', cs: 'Míčky' }, cell: (p) => p.bat.balls },
    ],
    wickets: [
      { head: { en: 'Wkts', cs: 'W' }, cell: (p) => p.bowl.wickets, main: true },
      { head: { en: 'Overs', cs: 'Overy' }, cell: (p) => oversText(p.bowl.balls, bpo) },
      { head: { en: 'Runs', cs: 'Běhy' }, cell: (p) => p.bowl.runs },
      { head: { en: 'Econ', cs: 'Ekon' }, cell: (p) => economy(p, bpo).toFixed(1) },
      { head: { en: 'Best', cs: 'Max' }, cell: best },
    ],
    economy: [
      { head: { en: 'Econ', cs: 'Ekon' }, cell: (p) => economy(p, bpo).toFixed(2), main: true },
      { head: { en: 'Overs', cs: 'Overy' }, cell: (p) => oversText(p.bowl.balls, bpo) },
      { head: { en: 'Runs', cs: 'Běhy' }, cell: (p) => p.bowl.runs },
      { head: { en: 'Wkts', cs: 'W' }, cell: (p) => p.bowl.wickets },
    ],
    fielding: [
      { head: { en: 'Total', cs: 'Celkem' }, cell: dismissals, main: true },
      { head: { en: 'Catches', cs: 'Chyty' }, cell: (p) => p.field.catches },
      { head: { en: 'Run outs', cs: 'Run outy' }, cell: (p) => p.field.runOuts },
      { head: { en: 'Stumpings', cs: 'Stumpingy' }, cell: (p) => p.field.stumpings },
    ],
    mvp: [
      { head: { en: 'Points', cs: 'Body' }, cell: (p) => p.mvp, main: true },
      { head: { en: 'Runs', cs: 'Běhy' }, cell: (p) => p.bat.runs },
      { head: { en: 'Wkts', cs: 'W' }, cell: (p) => p.bowl.wickets },
      { head: { en: 'Field', cs: 'Pole' }, cell: dismissals },
    ],
  };
  const note: Record<BoardId, string | null> = {
    runs: tr(lang, { en: 'Runs are after wicket penalties, as on the scorecard. Strike rate uses runs off the bat.', cs: 'Běhy jsou po odečtení trestů za wickety, stejně jako ve výsledkové listině. Strike rate počítá běhy z pálky.' }),
    strikeRate: tr(lang, { en: `Runs off the bat per 100 balls. At least ${min.balls} balls faced.`, cs: `Běhy z pálky na 100 míčků. Nejméně ${min.balls} odehraných míčků.` }),
    wickets: null,
    economy: tr(lang, { en: `Runs conceded per over. At least ${oversText(min.bowled, bpo)} overs bowled.`, cs: `Obdržené běhy na over. Nejméně ${oversText(min.bowled, bpo)} nadhozených overů.` }),
    fielding: tr(lang, { en: 'Counted when the scorer names the fielder.', cs: 'Počítá se, když zapisovatel uvede hráče v poli.' }),
    mvp: tr(lang, {
      en: `${MVP.run} point per run, ${MVP.wicket} per wicket, ${MVP.fielding} per catch, run out or stumping.`,
      cs: `${MVP.run} bod za běh, ${MVP.wicket} za wicket, ${MVP.fielding} za chyt, run out nebo stumping.`,
    }),
  };
  const shown = all ? list : list.slice(0, 10);
  const head = 'px-1.5 py-2 font-display text-xs font-bold uppercase italic text-muted';
  const th = `${head} text-right`;

  return (
    <section>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={tr(lang, { en: 'Tables', cs: 'Tabulky' })}>
        {BOARDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={board === b.id}
            onClick={() => (setBoard(b.id), setAll(false))}
            className={`min-h-11 px-3 font-display text-sm font-bold uppercase italic ${board === b.id ? 'bg-gold text-ink' : 'border border-cream/22 text-cream'}`}
          >
            {b[lang]}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="mt-4 border border-dashed border-cream/22 p-4 text-muted">{tr(lang, { en: 'Nothing here yet. It fills in as games are scored.', cs: 'Zatím tu nic není. Tabulka se plní s odehranými zápasy.' })}</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-cream/12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/12">
                <th scope="col" className={`${head} w-8 text-left`}>
                  #
                </th>
                <th scope="col" className={`${head} text-left`}>
                  {tr(lang, { en: 'Player', cs: 'Hráč' })}
                </th>
                {cols[board].map((c) => (
                  <th key={c.head.en} scope="col" className={`${th} ${c.main ? 'text-cream' : ''}`}>
                    {c.head[lang]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {shown.map((p, i) => (
                <tr key={p.key}>
                  <td className="px-1.5 py-2.5 font-varsity text-gold">{i + 1}</td>
                  <th scope="row" className="max-w-0 px-1.5 py-2 text-left font-normal" style={{ width: '99%' }}>
                    <span className="block truncate font-semibold text-cream">
                      {p.name}
                      {star === p.key && <span className="ml-1 text-gold">★</span>}
                    </span>
                    <span className="block truncate text-xs text-muted">{p.team}</span>
                  </th>
                  {cols[board].map((c) => (
                    <td key={c.head.en} className={`whitespace-nowrap px-1.5 py-2.5 text-right tabular-nums ${c.main ? 'font-varsity text-base text-cream' : 'text-sand'}`}>
                      {c.cell(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.length > 10 && !all && (
        <button type="button" onClick={() => setAll(true)} className="btn btn-outline mt-3 w-full">
          {tr(lang, { en: `Show all ${list.length}`, cs: `Zobrazit všech ${list.length}` })}
        </button>
      )}
      {note[board] && <p className="mt-3 text-xs text-muted">{note[board]}</p>}
    </section>
  );
}

export function TeamsList({ lang, teams, onOpen }: { lang: Lang; teams: TournamentTeam[]; onOpen?: (t: TournamentTeam) => void }) {
  const groups = [...new Set(teams.map((t) => t.grp ?? ''))].sort();
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g || 'all'}>
          {g && <h3 className="eyebrow mb-3">{tr(lang, { en: `Group ${g}`, cs: `Skupina ${g}` })}</h3>}
          <ul className="space-y-2">
            {teams
              .filter((t) => (t.grp ?? '') === g)
              .map((t) => {
                const body = (
                  <>
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="h-sub min-w-0 truncate text-xl">{t.name}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {t.withdrawn ? tr(lang, { en: 'Withdrawn', cs: 'Odstoupil' }) : tr(lang, { en: `${t.squad.length} players`, cs: `Hráčů: ${t.squad.length}` })}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-sand">{t.squad.length ? t.squad.map((p) => p.name).join(', ') : tr(lang, { en: 'No players named yet.', cs: 'Zatím bez hráčů.' })}</p>
                  </>
                );
                return (
                  <li key={t.id}>
                    {onOpen ? (
                      <button type="button" onClick={() => onOpen(t)} className="card card-hover block w-full p-4 text-left">
                        {body}
                      </button>
                    ) : (
                      <div className="card p-4">{body}</div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function Champion({ lang, names }: { lang: Lang; names: string[] }) {
  if (!names.length) return null;
  return (
    <div className="card border-gold p-5">
      <p className="eyebrow">{names.length > 1 ? tr(lang, { en: 'Joint winners', cs: 'Společní vítězové' }) : tr(lang, { en: 'Winners', cs: 'Vítěz' })}</p>
      <p className="h-sub mt-2 text-3xl text-gold">{names.join(tr(lang, { en: ' and ', cs: ' a ' }))}</p>
    </div>
  );
}
