import type { InningsState, MatchState } from '@/lib/indoor/engine';
import { oversText, teamTotal } from '@/lib/indoor/engine';
import type { DismissalKind } from '@/lib/indoor/rules';
import { DISMISSAL_LABEL } from '@/lib/indoor/rules';
import { ballLabel, ballTone } from '@/lib/indoor/format';
import type { Lang } from '@/lib/i18n';
import { tr } from '@/lib/i18n';

const DISMISSAL_CS: Record<DismissalKind, string> = {
  bowled: 'bowled',
  caught: 'chycen',
  caughtOffWall: 'chycen od boční stěny',
  caughtOffKeeperWall: 'chycen od zadní stěny',
  ceiling: 'míč trefil strop',
  ceilingCaught: 'chycen od stěny a stropu',
  runOut: 'run out',
  stumped: 'stumped',
  hitWicket: 'trefil vlastní branku',
  lbw: 'LBW',
  obstructing: 'bránění hráči v poli',
  retiredOut: 'odstoupil jako vyřazený',
};

const ZONE_CS: Record<string, string> = {
  nearLeft: 'Bližší boční stěna, vlevo',
  nearRight: 'Bližší boční stěna, vpravo',
  farLeft: 'Vzdálená boční stěna, vlevo',
  farRight: 'Vzdálená boční stěna, vpravo',
  farLeftA: 'Vzdálená boční stěna vlevo, první polovina',
  farLeftB: 'Vzdálená boční stěna vlevo, druhá polovina',
  farRightA: 'Vzdálená boční stěna vpravo, první polovina',
  farRightB: 'Vzdálená boční stěna vpravo, druhá polovina',
  farFull: 'Zadní stěna bez dopadu',
  farBounce: 'Zadní stěna po dopadu',
  keeper: 'Stěna za brankářem',
};

export function zoneName(lang: Lang, id: string, label: string): string {
  return lang === 'cs' ? (ZONE_CS[id] ?? label) : label;
}

export function howOut(lang: Lang, kind: DismissalKind | null): string {
  if (!kind) return tr(lang, { en: 'out', cs: 'vyřazen' });
  return lang === 'cs' ? DISMISSAL_CS[kind] : DISMISSAL_LABEL[kind].toLowerCase();
}

const TONE: Record<ReturnType<typeof ballTone>, string> = {
  wicket: 'bg-crimson text-cream',
  boundary: 'bg-gold text-ink',
  extra: 'border border-gold/60 text-gold',
  dot: 'border border-cream/22 text-muted',
  runs: 'bg-cream/10 text-cream',
};

export default function Scorecard({ state, lang = 'en' }: { state: MatchState; lang?: Lang }) {
  const shown = state.innings.filter((inn) => inn.index === 0 || inn.overs.some((o) => o.balls.length) || inn.complete);
  return (
    <div className="space-y-10">
      {shown.map((inn) => (
        <InningsCard key={inn.index} state={state} inn={inn} lang={lang} />
      ))}
    </div>
  );
}

