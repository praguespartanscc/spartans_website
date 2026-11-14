import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIndoorTournamentBySlug } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { tr, type Lang } from '@/lib/i18n';
import type { TournamentData } from '@/lib/indoor/tournament';
import TournamentFollow from '@/components/indoor/TournamentFollow';

// Public, read only page for an indoor tournament, reached through the organiser's share link.
// Kept out of search engines and the sitemap.
export async function indoorTournamentMeta(lang: Lang, slug: string): Promise<Metadata> {
  const d = (await getIndoorTournamentBySlug(slug)) as TournamentData | null;
  const title = d?.tournament.name ?? tr(lang, { en: 'Indoor tournament', cs: 'Halový turnaj' });
  return {
    ...pageMeta({
      lang,
      path: `/indoor/t/${slug}`,
      title: `${title} | ${tr(lang, { en: 'Indoor tournament', cs: 'Halový turnaj' })}`,
      description: tr(lang, {
        en: `Games, results, table and player stats of the indoor cricket tournament ${title}.`,
        cs: `Zápasy, výsledky, tabulka a statistiky hráčů halového kriketového turnaje ${title}.`,
      }),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function IndoorTournamentView({ lang, slug }: { lang: Lang; slug: string }) {
  const d = (await getIndoorTournamentBySlug(slug)) as TournamentData | null;
  if (!d?.tournament) notFound();
  return <TournamentFollow initial={d} slug={slug} lang={lang} />;
}
