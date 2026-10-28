import Link from 'next/link';
import type { Match } from '@/types/supabase';
import MatchRow from '@/components/MatchRow';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowRight } from '@/components/ui/Icons';

type Props = { upcoming: Match[]; latest: Match | null; today: string };

export default function EventsSection({ upcoming, latest, today }: Props) {
  return (
    <section className="bg-brown py-20 sm:py-28" aria-labelledby="fixtures-heading">
      <div className="container-x">
        <SectionHeading
          id="fixtures-heading"
          eyebrow="On the calendar"
          title="Upcoming matches"
          intro="Today we fight. Today we rise. Come and support the Spartans across all three squads."
          action={
            <Link href="/fixtures" className="link-arrow">
              All fixtures & results <ArrowRight size={18} />
            </Link>
          }
        />

        {upcoming.length === 0 ? (
          <EmptyState
            title="No matches scheduled yet"
            action={
              <Link href="/fixtures" className="link-arrow">
                See past results <ArrowRight size={18} />
              </Link>
            }
          >
            The new fixture list is on its way. Follow us on Instagram for the latest.
          </EmptyState>
        ) : (
          <div className="border-t border-cream/20">
            {upcoming.map((match, i) => (
              <Reveal key={match.id} delay={i * 70}>
                <MatchRow match={match} live={match.date === today && !!match.stream_url} />
              </Reveal>
            ))}
          </div>
        )}

        {latest && (
          <Reveal className="mt-12">
            <p className="eyebrow mb-3 text-gold-hi">Latest result</p>
            <div className="border-t border-cream/20">
              <MatchRow match={latest} />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
