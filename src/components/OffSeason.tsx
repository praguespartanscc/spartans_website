import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { COMPETITIONS, TRAINING } from '@/lib/club';
import { getHonours } from '@/lib/data';
import { localePath, tr, type Lang } from '@/lib/i18n';

// Shown instead of an empty fixture list between seasons: what happens next, last season's
// honours and the official tables, so the page never looks abandoned.
export default async function OffSeason({ lang = 'en' }: { lang?: Lang }) {
  const all = await getHonours();
  const season = Math.max(...all.map((h) => h.year));
  const honours = all.filter((h) => h.year === season);
  const competitions = COMPETITIONS.filter((c) => c.year === season);
  const { weekly } = TRAINING;

  return (
    <Reveal className="card grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="eyebrow">{tr(lang, { en: 'Between seasons', cs: 'Mezi sezónami' })}</p>
        <h2 className="h-sub mt-3 text-[clamp(28px,3.4vw,40px)]">
          {tr(lang, { en: 'New fixtures are on their way', cs: 'Nový rozpis zápasů připravujeme' })}
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-sand">
          {tr(lang, {
            en: `The union publishes the new season's fixtures before it starts, and they will appear here. Until then we keep training every ${weekly.day.en} from ${weekly.time.replace('–', ' to ')} in the cricket nets at ${weekly.venue.name}, and indoors through the winter.`,
            cs: `Svaz zveřejní rozpis nové sezóny před jejím začátkem a hned ho tu uvidíte. Do té doby trénujeme každý ${weekly.day.cs} od ${weekly.time.replace('–', ' do ')} v kriketových sítích v Tenisovém centru Olšanská a v zimě v hale.`,
          })}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={localePath(lang, '/practices')} className="btn btn-gold">
            {tr(lang, { en: 'Training times', cs: 'Termíny tréninků' })} <ArrowRight size={16} className="btn-arrow" />
          </Link>
          <Link href={localePath(lang, '/join')} className="btn btn-outline">
            {tr(lang, { en: 'Try a free session', cs: 'Přijďte na trénink zdarma' })}
          </Link>
        </div>
      </div>

      <div>
        <p className="eyebrow">{tr(lang, { en: `The ${season} season`, cs: `Sezóna ${season}` })}</p>
        <ul className="mt-4 space-y-3 text-sand">
          {honours.map((h) => (
            <li key={h.en} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 bg-gold" />
              <span>{h[lang]}</span>
            </li>
          ))}
        </ul>
        {competitions.length > 0 && (
          <ul className="mt-6 flex flex-col gap-2 border-t border-cream/12 pt-5">
            {competitions.map((c) => (
              <li key={c.key}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="link-arrow text-[16px]">
                  {tr(lang, { en: `${c.name.en}: final table`, cs: `${c.name.cs}: konečná tabulka` })} <ArrowUpRight size={15} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  );
}
