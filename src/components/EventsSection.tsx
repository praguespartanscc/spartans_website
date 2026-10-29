import Link from 'next/link';
import type { Match } from '@/types/supabase';
import MatchRow from '@/components/MatchRow';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowRight } from '@/components/ui/Icons';
import { localePath, tr, type Lang } from '@/lib/i18n';

type Props = { upcoming: Match[]; latest: Match | null; today: string; lang?: Lang };

export default function EventsSection({ upcoming, latest, today, lang = 'en' }: Props) {
  return (
    <section className="bg-brown py-20 sm:py-28" aria-labelledby="fixtures-heading">
      <div className="container-x">
        <SectionHeading
          id="fixtures-heading"
          eyebrow={tr(lang, { en: 'On the calendar', cs: 'V kalendáři' })}
          title={tr(lang, { en: 'Upcoming matches', cs: 'Nadcházející zápasy' })}
          intro={tr(lang, {
            en: 'League, T10 and tournament matches for all three Spartans squads. Home games are played at Vinoř Cricket Ground in Prague 9. Come and support us.',
            cs: 'Ligové zápasy, T10 a turnaje všech tří týmů Spartans. Domácí zápasy hrajeme na kriketovém hřišti ve Vinoři v Praze 9. Přijďte nás podpořit.',
          })}
          action={
            <Link href={localePath(lang, '/fixtures')} className="link-arrow">
              {tr(lang, { en: 'All fixtures & results', cs: 'Všechny zápasy a výsledky' })} <ArrowRight size={18} />
            </Link>
          }
        />

        {upcoming.length === 0 ? (
          <EmptyState
            title={tr(lang, { en: 'No matches scheduled yet', cs: 'Zatím nejsou naplánované žádné zápasy' })}
            action={
              <Link href={localePath(lang, '/fixtures')} className="link-arrow">
                {tr(lang, { en: 'See past results', cs: 'Předchozí výsledky' })} <ArrowRight size={18} />
              </Link>
            }
          >
            {tr(lang, {
              en: 'The new fixture list is on its way. Follow us on Instagram for the latest.',
              cs: 'Nový rozpis zápasů připravujeme. Novinky najdete na našem Instagramu.',
            })}
          </EmptyState>
        ) : (
          <div className="border-t border-cream/20">
            {upcoming.map((match, i) => (
              <Reveal key={match.id} delay={i * 70}>
                <MatchRow match={match} live={match.date === today && !!match.stream_url} lang={lang} />
              </Reveal>
            ))}
          </div>
        )}

        {latest && (
          <Reveal className="mt-12">
            <p className="eyebrow mb-3 text-gold-hi">{tr(lang, { en: 'Latest result', cs: 'Poslední výsledek' })}</p>
            <div className="border-t border-cream/20">
              <MatchRow match={latest} lang={lang} />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
