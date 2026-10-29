import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNews, getNewsPost } from '@/lib/data';
import { isOptimisable } from '@/lib/images';
import JsonLd from '@/components/JsonLd';
import NewsBody, { excerpt } from '@/components/NewsBody';
import Reveal from '@/components/ui/Reveal';
import { ArrowLeft } from '@/components/ui/Icons';
import { CATEGORY, NewsCard, postBody, postDate, postTitle } from '@/views/NewsView';
import { CLUB_NAME, SITE_URL } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs, clubRef } from '@/lib/structured';

// One news post, shared by /news/[slug] and /cs/news/[slug].

export async function newsPostMeta(lang: Lang, slug: string): Promise<Metadata> {
  const post = await getNewsPost(slug);
  if (!post) return { title: tr(lang, { en: 'News', cs: 'Novinky' }), robots: { index: false } };
  return pageMeta({
    lang,
    path: `/news/${slug}`,
    title: postTitle(lang, post),
    description: excerpt(postBody(lang, post), 155),
    type: 'article',
    ...(post.cover_url ? { images: [{ url: post.cover_url, width: 1200, height: 630, alt: postTitle(lang, post) }] } : {}),
  });
}

export default async function NewsPostView({ lang, slug }: { lang: Lang; slug: string }) {
  const post = await getNewsPost(slug);
  if (!post) notFound();
  const more = (await getNews()).filter((p) => p.id !== post.id).slice(0, 3);
  const title = postTitle(lang, post);
  const englishOnly = lang === 'cs' && !post.body_cs;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: title,
          datePublished: post.published_at ?? post.created_at,
          dateModified: post.updated_at ?? post.published_at ?? post.created_at,
          inLanguage: englishOnly ? 'en' : lang,
          ...(post.cover_url ? { image: [post.cover_url] } : {}),
          author: clubRef,
          publisher: clubRef,
          mainEntityOfPage: `${SITE_URL}${localePath(lang, `/news/${post.slug}`)}`,
        }}
      />
      <JsonLd
        data={breadcrumbs(lang, [
          [tr(lang, { en: 'News', cs: 'Novinky' }), '/news'],
          [title, `/news/${post.slug}`],
        ])}
      />
      <article className="container-x max-w-3xl py-12 sm:py-16">
        <Link href={localePath(lang, '/news')} className="link-arrow">
          <ArrowLeft size={18} /> {tr(lang, { en: 'All news', cs: 'Všechny novinky' })}
        </Link>
        <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="chip">{tr(lang, CATEGORY[post.category])}</span>
          <time dateTime={post.published_at ?? post.created_at}>{postDate(lang, post)}</time>
        </p>
        <h1 className="display mt-4 text-[clamp(34px,6vw,60px)] leading-[1.05]">{title}</h1>
        {post.cover_url && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-panel-2">
            <Image src={post.cover_url} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" unoptimized={!isOptimisable(post.cover_url)} />
          </div>
        )}
        {englishOnly && <p className="mt-8 border-l-2 border-gold pl-4 text-sm text-muted">Tento článek je zatím jen v angličtině.</p>}
        <div className="mt-8">
          <NewsBody text={postBody(lang, post)} />
        </div>
        <p className="mt-10 text-sm text-muted">{CLUB_NAME}</p>
      </article>
      {more.length > 0 && (
        <section className="border-t border-cream/12 py-14 sm:py-20" aria-labelledby="more-news">
          <div className="container-x">
            <h2 id="more-news" className="h-sub mb-6 text-[28px]">
              {tr(lang, { en: 'More news', cs: 'Další novinky' })}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p, i) => (
                <Reveal key={p.id} delay={i * 70}>
                  <NewsCard post={p} lang={lang} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
