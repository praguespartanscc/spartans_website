import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPlayers } from '@/lib/data';
import { SQUADS } from '@/lib/club';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import PlayerCard, { sortLeadersFirst } from '@/components/PlayerCard';
import JoinCta from '@/components/JoinCta';
import { ArrowRight } from '@/components/ui/Icons';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Squads & Players',
  description:
    'Meet the Prague Spartans Cricket Club squads: Vanguards, Mobilizers and Strikers. Captains, vice-captains and every player in Prague’s cricket family.',
  alternates: { canonical: '/players' },
  openGraph: { url: '/players', title: 'Prague Spartans squads & players' },
};

export default async function PlayersPage() {
  const players = await getPlayers();
  const unassigned = players.filter((p) => !SQUADS.some((s) => s.name === p.team));

  return (
    <>
      <PageHero
        eyebrow="The squads"
        title={
          <>
            Meet the <span className="text-gold">Spartans</span>
          </>
        }
        intro="Three squads, one badge. Tap a player for their profile, or open a squad for the full line-up."
        image="/spartan_team.PNG"
      >
        <nav aria-label="Jump to a squad" className="flex flex-wrap gap-2">
          {SQUADS.map((squad) => (
            <a key={squad.slug} href={`#${squad.slug}`} className="btn btn-outline">
              {squad.name}
            </a>
          ))}
        </nav>
      </PageHero>

      {players.length === 0 && (
        <section className="py-16">
          <div className="container-x">
            <EmptyState title="Squads are being picked">Players will appear here once the squads are announced.</EmptyState>
          </div>
        </section>
      )}

      {players.length > 0 &&
        SQUADS.map((squad, si) => {
          const squadPlayers = players.filter((p) => p.team === squad.name);
          return (
            <section
              key={squad.slug}
              id={squad.slug}
              aria-labelledby={`${squad.slug}-heading`}
              className={`scroll-mt-24 py-16 sm:py-20 ${si % 2 ? 'bg-ink-2' : ''}`}
            >
              <div className="container-x">
                <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <Image src={squad.logo} alt={`${squad.name} logo`} width={102} height={120} className="h-[120px] w-auto" />
                    <div>
                      <h2 id={`${squad.slug}-heading`} className="h-section">
                        {squad.name}
                      </h2>
                      <p className="mt-2 text-muted">
                        {squadPlayers.length} {squadPlayers.length === 1 ? 'player' : 'players'} · {squad.tagline}
                      </p>
                    </div>
                  </div>
                  <Link href={`/squads/${squad.slug}`} className="link-arrow">
                    Full squad <ArrowRight size={18} />
                  </Link>
                </Reveal>
                {squadPlayers.length === 0 ? (
                  <p className="text-muted">The {squad.name} squad will be announced soon.</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {sortLeadersFirst(squadPlayers).map((player, i) => (
                      <Reveal as="li" key={player.id} delay={Math.min(i, 9) * 40}>
                        <PlayerCard player={player} />
                      </Reveal>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}

      {unassigned.length > 0 && (
        <section className="py-16" aria-labelledby="club-heading">
          <div className="container-x">
            <h2 id="club-heading" className="h-section mb-8">
              Club players
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {unassigned.map((player) => (
                <li key={player.id}>
                  <PlayerCard player={player} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <JoinCta title="Want a spot in the squad?" />
    </>
  );
}
