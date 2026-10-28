'use client';

import { useState, useEffect } from 'react';
import { getAllPractices } from '@/services/practiceService';
import type { Practice } from '@/types/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { PracticeRow } from '@/components/PracticeSection';
import JoinCta from '@/components/JoinCta';
import Link from 'next/link';

const PRACTICES_PER_PAGE = 20;

export default function PracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadPractices() {
      try {
        if (!isSupabaseConfigured) {
          setPractices([]);
          return;
        }
        setPractices(await getAllPractices());
      } catch (err) {
        console.error('Failed to load practices:', err);
        setError('We could not load practice sessions right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPractices();
  }, []);

  const totalPages = Math.ceil(practices.length / PRACTICES_PER_PAGE);
  const currentPractices = practices.slice((currentPage - 1) * PRACTICES_PER_PAGE, currentPage * PRACTICES_PER_PAGE);

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

      <section className="py-12 sm:py-16">
        <div className="container-x max-w-4xl">
          {isLoading ? (
            <SkeletonList rows={5} height={84} label="Loading practice sessions" />
          ) : error ? (
            <p className="alert-error">{error}</p>
          ) : practices.length === 0 ? (
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
            <div key={currentPage} className="page-enter flex flex-col gap-3">
              {currentPractices.map((practice) => (
                <PracticeRow key={practice.id} practice={practice} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Practice pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`h-11 w-11 rounded-full text-[15px] font-semibold transition-colors ${
                    currentPage === page ? 'bg-gold text-ink' : 'text-muted hover:bg-cream/10 hover:text-cream'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          )}
        </div>
      </section>

      <JoinCta title="Come to nets" text="New faces are always welcome at practice. Tell us a little about yourself and we'll save you a spot." />
    </>
  );
}
