import type { Metadata } from 'next';
import Image from 'next/image';
import { getAchievements } from '@/lib/data';
import { getSitePhotos } from '@/lib/drive';
import { PHOTO_SLOT, sitePhotoUrl } from '@/lib/photos';
import { isOptimisable } from '@/lib/images';
import { HONOURS } from '@/lib/club';
import type { Achievement } from '@/types/supabase';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import JoinCta from '@/components/JoinCta';
import JsonLd from '@/components/JsonLd';
import { Shield } from '@/components/ui/Icons';
import { tr, type Lang } from '@/lib/i18n';
import { pageMeta } from '@/lib/seo';
import { breadcrumbs } from '@/lib/structured';

// Shared by /achievements (English) and /cs/achievements (Czech).

export const RESULT: Record<Achievement['result'], { en: string; cs: string }> = {
  winners: { en: 'Winners', cs: 'Vítězové' },
  runners_up: { en: 'Runners-up', cs: 'Druhé místo' },
  semi_finals: { en: 'Semi-finals', cs: 'Semifinále' },
  award: { en: 'Award', cs: 'Ocenění' },
  other: { en: 'Achievement', cs: 'Úspěch' },
};

export function achievementsMeta(lang: Lang): Metadata {
  return pageMeta({
    lang,
    path: '/achievements',
    title: tr(lang, { en: 'Achievements', cs: 'Úspěchy' }),
    description: tr(lang, {
      en: 'Titles, finals and awards won by Prague Spartans Cricket Club and its Vanguards, Mobilizers and Strikers squads, season by season.',
      cs: 'Tituly, finále a ocenění kriketového klubu Prague Spartans a jeho týmů Vanguards, Mobilizers a Strikers sezónu po sezóně.',
    }),
  });
}

// Before the achievements table exists, show the built-in list so the page is never empty.
function fallback(): Achievement[] {
  return HONOURS.map((h, i) => ({ id: -i - 1, season: h.year, title: h.en, title_cs: h.cs, team: null, result: /winners/i.test(h.en) ? 'winners' : 'other', photo_url: null, note: null, note_cs: null, sort_order: i }));
}

export default async function AchievementsView({ lang }: { lang: Lang }) {
  const [rows, photos] = await Promise.all([getAchievements(), getSitePhotos()]);
  const list = rows.length ? rows : fallback();
  const seasons = [...new Set(list.map((a) => a.season))].sort((a, b) => b - a);

  return (
    <>
      <JsonLd data={breadcrumbs(lang, [[tr(lang, { en: 'Achievements', cs: 'Úspěchy' }), '/achievements']])} />
      <PageHero
        eyebrow={tr(lang, { en: 'Honours board', cs: 'Síň úspěchů' })}
        title={tr(lang, { en: 'Achievements', cs: 'Úspěchy' })}
        intro={tr(lang, {
          en: 'Titles, finals and awards, season by season.',
          cs: 'Tituly, finále a ocenění sezónu po sezóně.',
        })}
        image={sitePhotoUrl(photos, PHOTO_SLOT.achievements)}
      />
      <div className="container-x space-y-16 py-14 sm:py-20">
        {seasons.length === 0 && (
          <EmptyState title={tr(lang, { en: 'Nothing here yet', cs: 'Zatím tu nic není' })}>
            {tr(lang, { en: 'Achievements appear here as the club adds them.', cs: 'Úspěchy se tu objeví, jakmile je klub přidá.' })}
          </EmptyState>
        )}
        {seasons.map((season) => (
          <section key={season} aria-labelledby={`season-${season}`}>
            <div className="flex items-baseline gap-4 border-b border-gold pb-3">
              <h2 id={`season-${season}`} className="h-section">
                {season}
              </h2>
              <span className="text-muted">{tr(lang, { en: 'season', cs: 'sezóna' })}</span>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list
                .filter((a) => a.season === season)
                .map((a, i) => (
                  <Reveal as="li" key={a.id} delay={Math.min(i, 5) * 70} className="card overflow-hidden">
                    <div className="relative grid aspect-[16/10] place-items-center bg-panel-2">
                      {a.photo_url ? (
                        <Image src={a.photo_url} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" unoptimized={!isOptimisable(a.photo_url)} />
                      ) : (
                        <Shield size={56} className="text-gold" />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className={`chip ${a.result === 'winners' ? 'border-gold text-gold' : ''}`}>{tr(lang, RESULT[a.result])}</span>
                        {a.team && <span className="text-sm text-muted">{a.team}</span>}
                      </p>
                      <h3 className="h-sub mt-3 text-[22px] leading-tight">{lang === 'cs' && a.title_cs ? a.title_cs : a.title}</h3>
                      {(a.note || a.note_cs) && <p className="mt-2 text-sand">{lang === 'cs' && a.note_cs ? a.note_cs : a.note}</p>}
                    </div>
                  </Reveal>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <JoinCta lang={lang} />
    </>
  );
}
