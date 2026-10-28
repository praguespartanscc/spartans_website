import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayers } from '@/lib/data';
import { PLAYER_GROUPS, SITE_URL, SQUADS, squadBySlug } from '@/lib/club';
import Reveal from '@/components/ui/Reveal';
import Avatar from '@/components/ui/Avatar';
import PlayerCard from '@/components/PlayerCard';
import JoinCta from '@/components/JoinCta';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';

export const revalidate = 60;

export function generateStaticParams() {
  return SQUADS.map((s) => ({ team: s.slug }));
}

type Props = { params: Promise<{ team: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const squad = squadBySlug((await params).team);
  if (!squad) return {};
  return {
    title: `${squad.name} squad`,
    description: `The Prague Spartans ${squad.name} squad: captain, vice-captain, batters, all-rounders, wicketkeepers and bowlers. ${squad.tagline}`,
    alternates: { canonical: `/squads/${squad.slug}` },
    openGraph: { url: `/squads/${squad.slug}`, title: `Prague Spartans ${squad.name} squad` },
  };
}

export default async function SquadPage({ params }: Props) {
  const squad = squadBySlug((await params).team);
  if (!squad) notFound();

  const players = (await getPlayers()).filter((p) => p.team === squad.name);
  const captain = players.find((p) => p.role === 'captain');
  const vice = players.find((p) => p.role === 'vice-captain');
  const others = SQUADS.filter((s) => s.slug !== squad.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: `Prague Spartans ${squad.name}`,
    sport: 'Cricket',
    url: `${SITE_URL}/squads/${squad.slug}`,
    logo: `${SITE_URL}${squad.logo}`,
    memberOf: { '@type': 'SportsOrganization', name: 'Prague Spartans Cricket Club', url: SITE_URL },
    ...(squad.cricheroes ? { sameAs: [squad.cricheroes] } : {}),
    athlete: players.map((p) => ({ '@type': 'Person', name: p.name, url: `${SITE_URL}/players/${p.slug}` })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-cream/12">
        <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[auto_1fr]">
          <Image
            src={squad.logo}
            alt={`${squad.name} squad logo`}
            width={204}
            height={240}
            priority
            className="rise h-[180px] w-auto sm:h-[240px]"
          />
          <div>
            <p className="eyebrow rise" style={{ ['--d' as string]: '60ms' }}>
              Prague Spartans squad
            </p>
            <h1 className="display rise mt-3 text-[clamp(52px,9vw,120px)]" style={{ ['--d' as string]: '120ms' }}>
              {squad.name}
            </h1>
            <p className="rise h-sub mt-4 text-[clamp(22px,2.6vw,32px)] text-muted" style={{ ['--d' as string]: '200ms' }}>
              {squad.tagline}
            </p>
            <div className="rise mt-7 flex flex-wrap gap-3" style={{ ['--d' as string]: '260ms' }}>
              <Link href={`/fixtures?team=${squad.name}`} className="btn btn-gold">
                {squad.name} fixtures <ArrowRight size={16} className="btn-arrow" />
              </Link>
              {squad.cricheroes && (
                <a href={squad.cricheroes} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  Stats on CricHeroes <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {(captain || vice) && (
        <section aria-label="Leadership" className="py-12 sm:py-16">
          <div className="container-x grid gap-4 md:grid-cols-2">
            {[
              { p: captain, label: 'Captain', tone: 'gold' as const },
              { p: vice, label: 'Vice-captain', tone: 'red' as const },
            ].map(({ p, label, tone }, i) =>
              p ? (
                <Reveal key={label} delay={i * 90}>
                  <Link
                    href={`/players/${p.slug}`}
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

      <section aria-label="Squad list" className="pb-20">
        <div className="container-x">
          {players.length === 0 ? (
            <p className="py-10 text-muted">The {squad.name} squad will be announced soon.</p>
          ) : (
            PLAYER_GROUPS.map((group) => {
              const list = players.filter((p) => p.player_type === group.key);
              if (list.length === 0) return null;
              return (
                <div key={group.key} className="mt-12 first:mt-0">
                  <h2 className="h-sub mb-5 flex items-baseline gap-3 border-b border-cream/12 pb-3 text-[30px]">
                    {group.label} <span className="font-display text-[18px] text-dim">{list.length}</span>
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {list.map((player, i) => (
                      <Reveal as="li" key={player.id} delay={Math.min(i, 9) * 40}>
                        <PlayerCard player={player} />
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
                <h2 className="h-sub mb-5 border-b border-cream/12 pb-3 text-[30px]">Players</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {rest.map((player) => (
                    <li key={player.id}>
                      <PlayerCard player={player} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}
        </div>
      </section>

      <section aria-label="Other squads" className="border-t border-cream/12 py-14">
        <div className="container-x flex flex-wrap items-center justify-between gap-6">
          <p className="h-sub text-[26px]">Other squads</p>
          <div className="flex flex-wrap gap-3">
            {others.map((s) => (
              // Text only: the brand manual keeps logos at 120px or larger.
              <Link key={s.slug} href={`/squads/${s.slug}`} className="btn btn-outline">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <JoinCta title={`Play for the ${squad.name}`} />
    </>
  );
}
