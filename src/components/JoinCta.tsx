import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import { ArrowRight } from '@/components/ui/Icons';
import { CLUB_EMAIL } from '@/lib/club';
import { localePath, tr, type Lang } from '@/lib/i18n';

type JoinCtaProps = {
  lang?: Lang;
  title?: string;
  text?: string;
};

// Gold "join us" band that closes most pages.
export default function JoinCta({ lang = 'en', title, text }: JoinCtaProps) {
  return (
    <section className="bg-gold text-ink">
      <Reveal className="container-x flex flex-wrap items-end justify-between gap-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="h-sub text-[20px] tracking-[0.1em]">{tr(lang, { en: 'Every level welcome', cs: 'Vítáme hráče všech úrovní' })}</p>
          <h2 className="display mt-3 text-[clamp(40px,7vw,92px)]">
            {title ?? tr(lang, { en: 'Join the Spartan family', cs: 'Přidejte se ke Spartans' })}
          </h2>
          <p className="mt-4 text-lg leading-relaxed">
            {text ??
              tr(lang, {
                en: 'All backgrounds, every skill level. Weekly training, league and tournament cricket in Prague, and social events through the year.',
                cs: 'Bez ohledu na původ či zkušenosti. Pravidelné tréninky, ligový a turnajový kriket v Praze a společenské akce po celý rok.',
              })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={localePath(lang, '/join')} className="btn btn-dark btn-lg">
            {tr(lang, { en: 'Apply to join', cs: 'Chci se přidat' })}
            <ArrowRight size={18} className="btn-arrow" />
          </Link>
          <a href={`mailto:${CLUB_EMAIL}`} className="btn btn-ghost-dark btn-lg">
            {tr(lang, { en: 'Email us', cs: 'Napište nám' })}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
