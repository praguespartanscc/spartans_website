import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIndoorMatchBySlug } from '@/lib/data';
import { pageMeta } from '@/lib/seo';
import { tr, type Lang } from '@/lib/i18n';
import IndoorFollow, { type FollowData } from '@/components/indoor/IndoorFollow';

// Public, read only page for an indoor match, reached through the scorer's share link.
// Kept out of search engines and the sitemap.
export async function indoorFollowMeta(lang: Lang, slug: string): Promise<Metadata> {
  const m = await getIndoorMatchBySlug(slug);
  const title = m ? `${m.team_a} v ${m.team_b}` : tr(lang, { en: 'Indoor match', cs: 'Halový zápas' });
  return {
    ...pageMeta({
      lang,
      path: `/indoor/${slug}`,
      title: `${title} | ${tr(lang, { en: 'Indoor score', cs: 'Halové skóre' })}`,
      description: tr(lang, {
        en: `Live score and scorecard of the indoor cricket match ${title}.`,
        cs: `Průběžné skóre a výsledková listina halového kriketového zápasu ${title}.`,
      }),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function IndoorFollowView({ lang, slug }: { lang: Lang; slug: string }) {
  const m = await getIndoorMatchBySlug(slug);
  if (!m) notFound();
  return <IndoorFollow initial={m as unknown as FollowData} slug={slug} lang={lang} />;
}
