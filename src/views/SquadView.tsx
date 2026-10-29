import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayers, getSquads } from '@/lib/data';
import { GROUND, PLAYER_GROUPS, PLAYER_GROUPS_CS, ROLE_LABEL, SITE_URL, SQUADS, TRAINING, squadBySlug } from '@/lib/club';
import Reveal from '@/components/ui/Reveal';
import Avatar from '@/components/ui/Avatar';
import PlayerCard from '@/components/PlayerCard';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, squadNode } from '@/lib/structured';
import { SQUAD_HONOURS, divisionLabel } from '@/views/PlayersView';

// Shared by /squads/[team] (English) and /cs/squads/[team] (Czech).

// Squad-specific 2026 sentence, from the confirmed honours.
const SQUAD_SEASON: Record<string, { en: string; cs: string }> = {
  vanguards: {
    en: 'In 2026 they finished second after the Division 1 league stage and reached the semi-finals.',
    cs: 'V sezóně 2026 skončili po základní části 1. divize na druhém místě a postoupili do semifinále.',
  },
  mobilizers: {
    en: 'In 2026 they won Division 2.',
    cs: 'V sezóně 2026 vyhráli 2. divizi.',
  },
};

export function squadMeta(lang: Lang, slug: string): Metadata {
  const squad = squadBySlug(slug);
  if (!squad) notFound();
  const division = divisionLabel(squad.division, lang);
  return pageMeta({
    lang,
    path: `/squads/${squad.slug}`,
    title: tr(lang, {
      en: `${squad.name}, ${division} cricket squad`,
      cs: `${squad.name}, kriketový tým ${division}`,
    }),
    description: tr(lang, {
      en: `${squad.name} is the Prague Spartans Cricket Club squad playing ${division} of the Czech Cricket Union league in 2026. Squad list, captain, fixtures and player profiles.`,
      cs: `${squad.name} je tým kriketového klubu Prague Spartans, který v sezóně 2026 hraje ${squad.division}. divizi soutěží Českomoravského kriketového svazu. Soupiska, kapitán, zápasy a profily hráčů.`,
    }),
  });
}

