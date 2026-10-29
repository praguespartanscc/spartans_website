import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayerBySlug, getPlayers, type PublicPlayer } from '@/lib/data';
import { PLAYER_TYPE_LABEL, PLAYER_TYPE_LABEL_CS, ROLE_LABEL, SEASON, SITE_URL, squadByName, squadId } from '@/lib/club';
import { initials } from '@/lib/format';
import { isOptimisable } from '@/lib/images';
import PlayerCard from '@/components/PlayerCard';
import Reveal from '@/components/ui/Reveal';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubRef } from '@/lib/structured';
import { divisionLabel } from '@/views/PlayersView';

// Shared by /players/[slug] (English) and /cs/players/[slug] (Czech).

// Batting and bowling styles offered in the admin form, in Czech.
const STYLE_CS: Record<string, string> = {
  'right-hand bat': 'Pravoruký pálkař',
  'left-hand bat': 'Levoruký pálkař',
  'right-arm fast': 'Rychlý nadhoz pravou rukou',
  'right-arm medium': 'Středně rychlý nadhoz pravou rukou',
  'right-arm off-spin': 'Off-spin pravou rukou',
  'right-arm leg-spin': 'Leg-spin pravou rukou',
  'left-arm fast': 'Rychlý nadhoz levou rukou',
  'left-arm medium': 'Středně rychlý nadhoz levou rukou',
  'left-arm orthodox': 'Ortodoxní spin levou rukou',
  'left-arm wrist-spin': 'Zápěstní spin levou rukou',
};

function styleLabel(value: string | null | undefined, lang: Lang) {
  if (!value) return null;
  return lang === 'cs' ? (STYLE_CS[value.trim().toLowerCase()] ?? value) : value;
}

function typeLabel(player: PublicPlayer, lang: Lang) {
  const map = lang === 'cs' ? PLAYER_TYPE_LABEL_CS : PLAYER_TYPE_LABEL;
  return map[player.player_type ?? ''] ?? tr(lang, { en: 'Player', cs: 'Hráč' });
}

// Captain / vice-captain when set, otherwise the playing role.
function roleLabel(player: PublicPlayer, lang: Lang) {
  const role = player.role && player.role !== 'player' ? ROLE_LABEL[player.role] : undefined;
  return role ? tr(lang, role) : typeLabel(player, lang);
}

const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url);

// Profiles with neither a bio nor a photo are thin: keep them reachable but out of the index.
const isThin = (p: PublicPlayer) => !p.bio && !p.photo_url;