function InningsCard({ state, inn, lang }: { state: MatchState; inn: InningsState; lang: Lang }) {
  const bpo = state.rules.match.ballsPerOver;
  const team = state.teams[inn.batting].name;
  const total = teamTotal(state, inn.batting);
  const adjustment = state.adjustments[inn.batting];
  const extras = inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes;
  const batted = inn.battingOrder.map((id) => inn.batters[id]).filter(Boolean);
  const notIn = Object.values(inn.batters).filter((b) => b.status === 'yet');
  const name = (id: string) => inn.batters[id]?.name ?? '';

  const status = (b: (typeof batted)[number]) => {
    if (b.status === 'batting') return tr(lang, { en: 'not out', cs: 'nevyřazen' });
    if (b.status === 'retired') return tr(lang, { en: 'retired', cs: 'odstoupil' });
    return howOut(lang, b.howOut);
  };

  return (
    <section aria-label={`${team} ${tr(lang, { en: 'innings', cs: 'směna' })}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gold pb-2">
        <h2 className="h-sub text-2xl">{team}</h2>
        <p className="font-varsity text-2xl">
          {total}/{inn.wickets}{' '}
          <span className="text-base text-muted">
            ({oversText(inn.legalBalls, bpo)} {tr(lang, { en: 'of', cs: 'z' })} {inn.oversLimit} {tr(lang, { en: 'overs', cs: 'overů' })})
          </span>
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 font-normal">{tr(lang, { en: 'Batter', cs: 'Pálkař' })}</th>
              <th className="py-2 text-right font-normal">R</th>
              <th className="py-2 text-right font-normal">{tr(lang, { en: 'B', cs: 'M' })}</th>
              <th className="py-2 text-right font-normal">{tr(lang, { en: 'Out', cs: 'Vyř.' })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/10">
            {batted.map((b) => (
              <tr key={b.id}>
                <td className="py-2 pr-2">
                  <span className="text-cream">{b.name}</span>
                  <span className="block text-xs text-muted">{status(b)}</span>
                </td>
                <td className="py-2 text-right font-varsity text-base">{b.runs}</td>
                <td className="py-2 text-right text-muted">{b.balls}</td>
                <td className="py-2 text-right text-muted">{b.outs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-3 space-y-1 text-sm text-sand">
        <div className="flex justify-between gap-3">
          <dt>{tr(lang, { en: 'Extras', cs: 'Navíc' })}</dt>
          <dd>
            {extras}{' '}
            <span className="text-muted">
              (wd {inn.extras.wides}, nb {inn.extras.noBalls}, b {inn.extras.byes}, lb {inn.extras.legByes})
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{tr(lang, { en: 'Wicket penalties', cs: 'Penalizace za branky' })}</dt>
          <dd>{inn.wicketPenalties ? `-${inn.wicketPenalties}` : 0}</dd>
        </div>
        {adjustment !== 0 && (
          <div className="flex justify-between gap-3">
            <dt>{tr(lang, { en: 'Penalty runs', cs: 'Trestné body' })}</dt>
            <dd>{adjustment > 0 ? `+${adjustment}` : adjustment}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 font-semibold text-cream">
          <dt>{tr(lang, { en: 'Total', cs: 'Celkem' })}</dt>
          <dd>
            {total}/{inn.wickets}
          </dd>
        </div>
      </dl>
      {notIn.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          {tr(lang, { en: 'Did not bat', cs: 'Nepálkovali' })}: {notIn.map((b) => b.name).join(', ')}
        </p>
      )}

      {inn.fow.length > 0 && (
        <div className="mt-5">
          <h3 className="eyebrow">{tr(lang, { en: 'Fall of wickets', cs: 'Pád branek' })}</h3>
          <p className="mt-2 text-sm text-sand">
            {inn.fow.map((f) => `${f.score} ${tr(lang, { en: 'for', cs: 'za' })} ${f.wicket} (${name(f.playerId)}, ${f.overs})`).join(', ')}
          </p>
        </div>
      )}

      {inn.bowlingOrder.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 font-normal">{tr(lang, { en: 'Bowler', cs: 'Nadhazovač' })}</th>
                <th className="py-2 text-right font-normal">O</th>
                <th className="py-2 text-right font-normal">R</th>
                <th className="py-2 text-right font-normal">W</th>
                <th className="py-2 text-right font-normal">wd</th>
                <th className="py-2 text-right font-normal">nb</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {inn.bowlingOrder.map((id) => {
                const b = inn.bowlers[id];
                return (
                  <tr key={id}>
                    <td className="py-2 pr-2 text-cream">{b.name}</td>
                    <td className="py-2 text-right">{oversText(b.balls, bpo)}</td>
                    <td className="py-2 text-right">{b.runs}</td>
                    <td className="py-2 text-right font-varsity">{b.wickets}</td>
                    <td className="py-2 text-right text-muted">{b.wides}</td>
                    <td className="py-2 text-right text-muted">{b.noBalls}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {inn.overs.some((o) => o.balls.length) && (
        <div className="mt-5">
          <h3 className="eyebrow">{tr(lang, { en: 'Over by over', cs: 'Over po overu' })}</h3>
          <ol className="mt-2 space-y-2">
            {inn.overs
              .filter((o) => o.balls.length)
              .map((o) => (
                <li key={o.index} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-8 text-sm text-muted">{o.index + 1}</span>
                  {o.balls.map((b) => (
                    <span key={b.eventId} className={`grid h-8 min-w-8 place-items-center rounded-full px-1.5 font-display text-xs font-bold italic ${TONE[ballTone(b)]} ${b.legal ? '' : 'border-dashed'}`}>
                      {ballLabel(b)}
                    </span>
                  ))}
                </li>
              ))}
          </ol>
        </div>
      )}

      {batted.some((b) => Object.keys(b.zoneHits).length) && (
        <div className="mt-5">
          <h3 className="eyebrow">{tr(lang, { en: 'Wall hits', cs: 'Zásahy stěn' })}</h3>
          <ul className="mt-2 space-y-1 text-sm text-sand">
            {batted
              .filter((b) => Object.keys(b.zoneHits).length)
              .map((b) => (
                <li key={b.id}>
                  <span className="text-cream">{b.name}</span>:{' '}
                  {Object.entries(b.zoneHits)
                    .map(([zid, n]) => {
                      const z = state.rules.zones.find((x) => x.id === zid);
                      return `${zoneName(lang, zid, z?.label ?? zid)} x${n}`;
                    })
                    .join(', ')}
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
