'use client';

import Link from 'next/link';
import { useUpcomingMatches } from '@/hooks/useUpcomingMatches';
import MatchRow from '@/components/MatchRow';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal from '@/components/ui/Reveal';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ArrowRight } from '@/components/ui/Icons';

const EventsSection = () => {
  const { matches, isLoading, error } = useUpcomingMatches();
  const shown = matches.slice(0, 4);

  return (
    <section className="bg-ink-2 py-20 sm:py-28" aria-labelledby="fixtures-heading">
      <div className="container-x">
        <SectionHeading
          id="fixtures-heading"
          eyebrow="On the calendar"
          title="Upcoming matches"
          intro="Come and support the Spartans. Every fixture across our three squads."
          action={
            <Link href="/fixtures" className="link-arrow">
              All fixtures & results <ArrowRight size={18} />
            </Link>
          }
        />

        {isLoading ? (
          <SkeletonList rows={3} label="Loading upcoming matches" />
        ) : error ? (
          <p className="alert-error">{error}</p>
        ) : shown.length === 0 ? (
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
          <div className="border-t border-cream/12">
            {shown.map((match, i) => (
              <Reveal key={match.id} delay={i * 70}>
                <MatchRow match={match} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