export async function playerMeta(lang: Lang, slug: string): Promise<Metadata> {
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();
  const squad = squadByName(player.team);
  const type = typeLabel(player, lang);
  const bio = player.bio?.replace(/\s+/g, ' ').trim();
  const fallback = tr(lang, {
    en: `${player.name} is ${/^[aeiou]/i.test(type) ? 'an' : 'a'} ${type.toLowerCase()} for ${
      squad ? `the Prague Spartans ${squad.name} squad (${divisionLabel(squad.division, lang)})` : 'Prague Spartans Cricket Club'
    }, a cricket club in Prague. Player profile and playing role.`,
    cs: `${player.name}: ${type.toLowerCase()} ${
      squad ? `týmu ${squad.name} (${divisionLabel(squad.division, lang)})` : ''
    } kriketového klubu Prague Spartans v Praze. Profil hráče a herní role.`.replace(/\s+/g, ' '),
  });
  const description =
    lang === 'en' && bio ? (bio.length > 155 ? `${bio.slice(0, 152).replace(/\s+\S*$/, '')}…` : bio) : fallback;

  return {
    ...pageMeta({
      lang,
      path: `/players/${player.slug}`,
      title: `${player.name}, ${type}${squad ? `, ${squad.name}` : ''}`,
      description,
      type: 'profile',
      ...(player.photo_url ? { images: [{ url: player.photo_url, alt: player.name }] } : {}),
    }),
    ...(isThin(player) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function PlayerView({ lang, slug }: { lang: Lang; slug: string }) {
  const player = await getPlayerBySlug(slug);
  if (!player) notFound();

  const squad = squadByName(player.team);
  const type = typeLabel(player, lang);
  const role = roleLabel(player, lang);
  const teammates = (await getPlayers()).filter((p) => p.team === player.team && p.id !== player.id).slice(0, 5);

  const facts = [
    { label: tr(lang, { en: 'Squad', cs: 'Tým' }), value: player.team },
    {
      label: tr(lang, { en: `League ${SEASON}`, cs: `Soutěž ${SEASON}` }),
      value: squad ? divisionLabel(squad.division, lang) : null,
    },
    { label: tr(lang, { en: 'Role', cs: 'Role' }), value: role },
    { label: tr(lang, { en: 'Batting', cs: 'Pálkování' }), value: styleLabel(player.batting_style, lang) },
    { label: tr(lang, { en: 'Bowling', cs: 'Nadhoz' }), value: styleLabel(player.bowling_style, lang) },
    {
      label: tr(lang, { en: 'Shirt number', cs: 'Číslo dresu' }),
      value: player.jersey_number != null ? String(player.jersey_number) : null,
    },
    { label: tr(lang, { en: 'Joined', cs: 'V klubu od' }), value: player.joined_year ? String(player.joined_year) : null },
  ].filter((f) => f.value);

  const pageUrl = `${SITE_URL}${localePath(lang, `/players/${player.slug}`)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    inLanguage: lang,
    ...(player.updated_at ? { dateModified: player.updated_at } : {}),
    mainEntity: {
      '@type': 'Person',
      '@id': `${SITE_URL}/players/${player.slug}#person`,
      name: player.name,
      url: `${SITE_URL}/players/${player.slug}`,
      ...(player.photo_url ? { image: absolute(player.photo_url) } : {}),
      jobTitle: `${role}, Prague Spartans ${squad ? squad.name : 'Cricket Club'}`,
      memberOf: squad ? { '@id': squadId(squad.slug) } : clubRef,
      ...(player.cricheroes_url ? { sameAs: [player.cricheroes_url] } : {}),
    },
  };

  const squadsLabel = tr(lang, { en: 'Squads', cs: 'Týmy' });
  const trail: [string, string][] = [
    [squadsLabel, '/players'],
    ...(squad ? ([[squad.name, `/squads/${squad.slug}`]] as [string, string][]) : []),
    [player.name, `/players/${player.slug}`],
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs(lang, trail)} />

      <section className="relative isolate overflow-hidden border-b border-cream/12">
        <div className="container-x pt-8">
          <Link
            href={localePath(lang, squad ? `/squads/${squad.slug}` : '/players')}
            className="inline-flex items-center gap-2 font-display text-[14px] font-semibold uppercase tracking-[0.14em] text-faint transition-colors hover:text-gold"
          >
            <ArrowRight size={16} className="rotate-180" />
            {squad
              ? tr(lang, { en: `Back to ${squad.name}`, cs: `Zpět na tým ${squad.name}` })
              : tr(lang, { en: 'Back to squads & players', cs: 'Zpět na týmy a hráče' })}
          </Link>
        </div>
        <div className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-end lg:gap-16">
          <div className="rise relative aspect-[4/5] w-full max-w-[420px] overflow-hidden border border-cream/12 bg-gradient-to-b from-panel-2 to-ink">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.name}
                fill
                priority
                sizes="(min-width: 1024px) 420px, 90vw"
                unoptimized={!isOptimisable(player.photo_url)}
                className="object-cover object-top"
              />
            ) : (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-varsity text-[140px] text-cream/15">
                {initials(player.name)}
              </span>
            )}
            {player.jersey_number != null && (
              <span className="absolute left-5 top-3 font-varsity text-[84px] leading-none text-gold drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                {player.jersey_number}
              </span>
            )}
          </div>

          <div>
            <p className="eyebrow rise" style={{ ['--d' as string]: '80ms' }}>
              {squad ? `Prague Spartans ${squad.name} · ` : 'Prague Spartans · '}
              {role}
            </p>
            <h1 className="display mt-3 text-[clamp(44px,7vw,104px)] leading-[0.95]">
              <span className="mask-line"><span style={{ ['--d' as string]: '140ms' }}>
              {player.name}{' '}
              <span className="h-sub mt-4 block text-[clamp(22px,2.4vw,30px)] leading-tight text-gold">
                {tr(lang, { en: `${type} · Prague Spartans Cricket Club`, cs: `${type} · kriketový klub Prague Spartans` })}
              </span>
              </span></span>
            </h1>

            {facts.length > 0 && (
              <dl className="rise mt-8 grid grid-cols-2 border-l border-t border-cream/12 sm:grid-cols-3" style={{ ['--d' as string]: '260ms' }}>
                {facts.map((f) => (
                  <div key={f.label} className="border-b border-r border-cream/12 p-4">
                    <dt className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-faint">{f.label}</dt>
                    <dd className="mt-1.5 text-[17px] font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '320ms' }}>
              {player.cricheroes_url && (
                <a href={player.cricheroes_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                  {tr(lang, { en: 'CricHeroes profile', cs: 'Profil na CricHeroes' })} <ArrowUpRight size={16} />
                </a>
              )}
              {squad && (
                <Link href={localePath(lang, `/squads/${squad.slug}`)} className="btn btn-outline">
                  {tr(lang, { en: `${squad.name} squad`, cs: `Tým ${squad.name}` })} <ArrowRight size={16} className="btn-arrow" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {player.bio && (
        <section aria-labelledby="about-player" className="py-14 sm:py-20">
          <div className="container-x max-w-3xl">
            <h2 id="about-player" className="h-sub mb-5 text-[30px]">
              {tr(lang, { en: `About ${player.name.split(' ')[0]}`, cs: 'O hráči' })}
            </h2>
            <p className="whitespace-pre-line text-lg leading-relaxed text-sand">{player.bio}</p>
          </div>
        </section>
      )}

      {teammates.length > 0 && squad && (
        <section aria-labelledby="teammates" className="border-t border-cream/12 bg-ink-2 py-14 sm:py-20">
          <div className="container-x">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="teammates" className="h-section">
                {tr(lang, { en: 'Teammates', cs: 'Spoluhráči' })}
              </h2>
              <Link href={localePath(lang, `/squads/${squad.slug}`)} className="link-arrow">
                {tr(lang, { en: `Full ${squad.name} squad`, cs: `Celý tým ${squad.name}` })} <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {teammates.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i * 50}>
                  <PlayerCard player={p} lang={lang} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
