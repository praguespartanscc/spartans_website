import Link from 'next/link';
import type { NewsPost } from '@/types/supabase';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';
import { NewsCard } from '@/views/NewsView';
import { localePath, tr, type Lang } from '@/lib/i18n';

// The three newest posts on the home page. Hidden until there is a post.
export default function NewsSection({ posts, lang = 'en' }: { posts: NewsPost[]; lang?: Lang }) {
  if (posts.length === 0) return null;
  return (
    <section className="border-t border-cream/12 py-20 sm:py-28" aria-labelledby="news-heading">
      <div className="container-x">
        <SectionHeading
          id="news-heading"
          eyebrow={tr(lang, { en: 'News', cs: 'Novinky' })}
          title={tr(lang, { en: 'Latest from the club', cs: 'Novinky z klubu' })}
          action={
            <Link href={localePath(lang, '/news')} className="link-arrow">
              {tr(lang, { en: 'All news', cs: 'Všechny novinky' })} <ArrowRight size={18} />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <NewsCard post={p} lang={lang} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
