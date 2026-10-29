import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getNews } from '@/lib/data';
import { getSitePhotos } from '@/lib/drive';
import { PHOTO_SLOT, sitePhotoUrl } from '@/lib/photos';
import { isOptimisable } from '@/lib/images';
import type { NewsPost } from '@/types/supabase';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import JsonLd from '@/components/JsonLd';
import { excerpt } from '@/components/NewsBody';
import { LOCALE, localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /news (English) and /cs/news (Czech).

export const CATEGORY: Record<NewsPost['category'], { en: string; cs: string }> = {
  club: { en: 'Club news', cs: 'Zprávy z klubu' },
  match_report: { en: 'Match report', cs: 'Zpráva ze zápasu' },
};

export function newsMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/news',
    title: tr(lang, { en: 'News', cs: 'Novinky' }),
    description: tr(lang, {
      en: 'News and match reports from Prague Spartans Cricket Club: results, club events and what is coming up.',
      cs: 'Novinky a zprávy ze zápasů kriketového klubu Prague Spartans: výsledky, klubové akce a co chystáme.',
    }),
  });
}

export const postTitle = (lang: Lang, p: NewsPost) => (lang === 'cs' && p.title_cs ? p.title_cs : p.title);
export const postBody = (lang: Lang, p: NewsPost) => (lang === 'cs' && p.body_cs ? p.body_cs : p.body);
export const postDate = (lang: Lang, p: NewsPost) =>
  new Date(p.published_at ?? p.created_at).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Prague' });

export function NewsCard({ post, lang, priority = false }: { post: NewsPost; lang: Lang; priority?: boolean }) {
  return (
    <Link href={localePath(lang, `/news/${post.slug}`)} className="card card-hover group block h-full overflow-hidden">
      <div className="zoom-frame relative aspect-[16/9] bg-panel-2">
        {post.cover_url && (
          <Image src={post.cover_url} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" unoptimized={!isOptimisable(post.cover_url)} priority={priority} />
        )}
      </div>
      <div className="p-5">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="chip">{tr(lang, CATEGORY[post.category])}</span>
          <time dateTime={post.published_at ?? post.created_at}>{postDate(lang, post)}</time>
        </p>
        <h2 className="h-sub mt-3 text-[24px] leading-tight">{postTitle(lang, post)}</h2>
        <p className="mt-2 text-sand">{excerpt(postBody(lang, post))}</p>
      </div>
    </Link>
  );
}

export default async function NewsView({ lang, category }: { lang: Lang; category?: string }) {
  const [all, photos] = await Promise.all([getNews(), getSitePhotos()]);
  const active = category === 'club' || category === 'match_report' ? category : null;
  const posts = active ? all.filter((p) => p.category === active) : all;
  const chips: { id: string | null; label: string }[] = [
    { id: null, label: tr(lang, { en: 'All', cs: 'Vše' }) },
    { id: 'club', label: tr(lang, CATEGORY.club) },
    { id: 'match_report', label: tr(lang, { en: 'Match reports', cs: 'Zprávy ze zápasů' }) },
  ];

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'News', cs: 'Novinky' }), '/news']])} />
      <PageHero
        eyebrow={tr(lang, { en: 'Club news', cs: 'Klubové zprávy' })}
        title={tr(lang, { en: 'News', cs: 'Novinky' })}
        intro={tr(lang, {
          en: 'Results, match reports and club life from Prague Spartans.',
          cs: 'Výsledky, zprávy ze zápasů a život v klubu Prague Spartans.',
        })}
        image={sitePhotoUrl(photos, PHOTO_SLOT.news)}
      />
      <section className="container-x py-14 sm:py-20">
        <nav aria-label={tr(lang, { en: 'News categories', cs: 'Kategorie novinek' })} className="mb-8 flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.id ?? 'all'}
              href={localePath(lang, c.id ? `/news?category=${c.id}` : '/news')}
              aria-current={active === c.id ? 'page' : undefined}
              className={`min-h-11 content-center px-4 font-display text-[15px] font-bold uppercase italic transition-colors ${active === c.id ? 'bg-gold text-ink' : 'border border-cream/22 text-cream hover:border-gold'}`}
            >
              {c.label}
            </Link>
          ))}
        </nav>
        {posts.length === 0 ? (
          <EmptyState title={tr(lang, { en: 'No news yet', cs: 'Zatím žádné novinky' })}>
            {tr(lang, { en: 'The first posts are on their way. Check back soon.', cs: 'První příspěvky připravujeme. Zastavte se brzy znovu.' })}
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 5) * 70}>
                <NewsCard post={p} lang={lang} priority={i === 0} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
