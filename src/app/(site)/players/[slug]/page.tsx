import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayerBySlug, getPlayers } from '@/lib/data';
import { PLAYER_TYPE_LABEL, SITE_URL, squadByName } from '@/lib/club';
import { initials } from '@/lib/format';
import { isOptimisable } from '@/lib/images';
import PlayerCard from '@/components/PlayerCard';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPlayers()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const ROLE_LABEL: Record<string, string> = { captain: 'Captain', 'vice-captain': 'Vice-captain' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayerBySlug((await params).slug);
  if (!player) return {};
  const type = PLAYER_TYPE_LABEL[player.player_type ?? ''] ?? 'Player';
  const team = player.team ? `${player.team} ` : '';
  return {
    title: `${player.name} · ${type}`,
    description:
      player.bio?.slice(0, 155) ||
      `${player.name}, ${type.toLowerCase()} for the Prague Spartans ${team}squad. Profile, playing role and stats.`,
    alternates: { canonical: `/players/${player.slug}` },
    openGraph: {
      url: `/players/${player.slug}`,
      title: `${player.name} · Prague Spartans`,
      ...(player.photo_url ? { images: [{ url: player.photo_url, alt: player.name }] } : {}),
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const player = await getPlayerBySlug((await params).slug);
  if (!player) notFound();

  const squad = squadByName(player.team);
  const type = PLAYER_TYPE_LABEL[player.player_type ?? ''] ?? 'Player';
  const teammates = (await getPlayers()).filter((p) => p.team === player.team && p.id !== player.id).slice(0, 5);

  const facts = [
    { label: 'Squad', value: player.team },
    { label: 'Role', value: ROLE_LABEL[player.role ?? ''] ?? type },
    { label: 'Batting', value: player.batting_style },
    { label: 'Bowling', value: player.bowling_style },
    { label: 'Shirt number', value: player.jersey_number != null ? String(player.jersey_number) : null },
    { label: 'Spartan since', value: player.joined_year ? String(player.joined_year) : null },
  ].filter((f) => f.value);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    url: `${SITE_URL}/players/${player.slug}`,
    ...(player.photo_url ? { image: player.photo_url } : {}),
    jobTitle: `Cricketer (${type})`,
    memberOf: {
      '@type': 'SportsTeam',
      name: `Prague Spartans${player.team ? ` ${player.team}` : ''}`,
      sport: 'Cricket',
      ...(squad ? { url: `${SITE_URL}/squads/${squad.slug}` } : {}),
    },
    ...(player.cricheroes_url ? { sameAs: [player.cricheroes_url] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative isolate overflow-hidden border-b border-cream/12">
        <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-end lg:gap-16">
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
              {player.team ? `${player.team} · ` : ''}
              {ROLE_LABEL[player.role ?? ''] ?? type}
            </p>
            <h1 className="display rise mt-3 text-[clamp(44px,7vw,104px)] leading-[0.95]" style={{ ['--d' as string]: '140ms' }}>
              {player.name}
            </h1>
            <p className="rise h-sub mt-4 text-[clamp(22px,2.4vw,30px)] text-gold" style={{ ['--d' as string]: '200ms' }}>
              {type}
            </p>

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
                  Stats on CricHeroes <ArrowUpRight size={16} />
                </a>
              )}
              {squad && (
                <Link href={`/squads/${squad.slug}`} className="btn btn-outline">
                  {squad.name} squad <ArrowRight size={16} className="btn-arrow" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {player.bio && (
        <section aria-label="About" className="py-14 sm:py-20">
          <div className="container-x max-w-3xl">
            <h2 className="h-sub mb-5 text-[30px]">About {player.name.split(' ')[0]}</h2>
            <p className="whitespace-pre-line text-lg leading-relaxed text-sand">{player.bio}</p>
          </div>
        </section>
      )}

      {teammates.length > 0 && squad && (
        <section aria-labelledby="teammates" className="border-t border-cream/12 bg-ink-2 py-14 sm:py-20">
          <div className="container-x">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 id="teammates" className="h-section">
                Teammates
              </h2>
              <Link href={`/squads/${squad.slug}`} className="link-arrow">
                Full {squad.name} squad <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {teammates.map((p, i) => (
                <Reveal as="li" key={p.id} delay={i * 50}>
                  <PlayerCard player={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
