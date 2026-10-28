import type { Metadata } from 'next';
import Link from 'next/link';
import { getPractices, pragueToday } from '@/lib/data';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import PracticeRow from '@/components/PracticeRow';
import JoinCta from '@/components/JoinCta';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Practice Sessions',
  description:
    'Cricket practice in Prague with Prague Spartans Cricket Club: nets for every level, plus batting, bowling and fielding sessions. Beginners welcome.',
  alternates: { canonical: '/practices' },
  openGraph: { url: '/practices', title: 'Cricket practice in Prague · Prague Spartans' },
};

export default async function PracticesPage() {
  const today = pragueToday();
  const all = await getPractices();
  const upcoming = all.filter((p) => p.date >= today);
  const past = all.filter((p) => p.date < today).reverse().slice(0, 8);

  return (
    <>
      <PageHero
        eyebrow="Train with us"
        title={
          <>
            Practice <span className="text-gold">sessions</span>
          </>
        }
        intro="Regular nets for every level, plus focused batting, bowling and fielding work. Indoors through winter, outdoors in season."
        image="/home_carousel.jpeg"
        imagePosition="center 40%"
      />

      <section className="py-12 sm:py-16" aria-labelledby="upcoming-practices">
        <div className="container-x max-w-4xl">
          <h2 id="upcoming-practices" className="h-sub mb-5 text-[30px]">
            Coming up
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="No sessions scheduled"
              action={
                <Link href="/contact" className="btn btn-gold">
                  Ask about the next session
                </Link>
              }
            >
              The practice calendar is empty right now. Get in touch and we&apos;ll let you know when nets are on.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((practice) => (
                <PracticeRow key={practice.id} practice={practice} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="group mt-14">
              <summary className="h-sub cursor-pointer list-none text-[24px] text-muted transition-colors hover:text-cream">
                Recent sessions <span className="font-display text-[16px] text-dim">{past.length}</span>
                <span className="ml-2 inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-5 flex flex-col gap-3">
                {past.map((practice) => (
                  <PracticeRow key={practice.id} practice={practice} past />
                ))}
              </div>
            </details>
          )}
        </div>
      </section>

      <JoinCta title="Come to nets" text="New faces are always welcome at practice. Tell us a little about yourself and we'll save you a spot." />
    </>
  );
}
