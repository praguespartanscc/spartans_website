import type { Metadata } from 'next';
import { getMatches, pragueToday } from '@/lib/data';
import { SQUADS } from '@/lib/club';
import PageHero from '@/components/ui/PageHero';
import FixturesBoard from '@/components/FixturesBoard';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Fixtures & Results',
  description:
    'Upcoming matches and results for Prague Spartans Cricket Club: league, tournament and friendly cricket in Prague and across the Czech Republic.',
  alternates: { canonical: '/fixtures' },
  openGraph: { url: '/fixtures', title: 'Prague Spartans fixtures & results' },
};

export default async function FixturesPage() {
  const matches = await getMatches();

  return (
    <>
      <PageHero
        eyebrow="Season calendar"
        title={
          <>
            Fixtures <span className="text-gold">&amp;</span> results
          </>
        }
        intro="Every match across the Vanguards, Mobilizers and Strikers. Open a match for the scorecard, live stream and details."
        image="/home_carousel1.jpeg"
      />
      <section className="py-12 sm:py-16">
        <div className="container-x">
          <FixturesBoard matches={matches} today={pragueToday()} squads={SQUADS.map((s) => s.name)} />
        </div>
      </section>
    </>
  );
}
