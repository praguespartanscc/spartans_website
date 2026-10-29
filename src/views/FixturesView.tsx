import type { Metadata } from 'next';
import Link from 'next/link';
import { getMatches, pragueToday } from '@/lib/data';
import { GOVERNING_BODY, GROUND, HONOURS, SQUADS } from '@/lib/club';
import { formatDivision } from '@/lib/format';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';
import PageHero from '@/components/ui/PageHero';
import FixturesBoard from '@/components/FixturesBoard';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';

// Shared by /fixtures (English) and /cs/fixtures (Czech).

// The latest season the club has published results for.
const SEASON = Math.max(...HONOURS.map((h) => h.year));

export function fixturesMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/fixtures',
    title: tr(lang, { en: 'Fixtures & Results', cs: 'Zápasy a výsledky' }),
    description: tr(lang, {
      en: 'Upcoming matches and results for Prague Spartans Cricket Club: Vanguards, Mobilizers and Strikers in the Czech Cricket Union leagues, ČMKS T10 and ECS Czechia, at Vinoř and away.',
      cs: 'Nadcházející zápasy a výsledky kriketového klubu Prague Spartans: týmy Vanguards, Mobilizers a Strikers v soutěžích Českomoravského kriketového svazu, ČMKS T10 a ECS Czechia.',
    }),
  });
}

export default async function FixturesView({ lang }: { lang: Lang }) {
  const matches = await getMatches();
  const label = tr(lang, { en: 'Fixtures & results', cs: 'Zápasy a výsledky' });

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[label, '/fixtures']])} />

      <PageHero
        eyebrow={tr(lang, { en: 'Season calendar', cs: 'Kalendář sezóny' })}
        title={tr(lang, {
          en: (
            <>
              <span className="mb-3 block font-display text-[0.32em] font-extrabold italic tracking-wide text-sand">Prague Spartans</span>{' '}
              Fixtures <span className="text-gold">&amp;</span> results
            </>
          ),
          cs: (
            <>
              Zápasy <span className="text-gold">a</span> výsledky{' '}
              <span className="mt-3 block font-display text-[0.32em] font-extrabold italic tracking-wide text-sand">
                kriketového klubu Prague Spartans
              </span>
            </>
          ),
        })}
        intro={tr(lang, {
          en: (
            <>
              Every match for our three squads: Vanguards, Mobilizers and Strikers in the Czech Cricket Union leagues, plus ČMKS T10 and ECS
              Czechia. Home matches are played at{' '}
              <Link href={localePath(lang, '/ground')} className="underline decoration-cream/30 underline-offset-4 hover:decoration-gold">
                {GROUND.name}
              </Link>{' '}
              in Prague 9. Open a match for the scorecard, live stream and details.
            </>
          ),
          cs: (
            <>
              Všechny zápasy našich tří týmů: Vanguards, Mobilizers a Strikers v soutěžích Českomoravského kriketového svazu, v ČMKS T10 a v ECS
              Czechia. Domácí zápasy hrajeme na{' '}
              <Link href={localePath(lang, '/ground')} className="underline decoration-cream/30 underline-offset-4 hover:decoration-gold">
                kriketovém hřišti ve Vinoři
              </Link>{' '}
              v Praze 9. Po kliknutí na zápas najdete podrobný výsledek, živý přenos a další informace.
            </>
          ),
        })}
        image="/home_carousel1.jpeg"
      />

      <section className="py-12 sm:py-16">
        <div className="container-x">
          <FixturesBoard matches={matches} today={pragueToday()} squads={SQUADS.map((s) => s.name)} lang={lang} />
        </div>
      </section>

      <section aria-labelledby="season" className="border-t border-cream/12 bg-ink-2 py-14 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="season" className="h-section mb-6">
              {tr(lang, { en: `The ${SEASON} season`, cs: `Sezóna ${SEASON}` })}
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-sand">
              {tr(lang, {
                en: `In ${SEASON} Prague Spartans Cricket Club entered three squads in the ${GOVERNING_BODY.name} leagues, and also played ČMKS T10 and ECS Czechia.`,
                cs: `V sezóně ${SEASON} měl kriketový klub Prague Spartans tři týmy v soutěžích Českomoravského kriketového svazu (ČMKS) a hrál také ČMKS T10 a ECS Czechia.`,
              })}
            </p>
            <ul className="mt-6 border-t border-cream/12">
              {SQUADS.map((s) => (
                <li key={s.slug} className="flex items-center justify-between gap-4 border-b border-cream/12 py-4">
                  <Link href={localePath(lang, `/squads/${s.slug}`)} className="h-sub text-[24px] hover:text-gold">
                    {s.name}
                  </Link>
                  <span className="font-display text-[16px] font-bold uppercase tracking-[0.1em] text-muted">
                    {formatDivision(`division${s.division}`, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="h-sub mb-4 text-[28px]">{tr(lang, { en: `${SEASON} honours`, cs: `Úspěchy v sezóně ${SEASON}` })}</h3>
            <ul className="space-y-3 text-lg text-sand">
              {HONOURS.filter((h) => h.year === SEASON).map((h) => (
                <li key={h.en} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 bg-gold" />
                  <span>{h[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <JoinCta lang={lang} />
    </>
  );
}
