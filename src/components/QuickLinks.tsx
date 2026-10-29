import Link from 'next/link';
import { TRAINING } from '@/lib/club';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

// Phones: the four things people come for, one tap each, right under the hero.
export default function QuickLinks({ lang = 'en' }: { lang?: Lang }) {
  const { weekly } = TRAINING;
  const tiles = [
    { href: '/fixtures', title: { en: 'Matches', cs: 'Zápasy' }, text: { en: 'Fixtures and results', cs: 'Rozpis a výsledky' } },
    { href: '/practices', title: { en: 'Training', cs: 'Tréninky' }, text: { en: `${weekly.day.en} ${weekly.time}`, cs: `${weekly.day.cs} ${weekly.time}` } },
    { href: '/live', title: { en: 'Live', cs: 'Živě' }, text: { en: 'Scores, stream, nets today', cs: 'Skóre, přenos, dnešní trénink' } },
    { href: '/join', title: { en: 'Join', cs: 'Přidejte se' }, text: { en: 'Beginners welcome', cs: 'Začátečníci vítáni' }, gold: true },
  ];
  return (
    <nav aria-label={tr(lang, { en: 'Quick links', cs: 'Rychlé odkazy' })} className="container-x grid grid-cols-2 gap-2 py-5 lg:hidden">
      {tiles.map((t) => (
        <Link
          key={t.href}
          href={localePath(lang, t.href)}
          className={`flex min-h-[84px] flex-col justify-between p-3.5 transition-transform duration-150 active:scale-[0.98] ${t.gold ? 'bg-gold text-ink' : 'card'}`}
        >
          <span className="flex items-center justify-between font-display text-[20px] font-extrabold uppercase italic leading-none">
            {tr(lang, t.title)} <ArrowRight size={16} className={t.gold ? 'text-ink' : 'text-gold'} />
          </span>
          <span className={`text-[13px] leading-snug ${t.gold ? 'text-ink' : 'text-muted'}`}>{tr(lang, t.text)}</span>
        </Link>
      ))}
    </nav>
  );
}