export default async function SquadView({ lang, slug }: { lang: Lang; slug: string }) {
  const squad = (await getSquads()).find((s) => s.slug === slug);
  if (!squad) notFound();

  const players = (await getPlayers()).filter((p) => p.team === squad.name);
  const captain = players.find((p) => p.role === 'captain');
  const vice = players.find((p) => p.role === 'vice-captain');
  const others = SQUADS.filter((s) => s.slug !== squad.slug);
  const division = divisionLabel(squad.division, lang);
  const season = SQUAD_SEASON[squad.slug];
  const honour = SQUAD_HONOURS[squad.slug];
  const groupLabel = (key: string, label: string) => (lang === 'cs' ? (PLAYER_GROUPS_CS[key] ?? label) : label);

  const node = squadNode(squad.slug);
  const jsonLd = {
    '@context': 'https://schema.org',
    ...node,
    ...(squad.cricheroes ? { sameAs: [squad.cricheroes] } : {}),
    ...(players.length
      ? {
          athlete: players.map((p) => ({
            '@type': 'Person',
            '@id': `${SITE_URL}/players/${p.slug}#person`,
            name: p.name,
            url: `${SITE_URL}/players/${p.slug}`,
          })),
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbs(lang, [
          [tr(lang, { en: 'Squads', cs: 'Týmy' }), '/players'],
          [squad.name, `/squads/${squad.slug}`],
        ])}
      />

      <section className="border-b border-cream/12">
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[auto_1fr]">
          <Image
            src={squad.logo}
            alt={tr(lang, { en: `${squad.name} squad logo`, cs: `Logo týmu ${squad.name}` })}
            width={204}
            height={240}
            priority
            className="rise h-[180px] w-auto sm:h-[240px]"
          />
          <div>
            <p className="eyebrow rise" style={{ ['--d' as string]: '60ms' }}>
              {division} · 2026
            </p>
            <h1 className="display mt-3 text-[clamp(52px,9vw,120px)]">
              <span className="mask-line"><span style={{ ['--d' as string]: '120ms' }}>
              {squad.name}{' '}
              <span className="mt-2 block font-display text-[clamp(18px,2vw,26px)] font-semibold uppercase tracking-[0.14em] text-gold">
                {tr(lang, { en: 'Prague Spartans cricket squad', cs: 'tým kriketového klubu Prague Spartans' })}
              </span>
              </span></span>
            </h1>
            <p className="rise h-sub mt-4 text-[clamp(22px,2.6vw,32px)] text-muted" style={{ ['--d' as string]: '200ms' }}>
              {lang === 'cs' ? squad.taglineCs : squad.tagline}
            </p>
            <div className="rise mt-5 max-w-3xl space-y-3 text-lg leading-relaxed text-sand" style={{ ['--d' as string]: '230ms' }}>
              <p>
                {tr(lang, {
                  en: `${squad.name} play ${division} of the Czech Cricket Union league for Prague Spartans Cricket Club.`,
                  cs: `${squad.name} hrají za kriketový klub Prague Spartans ${squad.division}. divizi soutěží Českomoravského kriketového svazu.`,
                })}
                {season && <> {tr(lang, season)}</>}
              </p>
              <p>
                {tr(lang, {
                  en: `Club training is usually on ${TRAINING.weekly.day.en}s from ${TRAINING.weekly.time.replace('–', ' to ')} in the cricket nets at ${TRAINING.weekly.venue.name} in Prague 3, and the home ground is `,
                  cs: `Klub trénuje obvykle ve ${TRAINING.weekly.day.cs} od ${TRAINING.weekly.time.replace('–', ' do ')} v kriketových sítích v Tenisovém centru Olšanská v Praze 3. Domácím hřištěm je `,
                })}
                <Link href={localePath(lang, '/ground')} className="text-gold underline-offset-4 hover:underline">
                  {tr(lang, { en: GROUND.name, cs: 'kriketové hřiště ve Vinoři' })}
                </Link>
                {'. '}
                {tr(lang, { en: 'Want to play? ', cs: 'Chcete hrát s námi? ' })}
                <Link href={localePath(lang, '/join')} className="text-gold underline-offset-4 hover:underline">
                  {tr(lang, { en: 'Apply to join the club', cs: 'Přihlaste se do klubu' })}
                </Link>
                .
              </p>
              {honour && <p className="font-semibold text-gold">{tr(lang, honour)}</p>}
            </div>
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ ['--d' as string]: '260ms' }}>
              <Link href={localePath(lang, `/fixtures?team=${encodeURIComponent(squad.name)}`)} className="btn btn-gold">
                {tr(lang, { en: `${squad.name} fixtures`, cs: `Zápasy týmu ${squad.name}` })}{' '}
                <ArrowRight size={16} className="btn-arrow" />
              </Link>
              {squad.cricheroes && (
                <a href={squad.cricheroes} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  {tr(lang, { en: 'Stats on CricHeroes', cs: 'Statistiky na CricHeroes' })} <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {(captain || vice) && (
        <section aria-label={tr(lang, { en: 'Leadership', cs: 'Vedení týmu' })} className="py-12 sm:py-16">
          <div className="container-x grid gap-4 md:grid-cols-2">
            {[
              { p: captain, label: tr(lang, ROLE_LABEL.captain), tone: 'gold' as const },
              { p: vice, label: tr(lang, ROLE_LABEL['vice-captain']), tone: 'red' as const },
            ].map(({ p, label, tone }, i) =>
              p ? (
                <Reveal key={label} delay={i * 90}>
                  <Link
                    href={localePath(lang, `/players/${p.slug}`)}
                    className={`group flex items-center gap-6 border p-6 transition-colors sm:p-8 ${
                      tone === 'gold' ? 'border-gold bg-ink hover:bg-panel' : 'border-crimson bg-crimson hover:bg-crimson-hi'
                    }`}
                  >
                    <Avatar name={p.name} src={p.photo_url} size={104} tone={tone === 'gold' ? 'gold' : 'dark'} />
                    <div className="min-w-0">
                      <p className={`eyebrow ${tone === 'red' ? 'text-white' : ''}`}>{label}</p>
                      <p className="display mt-2 text-[clamp(28px,3.4vw,40px)]">{p.name}</p>
                    </div>
                  </Link>
                </Reveal>
              ) : null,
            )}
          </div>
        </section>
      )}

      <section aria-label={tr(lang, { en: 'Squad list', cs: 'Soupiska' })} className="pb-20 pt-12">
        <div className="container-x">
          {players.length === 0 ? (
            <p className="py-10 text-muted">
              {tr(lang, {
                en: `The ${squad.name} squad list will be published soon.`,
                cs: `Soupisku týmu ${squad.name} brzy zveřejníme.`,
              })}
            </p>
          ) : (
            PLAYER_GROUPS.map((group) => {
              const list = players.filter((p) => p.player_type === group.key);
              if (list.length === 0) return null;
              return (
                <div key={group.key} className="mt-12 first:mt-0">
                  <h2 className="h-sub mb-5 flex items-baseline gap-3 border-b border-cream/12 pb-3 text-[30px]">
                    {groupLabel(group.key, group.label)} <span className="font-display text-[18px] text-dim">{list.length}</span>
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {list.map((player, i) => (
                      <Reveal as="li" key={player.id} delay={Math.min(i, 9) * 40}>
                        <PlayerCard player={player} lang={lang} />
                      </Reveal>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
          {(() => {
            const rest = players.filter((p) => !PLAYER_GROUPS.some((g) => g.key === p.player_type));
            return rest.length ? (
              <div className="mt-12">
                <h2 className="h-sub mb-5 border-b border-cream/12 pb-3 text-[30px]">{tr(lang, { en: 'Players', cs: 'Hráči' })}</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {rest.map((player) => (
                    <li key={player.id}>
                      <PlayerCard player={player} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}
        </div>
      </section>

      <section aria-label={tr(lang, { en: 'Other squads', cs: 'Další týmy' })} className="border-t border-cream/12 py-14">
        <div className="container-x flex flex-wrap items-center justify-between gap-6">
          <p className="h-sub text-[26px]">{tr(lang, { en: 'Other squads', cs: 'Další týmy' })}</p>
          <div className="flex flex-wrap gap-3">
            {others.map((s) => (
              // Text only: the brand manual keeps logos at 120px or larger.
              <Link key={s.slug} href={localePath(lang, `/squads/${s.slug}`)} className="btn btn-outline">
                {s.name} · {divisionLabel(s.division, lang)}
              </Link>
            ))}
            <Link href={localePath(lang, '/players')} className="btn btn-outline">
              {tr(lang, { en: 'All squads & players', cs: 'Všechny týmy a hráči' })}
            </Link>
          </div>
        </div>
      </section>

      <JoinCta lang={lang} title={tr(lang, { en: `Play for the ${squad.name}`, cs: `Hrajte za ${squad.name}` })} />
    </>
  );
}
