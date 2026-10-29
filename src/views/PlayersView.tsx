import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPlayers } from '@/lib/data';
import { SQUADS } from '@/lib/club';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import PlayerCard, { sortLeadersFirst } from '@/components/PlayerCard';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, squadNode } from '@/lib/structured';

// Shared by /players (English) and /cs/players (Czech).

// 2026 league division of a squad, e.g. "Division 1" / "1. divize".
export function divisionLabel(division: number, lang: Lang) {
  return lang === 'cs' ? `${division}. divize` : `Division ${division}`;
}

// Confirmed 2026 results per squad (see HONOURS in club.ts).
export const SQUAD_HONOURS: Record<string, { en: string; cs: string }> = {
  vanguards: {
    en: '2026: ČMKS T10 League winners, Division 1 semi-finalists',
    cs: '2026: vítězové ČMKS T10 League, semifinále 1. divize',
  },
  mobilizers: {
    en: '2026: Division 2 winners',
    cs: '2026: vítězové 2. divize',
  },
};

// "1 player / 3 players", Czech "1 hráč / 3 hráči / 5 hráčů".
export function playerCount(n: number, lang: Lang) {
  if (lang === 'cs') {
    if (n === 1) return '1 hráč';
    if (n >= 2 && n <= 4) return `${n} hráči`;
    return `${n} hráčů`;
  }
  return `${n} ${n === 1 ? 'player' : 'players'}`;
}

export function playersMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/players',
    title: tr(lang, { en: 'Squads & Players', cs: 'Týmy a hráči' }),
    description: tr(lang, {
      en: 'Prague Spartans Cricket Club squads and players in 2026: Vanguards (Division 1), Mobilizers (Division 2) and Strikers (Division 3) of the Czech Cricket Union leagues.',
      cs: 'Týmy a hráči kriketového klubu Prague Spartans v sezóně 2026: Vanguards (1. divize), Mobilizers (2. divize) a Strikers (3. divize) v soutěžích Českomoravského kriketového svazu.',
    }),
  });
}

export default async function PlayersView({ lang }: { lang: Lang }) {
  const players = await getPlayers();
  const unassigned = players.filter((p) => !SQUADS.some((s) => s.name === p.team));
  const squadsLabel = tr(lang, { en: 'Squads', cs: 'Týmy' });

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': SQUADS.map((s) => squadNode(s.slug)) }} />
      <JsonLd data={breadcrumbs(lang, [[squadsLabel, '/players']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'The squads', cs: 'Naše týmy' })}
        title={tr(lang, {
          en: (
            <>
              Prague Spartans <span className="text-gold">squads &amp; players</span>
            </>
          ),
          cs: (
            <>
              Týmy a hráči <span className="text-gold">Prague Spartans</span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: 'Prague Spartans Cricket Club fields three squads in the 2026 Czech Cricket Union leagues: Vanguards in Division 1, Mobilizers in Division 2 and Strikers in Division 3. Tap a player for their profile, or open a squad for the full line-up.',
          cs: 'Kriketový klub Prague Spartans má v sezóně 2026 v soutěžích Českomoravského kriketového svazu tři týmy: Vanguards hrají 1. divizi, Mobilizers 2. divizi a Strikers 3. divizi. Kliknutím na hráče zobrazíte jeho profil, celou soupisku najdete na stránce týmu.',
        })}
        image="/spartan_team.PNG"
      >
        <nav aria-label={tr(lang, { en: 'Jump to a squad', cs: 'Přejít na tým' })} className="flex flex-wrap gap-2">
          {SQUADS.map((squad) => (
            <a key={squad.slug} href={`#${squad.slug}`} className="btn btn-outline">
              {squad.name}
            </a>
          ))}
        </nav>
      </PageHero>

      {SQUADS.map((squad, si) => {
        const squadPlayers = players.filter((p) => p.team === squad.name);
        const honour = SQUAD_HONOURS[squad.slug];
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
                  <Image
                    src={squad.logo}
                    alt={tr(lang, { en: `${squad.name} logo`, cs: `Logo týmu ${squad.name}` })}
                    width={102}
                    height={120}
                    className="h-[120px] w-auto"
                  />
                  <div>
                    <p className="eyebrow">
                      {divisionLabel(squad.division, lang)} · 2026
                    </p>
                    <h2 id={`${squad.slug}-heading`} className="h-section mt-1">
                      {squad.name}
                    </h2>
                    <p className="mt-2 text-muted">
                      {playerCount(squadPlayers.length, lang)} · {lang === 'cs' ? squad.taglineCs : squad.tagline}
                    </p>
                    {honour && <p className="mt-1 font-semibold text-gold">{tr(lang, honour)}</p>}
                  </div>
                </div>
                <Link href={localePath(lang, `/squads/${squad.slug}`)} className="link-arrow">
                  {tr(lang, { en: `Full ${squad.name} squad`, cs: `Celý tým ${squad.name}` })} <ArrowRight size={18} />
                </Link>
              </Reveal>
              {squadPlayers.length === 0 ? (
                <p className="text-muted">
                  {tr(lang, {
                    en: `The ${squad.name} squad list will be published soon.`,
                    cs: `Soupisku týmu ${squad.name} brzy zveřejníme.`,
                  })}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {sortLeadersFirst(squadPlayers).map((player, i) => (
                    <Reveal as="li" key={player.id} delay={Math.min(i, 9) * 40}>
                      <PlayerCard player={player} lang={lang} />
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
              {tr(lang, { en: 'Club players', cs: 'Další hráči klubu' })}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {unassigned.map((player) => (
                <li key={player.id}>
                  <PlayerCard player={player} lang={lang} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <JoinCta
        lang={lang}
        title={tr(lang, { en: 'Want a spot in the squad?', cs: 'Chcete hrát za Spartans?' })}
        text={tr(lang, {
          en: 'Beginners and experienced players are welcome, with no minimum age. Apply online, come to a Thursday training session at Olšanská and the club will place you in a squad.',
          cs: 'Vítáme začátečníky i zkušené hráče, minimální věk nemáme. Přihlaste se online, přijďte na čtvrteční trénink na Olšanské a klub vás zařadí do některého z týmů.',
        })}
      />
    </>
  );
}
